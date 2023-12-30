const cron = require("node-cron");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const mongoose = require("mongoose");
const url = "mongodb://127.0.0.1:27017/mmo-rts";
const loadBoardState = require("./controllers/board/loadBoardState");
const saveBoardState = require("./controllers/board/saveBoardState");
const resetActions = require("./controllers/user/resetActions");
const TaskTimestamp = require("./models/taskTimestamp");
const loadNextTaskTimestamp = require("./controllers/taskTimestamp/loadNextTaskTimestamp");
const addAction = require("./controllers/user/addAction");
const User = require("./models/user");
const canUserAfford = require("./controllers/user/canUserAfford");
const updateUserResources = require("./controllers/user/updateUserResources");
const socket = require("./socket");
const {
  buildActionsQueue,
  spawningActionsQueue,
  resourceGatheringActionsQueue,
  conflictActionsQueue,
  moveActionsQueue,
} = require("./actionsQueue");
const jwt = require("jsonwebtoken");
const getBoardSize = require("./CONSTANTS/getBoardSize");
const cookie = require("cookie");
const express = require("express");
const http = require("http");
const getTimerAmount = require("./CONSTANTS/getTimerAmount");
const addBuilding = require("./controllers/user/addBuilding");
const addUnit = require("./controllers/user/addUnit");
const deleteBuilding = require("./controllers/user/deleteBuilding");
const deleteUnit = require("./controllers/user/deleteUnit");
const app = express();
let server;
if (process.env.NODE_ENV === "production") {
  // Use HTTPS with SSL certificates in production
  const https = require("https");
  const fs = require("fs");

  const privateKey = fs.readFileSync(
    "/etc/letsencrypt/live/mmo-rts.com/privkey.pem",
    "utf8"
  );
  const certificate = fs.readFileSync(
    "/etc/letsencrypt/live/mmo-rts.com/fullchain.pem",
    "utf8"
  );
  const credentials = { key: privateKey, cert: certificate };

  server = https.createServer(credentials, app);
  server.listen(3000, () => {
    console.log("Server listening on port 3000");
  });
} else {
  // Use plain HTTP for development
  server = http.createServer(app);
  server.listen(3000, () => {
    console.log("Server listening on port 3000");
  });
}

mongoose.connect(url, { useNewUrlParser: true });
const db = mongoose.connection;
let board;
db.once("open", async () => {
  console.log("Database connected:", url);
  board = await loadBoardState(db);
  nextTaskTimestamp = await loadNextTaskTimestamp();
});

db.on("error", (err) => {
  console.error("connection error:", err);
});

const bodyParser = require("body-parser");

const cors = require("cors");
// Initialize socket.io
const io = socket.initializeSocket(server);

// Configure CORS for Socket.IO
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;
  const allowedOrigin =
    process.env.NODE_ENV === "production"
      ? "https://mmo-rts.com"
      : "http://localhost:8080";
  if (allowedOrigin === origin) {
    next();
  } else {
    return next(new Error("CORS not allowed"));
  }
});

// Configure CORS for Express
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://mmo-rts.com"
        : "http://localhost:8080",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Serve the Vue.js app
app.use(express.static("dist"));

let numUsers = 0;

// Handle Socket.IO connections
io.on("connection", (socket) => {
  numUsers++;
  console.log("A user connected", socket.id);
  io.emit("user count", numUsers);

  socket.on("get user count", () => {
    io.emit("user count", numUsers);
  });

  socket.on("getInitialValues", () => {
    socket.emit("updateBoard", board);
    broadcastRemainingTime();
  });

  // Listen for actions from the client
  socket.on("action", (action) => {
    let userId;
    for (const [id, userSocket] of Object.entries(userSockets)) {
      if (userSocket === socket) {
        userId = id;
        break;
      }
    }

    if (!userId) {
      socket.emit("authentication_error");
      socket.disconnect();
      return;
    }

    handleAction(socket, action, userId);
  });

  // Listen for the 'loggedIn' event
  socket.on("loggedIn", () => {
    // Parse the cookie from the handshake request
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies.token;
    console.log(token);

    if (token) {
      // Verify the JWT and get the user ID
      let decoded = jwt.verify(token, process.env.AUTH_SECRET_KEY);
      if (!decoded) {
        socket.emit("authentication_error");
        socket.disconnect();
        return;
      }
      // If the token is valid, add the socket to the userSockets dictionary
      const userId = decoded.id;
      userSockets[userId] = socket;
    }
  });

  socket.on("disconnect", () => {
    numUsers--;
    console.log("A user disconnected");
    io.emit("user count", numUsers);

    // Remove the socket from the userSockets dictionary
    for (let userId in userSockets) {
      if (userSockets[userId] === socket) {
        delete userSockets[userId];
        break;
      }
    }
  });
});

