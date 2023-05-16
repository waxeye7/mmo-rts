const cron = require('node-cron');
require("dotenv").config();
const mongoose = require('mongoose')
const url = 'mongodb://127.0.0.1:27017/mmo-rts';
const loadBoardState = require("./controllers/board/loadBoardState");
const saveBoardState = require("./controllers/board/saveBoardState");
const resetActions = require("./controllers/user/resetActions");
const TaskTimestamp = require('./models/taskTimestamp');
const loadNextTaskTimestamp = require('./controllers/taskTimestamp/loadNextTaskTimestamp');
const addAction = require('./controllers/user/addAction');
const User = require('./models/user');
const canUserAfford = require('./controllers/user/canUserAfford');
const updateUserResources = require('./controllers/user/updateUserResources');
const getCost = require('../CONSTANTS/getCost');
const { moveActionsQueue, nonMoveActionsQueue } = require('./actionsQueue');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');


mongoose.connect(url, { useNewUrlParser: true })
const db = mongoose.connection;
let board;
db.once('open', async () => {
  console.log('Database connected:', url)
  board = await loadBoardState(db);
  nextTaskTimestamp = await loadNextTaskTimestamp();
})

db.on('error', err => {
  console.error('connection error:', err)
})

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require("body-parser");
const app = express();
const server = http.createServer(app);
const cors = require('cors');
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }
});

// Configure CORS for Socket.IO
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;
  // Add any additional origins you want to allow here
  const allowedOrigins = ['http://localhost:8080'];
  if (allowedOrigins.includes(origin)) {
    next();
  } else {
    return next(new Error('CORS not allowed'));
  }
});

// Configure CORS for Express
app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Serve the Vue.js app
app.use(express.static('dist'));

let numUsers = 0;

