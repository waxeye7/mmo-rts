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

    // Send the updated board state to all connected clients
    io.sockets.emit('updateBoard', board);
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

const processActions = async () => {
  for (const action of actionsQueue) {
    const { username, userId } = action.payload;
    const user = await User.findById(userId);
    if (!user || user.username !== username) {
      console.log(`Mismatch between username and userId: ${username}, ${userId}`);
      continue;
    }

    if (action.type === 'build') {
      const { x, y, structureType, username, userId } = action.payload;
      
      if(checkIfPlayerCanBuildThisBuilding(username, structureType)) {
        console.log(`${username} can't build ${structureType}`);
        continue;
      }
      
      decrementActions(userId);
      let hits = 5000;
      if(structureType === "structureTower") hits = 3000;
      board[y][x].building = { structureType, owner: username, hits: hits };
    }
    else if(action.type === "move") {
      const { x, y, username, unit, userId } = action.payload;

      if(checkIfCellIsOccupied(x,y)) {console.log("cell is occupied"); continue;}

      decrementActions(userId);
      board[unit.pos.y][unit.pos.x].unit = null;
      board[y][x].unit = unit;
      unit.pos.x = x;
      unit.pos.y = y;
    }

    else if(action.type === "tower shoot") {
      const { x, y, targetX, targetY, username, userId } = action.payload;
      const tower = board[y][x].building;
      const target = board[targetY][targetX] || board[targetY][targetX];
      if(!target) continue;
      if(!tower) continue;
      if(tower.owner !== username) continue;
      if(tower.structureType !== "structureTower") continue;
      if(tower.hits <= 0) {
        board[y][x].building = null;
        continue;
      }
      if(target.unit) target.unit.hits -= 20;
      if(target.building) target.building.hits -= 20;
      if(target.unit && target.unit.hits <= 0) {
        board[targetY][targetX].unit = null;
      }
      if(target.building && target.building.hits <= 0) {
        board[targetY][targetX].building = null;
      }
    }
  }

  // Save the updated board state to the database
  await saveBoardState(board);

  // Send the updated board state to all connected clients
  io.sockets.emit('updateBoard', board);

  // Clear the actions queue
  actionsQueue = [];
};


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
  userAttempts[userId] = 0;

  let updatedUser = await decrementActions(userId);
  if(updatedUser) {
    socket.emit('updateUser', updatedUser);
    actionsQueue.push(action);
  }
  else {
    console.log("updated user not found. error here.")
  }
};

const checkIfCellIsOccupied = (x, y) => {
  return board[y][x].unit || board[y][x].building || board[y][x].unit;
};

const checkIfPlayerCanBuildThisBuilding = (username, buildingType) => {
  const buildings = board.reduce((acc, row) => {
    return acc.concat(row.filter(cell => cell.building && cell.building.owner === username));
  }, []);
  if(buildingType === "structureSpawn") return buildings.some(building => building.building.structureType === buildingType);
};

const broadcastRemainingTime = () => {
  const remainingTime = Math.floor((nextTaskTimestamp - Date.now()) / 1000);
  io.sockets.emit('updateTimer', remainingTime);
};

const userSockets = {};
const userAttempts = {};
let actionsQueue = [];
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