// Handle server shutdown
const gracefulShutdown = () => {
  console.log("Server is shutting down...");

  // Send the 'serverRestart' event to all connected clients
  io.sockets.emit("serverRestart");

  // Close the server
  server.close(() => {
    console.log("Server has been closed.");
    process.exit();
  });
};

// Listen for server shutdown signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// app.use((req, res, next) => {
//   console.log(`Received a ${req.method} request to ${req.url}`);
//   next();
// });

app.use(bodyParser.json());
// User routes
const UsersRoute = require("./routes/users.js");
app.use("/users", UsersRoute);

// Auth routes
const AuthRoute = require("./routes/auth.js");
app.use("/auth", AuthRoute);

const handleAction = async (socket, action, userId) => {
  console.log("Received action:", action);

  // Check if the user has actions left
  const user = await User.findById(userId);

  if (user.actions.length >= 10) {
    console.log("User has no actions left");

    // Increment userAttempts for this user or set it to 1 if it doesn't exist
    userAttempts[userId] = (userAttempts[userId] || 0) + 1;

    if (userAttempts[userId]) {
      if (userAttempts[userId] >= 13) {
        if (userSockets[userId]) {
          // Log the user out by emitting a 'forceLogout' event
          userSockets[userId].emit("forceLogout");
        }
      } else if (userAttempts[userId] >= 10) {
        if (userSockets[userId]) {
          // Emit a 'warning' event to the user's client
          userSockets[userId].emit(
            "warning",
            "You have no actions left. Continuing to try will result in being logged out."
          );
        }
      }
      return;
    }
  }

  // If the user has actions left, proceed with the action and reset the attempts
  let updatedUser = await addAction(action, userId);
  if (updatedUser) {
    socket.emit("updateUser", updatedUser);

    if (action.type === "build spawn" || action.type === "build tower") {
      buildActionsQueue.push({ action, userId });
    } else if (
      action.type === "spawn worker" ||
      action.type === "spawn axeman" ||
      action.type === "spawn archer"
    ) {
      spawningActionsQueue.push({ action, userId });
    } else if (action.type === "worker mine") {
      resourceGatheringActionsQueue.push({ action, userId });
    } else if (
      action.type === "tower shoot" ||
      action.type === "axeman attack" ||
      action.type === "worker attack" ||
      action.type === "archer shoot"
    ) {
      conflictActionsQueue.push({ action, userId });
    } else if (
      action.type === "move worker" ||
      action.type === "move axeman" ||
      action.type === "move archer"
    ) {
      moveActionsQueue.push({ action, userId });
    } else {
      console.log(
        "invalid action type from user",
        userId,
        "attempted action:",
        action
      );
    }
  } else {
    console.log("updated user not found. error here.");
  }
};