// Handle Socket.IO connections
io.on('connection', (socket) => {
  numUsers++;
  console.log('A user connected', socket.id);
  io.emit('user count', numUsers);

  

  socket.on('getInitialValues', () => {
    socket.emit('updateBoard', board);
    broadcastRemainingTime();
  });

  // Listen for actions from the client
  socket.on('action', (action) => {
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
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const token = cookies.token;
    console.log(token)

    if (token) {
      // Verify the JWT and get the user ID
      let decoded =jwt.verify(token, process.env.AUTH_SECRET_KEY);
      if(!decoded) {
        socket.emit('authentication_error');
        socket.disconnect();
        return;
      }
      // If the token is valid, add the socket to the userSockets dictionary
      const userId = decoded.id;
      userSockets[userId] = socket;

    }
  });
  

  socket.on('disconnect', () => {
    numUsers--;
    console.log('A user disconnected');
    io.emit('user count', numUsers);

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
  io.sockets.emit('serverRestart');

  // Close the server
  server.close(() => {
    console.log("Server has been closed.");
    process.exit();
  });
};

// Listen for server shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);


// app.use((req, res, next) => {
//   console.log(`Received a ${req.method} request to ${req.url}`);
//   next();
// });

app.use(bodyParser.json());
// User routes
const UsersRoute = require("./routes/users.js");
app.use("/users", UsersRoute);

// Board routes
const BoardsRoute = require("./routes/boards.js");
app.use("/boards", BoardsRoute);

// Auth routes
const AuthRoute = require("./routes/auth.js");
app.use("/auth", AuthRoute);

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



const handleAction = async (socket, action, userId) => {
  console.log('Received action:', action);

  // Check if the user has actions left
  const user = await User.findById(userId);

  if (user.actions.length >= 10) {

    console.log("User has no actions left")

    // Increment userAttempts for this user or set it to 1 if it doesn't exist
    userAttempts[userId] = (userAttempts[userId] || 0) + 1;

    if(userAttempts[userId]) {
      if (userAttempts[userId] >= 13) {
        if(userSockets[userId]) {
          // Log the user out by emitting a 'forceLogout' event
          userSockets[userId].emit('forceLogout');
        }

      } else if (userAttempts[userId] >= 10) {
        if(userSockets[userId]) {
          // Emit a 'warning' event to the user's client
          userSockets[userId].emit('warning', 'You have no actions left. Continuing to try will result in being logged out.');
        }
      }
      return;
    }
  }

  // If the user has actions left, proceed with the action and reset the attempts
  let updatedUser = await addAction(action, userId);
  if(updatedUser) {
    socket.emit('updateUser', updatedUser);
    if (action.type === 'move worker' || action.type === 'move axeman') {
      moveActionsQueue.push({action, userId});
    } else {
      nonMoveActionsQueue.push({action, userId});
    }
  }
  else {
    console.log("updated user not found. error here.")
  }

};

const processActions = async () => {
  for (const request of nonMoveActionsQueue) {
    if (request.action.type === 'build spawn' || request.action.type === 'build tower') {
      await processBuildAction(request.action, request.userId);
    } else if (request.action.type === "tower shoot") {
      await processTowerShootAction(request.action, request.userId);
    } else if (request.action.type === "spawn worker") {
      await processSpawnWorkerAction(request.action, request.userId);
    }
    else if(request.action.type === "spawn axeman"){
      await processSpawnAxemanAction(request.action, request.userId);
    }
    else if(request.action.type === "worker mine") {
      await processWorkerMineAction(request.action, request.userId);
    }
    else if(request.action.type === "axeman attack") {
      await processAxemanAttackAction(request.action, request.userId);
    }
  }
  nonMoveActionsQueue.length = 0;


  // need to update units/buildings with hits < 0 before move actions
  // loop through board and check hits is less than or equal to 0
  // if so, remove unit/building from board
  for(let y = 0; y < board.length; y++) {
    for(let x = 0; x < board[y].length; x++) {
      let cell = board[y][x];
      if(cell.unit) {
        if(cell.unit.hits <= 0) {
          cell.unit = null;
        }
      }
      else if(cell.building) {
        if(cell.building.hits <= 0) {
          cell.building = null;
        }
        else if(cell.building.structureType === "structureSpawn") {
          if(cell.building.spawning) {
            cell.building.spawning = false;
          }
        }
      }
    }
  }
  

  for (const request of moveActionsQueue) {
    if (request.action.type === "move worker") {
      await processMoveWorkerAction(request.action, request.userId);
    }
    else if(request.action.type === "move axeman"){
      await processMoveAxemanAction(request.action, request.userId);
    }
  }
  moveActionsQueue.length = 0;


  for(let y = 0; y < board.length; y++) {
    for(let x = 0; x < board[y].length; x++) {
      let cell = board[y][x];
      if(cell.unit && cell.unit.actionTaken) cell.unit.actionTaken = false;
      else if(cell.building && cell.building.actionTaken) cell.building.actionTaken = false;
    }
  }


  // Save the updated board state to the database
  await saveBoardState(board);

  // Send the updated board state to all connected clients
  io.sockets.emit('updateBoard', board);
};

const processBuildAction = async (action, userId) => {
  const { x, y, structureType, username} = action.payload;
  if (!(await isValidUser(username, userId))) {
    return;
  }
  if(!await canUserAfford(userId, structureType)) return;
  await addAction(action, userId);
  let buildingObject = { structureType, owner: username };
  if(structureType === "structureTower") {
    buildingObject.damage = 100;
    buildingObject.hits = 250;
    buildingObject.hitsMax = 250;
  }
  else if(structureType === "structureSpawn") {
    buildingObject.hits = 500;
    buildingObject.hitsMax = 500;
    buildingObject.spawning = false;
  }

  board[y][x].building = buildingObject;
  await updateUserResources(userId, {gold:structureType});
};

const processTowerShootAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }

  const tower = board[y][x].building;
  const target = board[targetY][targetX];
  if(!target) return;
  if(!tower) return;
  if(tower.owner !== username) return;
  if(tower.structureType !== "structureTower") return;
  if(target.unit) target.unit.hits -= tower.damage;
  if(target.building) target.building.hits -= tower.damage;
};

const processAxemanAttackAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }

  const axeman = board[y][x].unit;
  const target = board[targetY][targetX];
  if(!target || !target.unit && !target.building) return;
  if(!axeman) return;
  if(axeman.owner !== username) return;
  if(axeman.unitType !== "axeman") return;
  if(target.unit) target.unit.hits -= axeman.damage;
  if(target.building) target.building.hits -= axeman.damage;
  
};

const processSpawnWorkerAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;


  if (!(await isValidUser(username, userId))) {
    return;
  }

  if(!await canUserAfford(userId, "worker")) return;


  const spawn = board[y][x].building;
  const target = board[targetY][targetX];
  if(!target) return;
  if(!spawn) return;
  if(spawn.owner !== username) return;
  if(spawn.structureType !== "structureSpawn") return;
  if(checkIfCellIsOccupied(targetX,targetY)) return;
  if(spawn.spawning) {
    console.log("spawn already spawning")
    return;
  }
  target.unit = {
    unitType: "worker",
    pos: {
      x: targetX,
      y: targetY
    },
    owner: username,
    hits: 100,
    hitsMax: 100,
    damage: 12,
    nonMoveActions:1,
    moved:false
  }
  spawn.spawning = true;
  await updateUserResources(userId, {gold:"worker"});
};

const processSpawnAxemanAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;


  if (!(await isValidUser(username, userId))) {
    return;
  }

  if(!await canUserAfford(userId, "axeman")) return;


  const spawn = board[y][x].building;
  const target = board[targetY][targetX];
  if(!target) return;
  if(!spawn) return;
  if(spawn.owner !== username) return;
  if(spawn.structureType !== "structureSpawn") return;
  if(checkIfCellIsOccupied(targetX,targetY)) return;
  if(spawn.spawning) {
    console.log("spawn already spawning")
    return;
  }
  target.unit = {
    unitType: "axeman",
    pos: {
      x: targetX,
      y: targetY
    },
    owner: username,
    hits: 200,
    hitsMax: 200,
    damage: 50,
    nonMoveActions:1,
    moved:false
  }
  await updateUserResources(userId, {gold:"axeman"});

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
  if(!worker) return;
  if(!target) return;
  if(worker.unitType !== "worker") return;

  if(worker.owner !== username) return;

  if(worker.nonMoveActions && worker.nonMoveActions <= 0) {
    console.log("worker out of non move actions")
    return;
  }

  if(!target.resource) return;
  let resourceType = target.resource.resourceType;

  const validResourceTypes = ['wood', 'stone', 'food', 'gold'];
  // Check if resourceType is valid
  if (!validResourceTypes.includes(resourceType)) {
    throw new Error(`Invalid resource type: ${resourceType}`);
  }
  const resourceToAdd = 100;

  // Create an update object where the key is the value of resourceType
  const update = { [resourceType]: resourceToAdd };
  console.log(JSON.stringify(update))

  // Update the user's resources in the database
  await updateUserResources(userId, update);
};

const processMoveWorkerAction = async (action, userId) => {
  const { x, y, targetX, targetY, username } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }
  const worker = board[y][x].unit;
  const target = board[targetY][targetX];
  if(!worker) return;
  if(!target) return;
  if(worker.unitType !== "worker") return;
  if(worker.owner !== username) return;
  if(checkIfCellIsOccupied(targetX,targetY)) return;
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
  if(!axeman) return;
  if(!target) return;
  if(axeman.unitType !== "axeman") return;
  if(axeman.owner !== username) return;
  if(checkIfCellIsOccupied(targetX,targetY)) return;
  axeman.pos.x = targetX;
  axeman.pos.y = targetY;
  board[y][x].unit = null;
  board[targetY][targetX].unit = axeman;
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
  return board[y][x].unit || board[y][x].building || board[y][x].unit;
};



const broadcastRemainingTime = () => {
  const remainingTime = Math.floor((nextTaskTimestamp - Date.now()) / 1000);
  io.sockets.emit('updateTimer', remainingTime);
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


cron.schedule('*/30 * * * * *', async () => {
// cron.schedule('0 */12 * * *', async () => {

  await processActions();
  const resetSuccessful = await resetActions();


  if(resetSuccessful) {
      // Emit 'actionsReset' event to all connected clients
      io.sockets.emit('actionsReset');
  }


  const newTimestamp = Date.now() + 30 * 1000;
  // const newTimestamp = Date.now() + 12 * 60 * 60 * 1000;
  const taskTimestamp = await TaskTimestamp.findOne({});
  taskTimestamp.timestamp = newTimestamp;
  await taskTimestamp.save();
  nextTaskTimestamp = newTimestamp;

  // Broadcast the remaining time
  broadcastRemainingTime();
});