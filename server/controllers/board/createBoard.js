const Board = require("../../models/board");

const createBoard = async () => {
  const size = 20;
  const gridSize = 5;
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

  // Randomly place a resource in each 4x4 grid
  for (let gridY = 0; gridY < size; gridY += gridSize) {
    for (let gridX = 0; gridX < size; gridX += gridSize) {
      const resourceX = gridX + Math.floor(Math.random() * gridSize);
      const resourceY = gridY + Math.floor(Math.random() * gridSize);

      // Make sure the coordinates are within the board
      if (resourceX < size && resourceY < size) {
        newBoard[resourceY][resourceX].resource = {
          resourceType: "gold",
        };
      }
    }
  }

  // Save the new board to the database using Mongoose
  const boardEntry = new Board({ state: newBoard });
  await boardEntry.save();
  return boardEntry.state;
};

module.exports = createBoard;