const processActions = async () => {
  for (const request of buildActionsQueue) {
    if (
      request.action.type === "build spawn" ||
      request.action.type === "build tower"
    ) {
      await processBuildAction(request.action, request.userId);
    }
  }
  buildActionsQueue.length = 0;

  for (const request of spawningActionsQueue) {
    if (request.action.type === "spawn worker") {
      await processSpawnWorkerAction(request.action, request.userId);
    } else if (request.action.type === "spawn axeman") {
      await processSpawnAxemanAction(request.action, request.userId);
    } else if (request.action.type === "spawn archer") {
      await processSpawnArcherAction(request.action, request.userId);
    }
  }
  spawningActionsQueue.length = 0;

  for (const request of resourceGatheringActionsQueue) {
    if (request.action.type === "worker mine") {
      await processWorkerMineAction(request.action, request.userId);
    }
  }
  resourceGatheringActionsQueue.length = 0;

  for (const request of conflictActionsQueue) {
    if (request.action.type === "axeman attack") {
      await processAxemanAttackAction(request.action, request.userId);
    } else if (request.action.type === "worker attack") {
      await processWorkerAttackAction(request.action, request.userId);
    } else if (request.action.type === "tower shoot") {
      await processTowerShootAction(request.action, request.userId);
    } else if (request.action.type === "archer shoot") {
      await processArcherShootAction(request.action, request.userId);
    }
  }
  conflictActionsQueue.length = 0;

  // need to clean up dead units or destroyed structures (below or equal to 0 hits) before move actions
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      let cell = board[y][x];
      if (cell.unit) {
        if (cell.unit.hits <= 0) {
          cell.unit = null;
        }
      } else if (cell.building) {
        if (cell.building.hits <= 0) {
          cell.building = null;
        }
      }
    }
  }

  for (const request of moveActionsQueue) {
    if (request.action.type === "move worker") {
      await processMoveWorkerAction(request.action, request.userId);
    } else if (request.action.type === "move axeman") {
      await processMoveAxemanAction(request.action, request.userId);
    } else if (request.action.type === "move archer") {
      await processMoveArcherAction(request.action, request.userId);
    }
  }
  moveActionsQueue.length = 0;

  // reset actions Taken of units and buildings so that every unit and building can take another action next turn
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      let cell = board[y][x];
      if (cell.unit && cell.unit.actionTaken) cell.unit.actionTaken = false;
      else if (cell.building && cell.building.actionTaken)
        cell.building.actionTaken = false;
    }
  }

  // Calculate the number of chunks in each dimension
  let availableChunks = [];
  let boardSize = getBoardSize();
  const chunksX = Math.ceil(boardSize / 10);
  const chunksY = Math.ceil(boardSize / 10);
  // Function to check if a cell has a unit or building within a 1-cell radius
  function hasUnitOrBuildingNearby(x, y) {
    for (let i = Math.max(0, y - 1); i <= Math.min(19, y + 1); i++) {
      for (let j = Math.max(0, x - 1); j <= Math.min(19, x + 1); j++) {
        if (!board[i][j] || (x == j && y === i)) continue;
        if (board[i][j].unit || board[i][j].building) {
          return true;
        }
      }
    }
    return false;
  }

  // Function to get a random cell within a chunk
  function getRandomCellInChunk(chunkX, chunkY) {
    const startX = chunkX * 10;
    const startY = chunkY * 10;
    const availableCells = [];

    for (let y = startY; y < startY + 10; y++) {
      for (let x = startX; x < startX + 10; x++) {
        if (
          !hasUnitOrBuildingNearby(x, y) &&
          !board[y][x].unit &&
          !board[y][x].resource &&
          board[y][x].terrain !== "tundra"
        ) {
          availableCells.push({ x, y });
        }
      }
    }

    if (availableCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCells.length);
      const { x, y } = availableCells[randomIndex];
      return { x, y };
    }

    return null;
  }
  // Iterate through each chunk on the map
  for (let chunkY = 0; chunkY < chunksY; chunkY++) {
    for (let chunkX = 0; chunkX < chunksX; chunkX++) {
      const startX = chunkX * 10;
      const startY = chunkY * 10;
      // Check if there is a deer in the current chunk
      let hasDeerInChunk = false;
      for (let y = startY; y < startY + 10; y++) {
        for (let x = startX; x < startX + 10; x++) {
          if (
            board &&
            board[y] &&
            board[y][x] &&
            board[y][x].unit &&
            board[y][x].unit.unitType === "deer"
          ) {
            hasDeerInChunk = true;

            // Generate random directions in the range [-1, 1] for both x and y
            const moveX = Math.floor(Math.random() * 3) - 1;
            const moveY = Math.floor(Math.random() * 3) - 1;

            // Calculate the new position based on the random directions within the chunk
            const newX = x + moveX;
            const newY = y + moveY;

            // Check if the new position is within the chunk boundaries
            if (
              newX >= startX &&
              newX < startX + 10 &&
              newY >= startY &&
              newY < startY + 10 &&
              board[newY] &&
              board[newY][newX] &&
              !board[newY][newX].unit &&
              !board[newY][newX].building &&
              !board[newY][newX].resource &&
              !board[newY][newX].terrain !== "tundra"
            ) {
              // Move the deer to the new position within the chunk
              board[newY][newX].unit = board[y][x].unit;
              board[y][x].unit = null;
            }

            break;
          }
        }
        if (hasDeerInChunk) {
          break;
        }
      }
      // If no deer in the chunk, add it to availableChunks array
      if (!hasDeerInChunk) {
        availableChunks.push({ chunkX, chunkY });
      }
    }
  }
  // Spawn the deers using the availableChunks array
  for (let i = 0; i < availableChunks.length; i++) {
    const { chunkX, chunkY } = availableChunks[i];
    const numAttempts = 2;
    let deerSpawned = false;

    for (let j = 0; j < numAttempts; j++) {
      const cell = getRandomCellInChunk(chunkX, chunkY);

      if (cell) {
        board[cell.y][cell.x].unit = {
          owner: "game",
          pos: { x: cell.x, y: cell.y },
          unitType: "deer",
          hits: 60,
          hitsMax: 60,
        };
        deerSpawned = true;
        break;
      }
    }

    if (deerSpawned) {
      // If deer is spawned in the current chunk, mark it as spawned and move to the next chunk
      availableChunks[i].spawned = true;
    }
  }

  // Save the updated board state to the database
  await saveBoardState(board);

  // Send the updated board state to all connected clients
  io.sockets.emit("updateBoard", board);
};

