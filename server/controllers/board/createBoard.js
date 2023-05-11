const Board = require("../../models/board");

const createBoard = async () => {
  const size = 20;
  const gridSize = 5;
  const newBoard = new Array(size);
  const terrains = ["plains", "tundra", "mountain"]; // List of terrain types

  for (let y = 0; y < size; y++) {
    newBoard[y] = new Array(size);
    for (let x = 0; x < size; x++) {
      newBoard[y][x] = {
        x,
        y,
        unit: null,
        building: null,
        resource: null,
        terrain: null // initialize terrain as null
      };
    }
  }

  // Terrain generation for biomes
  for (let y = 0; y < size; y += Math.floor(Math.random() * 5 + 3)) {
    for (let x = 0; x < size; x += Math.floor(Math.random() * 5 + 3)) {
      const biomeSizeY = Math.min(Math.floor(Math.random() * 5 + 3), size - y);
      const biomeSizeX = Math.min(Math.floor(Math.random() * 5 + 3), size - x);
      const terrain = terrains[Math.floor(Math.random() * terrains.length)]; // Assign a random terrain
      for (let by = y; by < y + biomeSizeY; by++) {
        for (let bx = x; bx < x + biomeSizeX; bx++) {
          newBoard[by][bx].terrain = terrain;
        }
      }
    }
  }

  // Filling in gaps
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (newBoard[y][x].terrain === null) {
        let nearbyTerrains = [];
        if (y > 0) nearbyTerrains.push(newBoard[y - 1][x].terrain);
        if (y < size - 1) nearbyTerrains.push(newBoard[y + 1][x].terrain);
        if (x > 0) nearbyTerrains.push(newBoard[y][x - 1].terrain);
        if (x < size - 1) nearbyTerrains.push(newBoard[y][x + 1].terrain);
        nearbyTerrains = nearbyTerrains.filter(t => t !== null); // Filter out null values
        if (nearbyTerrains.length > 0) {
          newBoard[y][x].terrain = nearbyTerrains[Math.floor(Math.random() * nearbyTerrains.length)];
        }
      }
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