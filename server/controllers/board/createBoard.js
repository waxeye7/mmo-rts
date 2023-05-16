const Board = require("../../models/board");

const createBoard = async () => {
  console.log("creating new board")
  const size = 20;
  const gridSize = 6;
  const newBoard = new Array(size);
  const terrains = ["plains", "plains", "plains", "mountain", "mountain", "tundra"]; // Increased frequency for plains and mountain

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
  for (let y = 0; y < size; y += Math.floor(Math.random() * 3 + 2)) {
    for (let x = 0; x < size; x += Math.floor(Math.random() * 3 + 2)) {
      const terrain = terrains[Math.floor(Math.random() * terrains.length)]; // Assign a random terrain
      let biomeSizeY = Math.floor(Math.random() * 3 + 2);
      let biomeSizeX = Math.floor(Math.random() * 3 + 2);
      
      // Reduce the size of tundra biomes
      if (terrain === "tundra") {
        biomeSizeY = Math.floor(biomeSizeY / 2);
        biomeSizeX = Math.floor(biomeSizeX / 2);
      }

      biomeSizeY = Math.min(biomeSizeY, size - y);
      biomeSizeX = Math.min(biomeSizeX, size - x);

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

// Randomly place a gold resource in each 4x4 grid
for (let gridY = 0; gridY < size; gridY += gridSize) {
  for (let gridX = 0; gridX < size; gridX += gridSize) {
    const resourceX = gridX + Math.floor(Math.random() * gridSize);
    const resourceY = gridY + Math.floor(Math.random() * gridSize);

    // Make sure the coordinates are within the board
    if (resourceX < size && resourceY < size) {
      const terrain = newBoard[resourceY][resourceX].terrain;
      // Gold can only spawn in plains and mountains
      if (["plains", "mountain"].includes(terrain)) {
        newBoard[resourceY][resourceX].resource = { resourceType: "gold" };
      }
    }
  }
}

// Randomly place a wood resource in each 4x4 grid
for (let gridY = 0; gridY < size; gridY += gridSize) {
  for (let gridX = 0; gridX < size; gridX += gridSize) {
    const resourceX = gridX + Math.floor(Math.random() * gridSize);
    const resourceY = gridY + Math.floor(Math.random() * gridSize);

    // Make sure the coordinates are within the board
    if (resourceX < size && resourceY < size) {
      const terrain = newBoard[resourceY][resourceX].terrain;
      // Wood can only spawn in plains
      if ("plains" === terrain) {
        newBoard[resourceY][resourceX].resource = { resourceType: "wood" };
      }
    }
  }
}

// Randomly place a stone resource in each 6x6 grid
for (let gridY = 0; gridY < size; gridY += gridSize) {
  for (let gridX = 0; gridX < size; gridX += gridSize) {
    const resourceX = gridX + Math.floor(Math.random() * gridSize);
    const resourceY = gridY + Math.floor(Math.random() * gridSize);

    // Make sure the coordinates are within the board
    if (resourceX < size && resourceY < size) {
      const terrain = newBoard[resourceY][resourceX].terrain;
      // Stone can only spawn in mountains
      if ("mountain" === terrain) {
        newBoard[resourceY][resourceX].resource = { resourceType: "stone" };
      }
    }
  }
}

  // Save the new board to the database using Mongoose
  const boardEntry = new Board({ state: newBoard });
  await boardEntry.save();
  
  console.log("board created")

  return boardEntry.state;
};

module.exports = createBoard;