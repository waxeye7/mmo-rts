const socketIO = require("socket.io");

let io; // Declare a variable to hold the socket.io instance

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? "https://mmo-rts.com"
          : "http://localhost:8080",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });

  // Socket.io event handling goes here

  return io; // Return the socket.io instance
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
