const Board = require("../../models/board");

const updateBoardWithSpawn = async (spawnObject) => {
  try {
    const boardModel = await Board.findOne();
    if (!boardModel) {
      throw new Error("Board not found");
    }
    let board = boardModel.state;

    if (
      board &&
      board[spawnObject.pos.y] &&
      board[spawnObject.pos.y][spawnObject.pos.x]
    ) {
      board[spawnObject.pos.y][spawnObject.pos.x].building = spawnObject;

      boardModel.markModified("state"); // Mark the state field as modified
      await boardModel.save();
      return boardModel.state; // Return the updated board state from the model
    }
  } catch (err) {
    console.error("Error updating board:", err);
    throw err;
  }
};

module.exports = { updateBoardWithSpawn };
