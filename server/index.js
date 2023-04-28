const mongoose = require('mongoose')
const url = 'mongodb://127.0.0.1:27017/mmo-rts';
const loadBoardState = require("./controllers/board/loadBoardState");

mongoose.connect(url, { useNewUrlParser: true })
const db = mongoose.connection;
let board;
db.once('open', async () => {
  console.log('Database connected:', url)
  board = await loadBoardState(db);
})

db.on('error', err => {
  console.error('connection error:', err)
})


require('dotenv').config();
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
  console.log('A user connected');

  // Add your game's server-side code here

  // Send the initial board state to the client
  socket.emit('updateBoard', board);

  // Listen for actions from the client
  socket.on('action', (action) => {
    handleAction(action);

    // Send the updated board state to all connected clients
    io.sockets.emit('updateBoard', board);
  });


  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

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




const handleAction = (action) => {
  console.log('Received action:', action);
  if (action.type === 'place') {
    const { x, y, color } = action.payload;
    board[x][y].color = color;
  }
};

