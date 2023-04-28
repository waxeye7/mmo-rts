const Board = require("../../models/board");
const createBoard = require("./createBoard");
const loadBoardState = async (db) => {
  try {
    const boardData = await Board.findOne();
    if (!boardData) {
      // Create a new board and insert it into the database
      return createBoard(db);
      
    } else {
      // Load the board from the database
      return boardData.state;
    }
  } catch (error) {
    console.error("Failed to load board state:", error);
    return createBoard();
  }
};

module.exports = loadBoardState;