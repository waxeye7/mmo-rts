const Board = require("../../models/board");

const createBoard = async () => {
  const size = 10;
  const newBoard = new Array(size);

  for (let y = 0; y < size; y++) {
    newBoard[y] = new Array(size);
    for (let x = 0; x < size; x++) {
      newBoard[y][x] = {
        x,
        y,
        unit: null,
        building: null,
        resource: null,
      };
    }
  }

  // Save the new board to the database using Mongoose
  const boardEntry = new Board({ state: newBoard });
  await boardEntry.save();
  return boardEntry.state;
};

module.exports = createBoard;