const processBuildAction = async (action, userId) => {
  const { x, y, structureType, username } = action.payload;
  if (!(await isValidUser(username, userId))) {
    return;
  }
  if (!(await canUserAfford(userId, structureType))) return;
  await addAction(action, userId);
  let buildingObject = {
    buildingId: uuidv4(),
    structureType,
    owner: username,
    pos: { x, y },
  };
  if (structureType === "structureTower") {
    buildingObject.damage = 100;
    buildingObject.range = 3;
    buildingObject.hits = 250;
    buildingObject.hitsMax = 250;
    buildingObject.actionTaken = false;
  } else if (structureType === "structureSpawn") {
    buildingObject.hits = 500;
    buildingObject.hitsMax = 500;
    buildingObject.actionTaken = false;
  }

  board[y][x].building = buildingObject;
  await updateUserResources(userId, { gold: structureType });
  await addBuilding(userId, buildingObject.buildingId);
};

const processTowerShootAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }

  const tower = board[y][x].building;
  const target = board[targetY][targetX];
  if (!target) return;
  if (!tower) return;
  if (tower.owner !== username) return;
  if (tower.structureType !== "structureTower") return;
  if (tower.actionTaken) {
    console.log("tower out of actions");
    return;
  }
  if (target.unit) target.unit.hits -= tower.damage;
  if (
    target.unit &&
    target.unit.unitType === "deer" &&
    target.unit.hits <= 0 &&
    target.unit.hits > -tower.damage
  ) {
    await updateUserResources(userId, { food: 100 });
  }
  if (target.building) target.building.hits -= tower.damage;
  tower.actionTaken = true;
};

const processAxemanAttackAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }

  const axeman = board[y][x].unit;
  const target = board[targetY][targetX];
  if (!target || (!target.unit && !target.building)) return;
  if (!axeman) return;
  if (axeman.owner !== username) return;
  if (axeman.unitType !== "axeman") return;
  if (axeman.actionTaken) {
    console.log("axeman out of non move actions");
    return;
  }
  if (target.unit) target.unit.hits -= axeman.damage;
  if (
    target.unit &&
    target.unit.unitType === "deer" &&
    target.unit.hits <= 0 &&
    target.unit.hits > -axeman.damage
  ) {
    await updateUserResources(userId, { food: 100 });
  }
  if (target.building) target.building.hits -= axeman.damage;
  axeman.actionTaken = true;
};

const processWorkerAttackAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }

  const worker = board[y][x].unit;
  const target = board[targetY][targetX];
  if (!target || (!target.unit && !target.building)) return;
  if (!worker) return;
  if (worker.owner !== username) return;
  if (worker.unitType !== "worker") return;
  if (worker.actionTaken) {
    console.log("worker out of non move actions");
    return;
  }
  if (target.unit) target.unit.hits -= worker.damage;
  if (
    target.unit &&
    target.unit.unitType === "deer" &&
    target.unit.hits <= 0 &&
    target.unit.hits > -worker.damage
  ) {
    await updateUserResources(userId, { food: 100 });
  }
  if (target.building) target.building.hits -= worker.damage;
  worker.actionTaken = true;
};

const processArcherShootAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }

  const archer = board[y][x].unit;
  const target = board[targetY][targetX];
  if (!target || (!target.unit && !target.building)) return;
  if (!archer) return;
  if (archer.owner !== username) return;
  if (archer.unitType !== "archer") return;
  if (archer.actionTaken) {
    console.log("archer out of non move actions");
    return;
  }
  if (target.unit) target.unit.hits -= archer.damage;
  if (
    target.unit &&
    target.unit.unitType === "deer" &&
    target.unit.hits <= 0 &&
    target.unit.hits > -archer.damage
  ) {
    await updateUserResources(userId, { food: 100 });
  }
  if (target.building) target.building.hits -= archer.damage;
  archer.actionTaken = true;
};

const processSpawnWorkerAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }

  if (!(await canUserAfford(userId, "worker"))) return;

  const spawn = board[y][x].building;
  const target = board[targetY][targetX];
  if (!target) return;
  if (!spawn) return;
  if (spawn.owner !== username) return;
  if (spawn.structureType !== "structureSpawn") return;
  if (checkIfCellIsOccupied(targetX, targetY)) return;
  if (spawn.actionTaken) {
    console.log("spawn already spawning");
    return;
  }
  target.unit = {
    unitId: uuidv4(),
    unitType: "worker",
    pos: {
      x: targetX,
      y: targetY,
    },
    owner: username,
    hits: 100,
    hitsMax: 100,
    damage: 12,
    range: 1,
    actionTaken: false,
  };
  await updateUserResources(userId, { gold: "worker" });
  spawn.actionTaken = true;
  await addUnit(userId, target.unit.unitId);
};

const processSpawnAxemanAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }

  if (!(await canUserAfford(userId, "axeman"))) return;

  const spawn = board[y][x].building;
  const target = board[targetY][targetX];
  if (!target) return;
  if (!spawn) return;
  if (spawn.owner !== username) return;
  if (spawn.structureType !== "structureSpawn") return;
  if (checkIfCellIsOccupied(targetX, targetY)) return;
  if (spawn.actionTaken) {
    console.log("spawn already spawning");
    return;
  }
  target.unit = {
    unitId: uuidv4(),
    unitType: "axeman",
    pos: {
      x: targetX,
      y: targetY,
    },
    owner: username,
    hits: 200,
    hitsMax: 200,
    damage: 50,
    range: 1,
    actionTaken: false,
  };
  await updateUserResources(userId, { gold: "axeman" });
  spawn.actionTaken = true;
  await addUnit(userId, target.unit.unitId);
};

const processSpawnArcherAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }

  if (!(await canUserAfford(userId, "archer"))) return;

  const spawn = board[y][x].building;
  const target = board[targetY][targetX];
  if (!target) return;
  if (!spawn) return;
  if (spawn.owner !== username) return;
  if (spawn.structureType !== "structureSpawn") return;
  if (checkIfCellIsOccupied(targetX, targetY)) return;
  if (spawn.actionTaken) {
    console.log("spawn already spawning");
    return;
  }
  target.unit = {
    unitId: uuidv4(),
    unitType: "archer",
    pos: {
      x: targetX,
      y: targetY,
    },
    owner: username,
    hits: 150,
    hitsMax: 150,
    damage: 35,
    range: 2,
    actionTaken: false,
  };
  await updateUserResources(userId, { gold: "archer" });
  spawn.actionTaken = true;
  await addUnit(userId, target.unit.unitId);
};

const processWorkerMineAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;
  if (!(await isValidUser(username, userId))) {
    return;
  }

  if (!board[y] || !board[y][x] || !board[y][x].unit) {
    console.error(`Invalid worker position: ${x}, ${y}`);
    return;
  }
  const worker = board[y][x].unit;
  const target = board[targetY][targetX];
  if (!worker) return;
  if (!target) return;
  if (worker.unitType !== "worker") return;

  if (worker.owner !== username) return;

  if (worker.actionTaken) {
    console.log("worker out of non move actions");
    return;
  }

  if (!target.resource) return;
  let resourceType = target.resource.resourceType;

  const validResourceTypes = ["wood", "stone", "food", "gold"];
  // Check if resourceType is valid
  if (!validResourceTypes.includes(resourceType)) {
    throw new Error(`Invalid resource type: ${resourceType}`);
  }
  const resourceToAdd = 100;

  // Create an update object where the key is the value of resourceType
  const update = { [resourceType]: resourceToAdd };
  console.log(JSON.stringify(update));

  // Update the user's resources in the database
  await updateUserResources(userId, update);
  worker.actionTaken = true;
};

const processMoveWorkerAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }
  const worker = board[y][x].unit;
  const target = board[targetY][targetX];
  if (!worker) return;
  if (!target) return;
  if (worker.unitType !== "worker") return;
  if (worker.owner !== username) return;
  if (checkIfCellIsOccupied(targetX, targetY)) return;
  worker.pos.x = targetX;
  worker.pos.y = targetY;
  board[y][x].unit = null;
  board[targetY][targetX].unit = worker;
};

const processMoveAxemanAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;
  if (!(await isValidUser(username, userId))) {
    return;
  }
  const axeman = board[y][x].unit;
  const target = board[targetY][targetX];
  if (!axeman) return;
  if (!target) return;
  if (axeman.unitType !== "axeman") return;
  if (axeman.owner !== username) return;
  if (checkIfCellIsOccupied(targetX, targetY)) return;
  axeman.pos.x = targetX;
  axeman.pos.y = targetY;
  board[y][x].unit = null;
  board[targetY][targetX].unit = axeman;
};

const processMoveArcherAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;
  if (!(await isValidUser(username, userId))) {
    return;
  }
  const archer = board[y][x].unit;
  const target = board[targetY][targetX];
  if (!archer) return;
  if (!target) return;
  if (archer.unitType !== "archer") return;
  if (archer.owner !== username) return;
  if (checkIfCellIsOccupied(targetX, targetY)) return;
  archer.pos.x = targetX;
  archer.pos.y = targetY;
  board[y][x].unit = null;
  board[targetY][targetX].unit = archer;
};

const isValidUser = async (username, userId) => {
  const user = await User.findById(userId);
  if (!user || user.username !== username) {
    console.log(`Mismatch between username and userId: ${username}, ${userId}`);
    return false;
  }
  return true;
};

const checkIfCellIsOccupied = (x, y) => {
  return board[y][x].unit || board[y][x].building;
};

const broadcastRemainingTime = () => {
  const remainingTime = Math.floor((nextTaskTimestamp - Date.now()) / 1000);
  io.sockets.emit("updateTimer", remainingTime);
};

const userSockets = {};
const userAttempts = {};

let nextTaskTimestamp;
broadcastRemainingTime();

// setInterval(() => {
//   timerValue -= 1;
//   if (timerValue === 0) {
// processActions();
// resetActions();
// timerValue = maxTimerValue;
// io.sockets.emit('updateTimer', timerValue);
//   }
// }, 1000);

cron.schedule("0 2 */2 * *", async () => {
  // cron.schedule('0 */12 * * *', async () => {
  board = await loadBoardState(db);
  await processActions();
  const resetSuccessful = await resetActions();

  if (resetSuccessful) {
    // Emit 'actionsReset' event to all connected clients
    io.sockets.emit("actionsReset");
  }
  const timerValue = getTimerAmount();
  const newTimestamp = Date.now() + timerValue;
  const taskTimestamp = await TaskTimestamp.findOne({});
  taskTimestamp.timestamp = newTimestamp;
  await taskTimestamp.save();
  nextTaskTimestamp = newTimestamp;
  // Broadcast the remaining time
  broadcastRemainingTime();
});

cron.schedule("0 2 * * *", async () => {
  try {
    console.log("Database reset scheduled task started");

    // Drop the existing database
    await mongoose.connection.db.dropDatabase();

    // Load the initial state of the board after the reset
    board = await loadBoardState(db);
    nextTaskTimestamp = await loadNextTaskTimestamp();

    console.log("Database reset completed successfully");
  } catch (error) {
    console.error("Error during database reset:", error);
  }
});
