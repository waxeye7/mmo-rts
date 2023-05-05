const cron = require('node-cron');
require("dotenv").config();
const mongoose = require('mongoose')
const url = 'mongodb://127.0.0.1:27017/mmo-rts';
const loadBoardState = require("./controllers/board/loadBoardState");
const saveBoardState = require("./controllers/board/saveBoardState");
const resetActions = require("./controllers/user/resetActions");
const TaskTimestamp = require('./models/taskTimestamp');
const loadNextTaskTimestamp = require('./controllers/taskTimestamp/loadNextTaskTimestamp');
const decrementActions = require('./controllers/user/decrementActions');
const User = require('./models/user');
const canUserAffordStructure = require('./controllers/user/canUserAffordStructure');
const updateUserGold = require('./controllers/user/updateUserGold');


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
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use(cors({ origin: 'http://localhost:8080' }));


// Serve the Vue.js app
app.use(express.static('dist'));

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Add your game's server-side code here

  // Send the initial board state to the client

  // socket.emit('updateBoard', board);
  // socket.emit('updateTimer', timerValue);

  // Listen for a request to get the initial values
  socket.on('getInitialValues', () => {
    socket.emit('updateBoard', board);
    broadcastRemainingTime();
  });

  // Listen for actions from the client
  socket.on('action', (action) => {
    handleAction(socket, action);
  });

  // Listen for the 'loggedIn' event
  socket.on("loggedIn", (userId) => {
    // Store the user's socket using their user ID as the key
    userSockets[userId] = socket;
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
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

const handleAction = async (socket, action) => {
  console.log('Received action:', action);
  const userId = action.payload.userId;

  // Check if the user has actions left
  const user = await User.findById(userId);

  if (user.actions <= 0) {

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
  let updatedUser = await decrementActions(userId);
  if(updatedUser) {
    socket.emit('updateUser', updatedUser);
    if (action.type === 'move worker' || action.type === 'move axeman') {
      moveActionsQueue.push(action);
    } else {
      nonMoveActionsQueue.push(action);
    }
  }
  else {
    console.log("updated user not found. error here.")
  }
};

const processActions = async () => {
  for (const action of nonMoveActionsQueue) {
    if (action.type === 'build') {
      await processBuildAction(action);
    } else if (action.type === "tower shoot") {
      await processTowerShootAction(action);
    } else if (action.type === "spawn worker") {
      await processSpawnWorkerAction(action);
    }
    else if(action.type === "spawn axeman"){
      await processSpawnAxemanAction(action);
    }
    else if(action.type === "worker mine") {
      await processWorkerMineAction(action);
    }
    else if(action.type === "axeman attack") {
      await processAxemanAttackAction(action);
    }
  }
  nonMoveActionsQueue = [];


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
      }
    }
  }
  

  for (const action of moveActionsQueue) {
    if (action.type === "move worker") {
      await processMoveWorkerAction(action);
    }
    else if(action.type === "move axeman"){
      await processMoveAxemanAction(action);
    }
  }
  moveActionsQueue = [];

  // Save the updated board state to the database
  await saveBoardState(board);

  // Send the updated board state to all connected clients
  io.sockets.emit('updateBoard', board);
};

const processBuildAction = async (action) => {
  
  const { x, y, structureType, username, userId } = action.payload;
  if (!(await isValidUser(username, userId))) {
    return;
  }

  if(!await canUserAffordStructure(userId, "structureSpawn")) return;

  

  decrementActions(userId);
  let hits = 5000;
  if (structureType === "structureTower") hits = 3000;
  board[y][x].building = { structureType, owner: username, hits: hits, hitsMax: hits, damage: 100 };

  await updateUserGold(userId, structureType);

};

const processTowerShootAction = async (action) => {
  const { x, y, targetX, targetY, username, userId } = action.payload;

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

const processAxemanAttackAction = async (action) => {
  const { x, y, targetX, targetY, username, userId } = action.payload;

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

const processSpawnWorkerAction = async (action) => {
  const { x, y, targetX, targetY, username, userId } = action.payload;


  if (!(await isValidUser(username, userId))) {
    return;
  }


  const spawn = board[y][x].building;
  const target = board[targetY][targetX];
  if(!target) return;
  if(!spawn) return;
  if(spawn.owner !== username) return;
  if(spawn.structureType !== "structureSpawn") return;
  if(checkIfCellIsOccupied(targetX,targetY)) return;
  target.unit = {
    unitType: "worker",
    pos: {
      x: targetX,
      y: targetY
    },
    owner: username,
    hits: 500,
    hitsMax: 500,
    damage: 12,
  }
};

const processSpawnAxemanAction = async (action) => {
  const { x, y, targetX, targetY, username, userId } = action.payload;


  if (!(await isValidUser(username, userId))) {
    return;
  }

  const spawn = board[y][x].building;
  const target = board[targetY][targetX];
  if(!target) return;
  if(!spawn) return;
  if(spawn.owner !== username) return;
  if(spawn.structureType !== "structureSpawn") return;
  if(checkIfCellIsOccupied(targetX,targetY)) return;
  target.unit = {
    unitType: "axeman",
    pos: {
      x: targetX,
      y: targetY
    },
    owner: username,
    hits: 1000,
    hitsMax: 1000,
    damage: 50,
  }

};

const processWorkerMineAction = async (action) => {
  const { x, y, targetX, targetY, username, userId } = action.payload;

  if (!(await isValidUser(username, userId))) {
    return;
  }
  const worker = board[y][x].unit;
  const target = board[targetY][targetX];
  if(!worker) return;
  if(!target) return;
  if(worker.unitType !== "worker") return;
  if(worker.owner !== username) return;
  if(!target.resource) return;

  const goldToAdd = 80;
  // Update the user's resources.gold property in the database
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { "resources.gold": goldToAdd } },
    { new: true, useFindAndModify: false }
  );

  // Check if the user was updated successfully
  if (!updatedUser) {
    console.error(`Failed to update resources for user: ${username}, ${userId}`);
    return;
  }

  // Send the updated user data to the client
  if (userSockets[userId]) {
    userSockets[userId].emit('updateUser', updatedUser);
  }
};

const processMoveWorkerAction = async (action) => {
  const { x, y, targetX, targetY, username, userId } = action.payload;

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

const processMoveAxemanAction = async (action) => {
  const { x, y, targetX, targetY, username, userId } = action.payload;
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
let moveActionsQueue = [];
let nonMoveActionsQueue = [];
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