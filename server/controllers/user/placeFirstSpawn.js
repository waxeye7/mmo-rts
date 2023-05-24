const User = require("../../models/user");
const { updateBoardWithSpawn } = require("../board/updateBoardWithSpawn");
const loadBoardState = require("../board/loadBoardState");
const { v4: uuidv4 } = require("uuid");
const { getIO } = require("../../socket");

const placeFirstSpawn = async (req, res) => {
  try {
    const { cell } = req.body;
    const userId = req.userId;
    let board = await loadBoardState();
    if (!board) {
      res.status(400).send("No board found");
      return;
    }
    const numRows = board.length;
    const numCols = board[0].length;
    if (
      cell.x >= 0 &&
      cell.x < numCols &&
      cell.y >= 0 &&
      cell.y < numRows &&
      !board[cell.y][cell.x].unit &&
      !board[cell.y][cell.x].building &&
      !board[cell.y][cell.x].resource
    ) {
      const user = await User.findById(userId);
      if (user.buildings.length || user.units.length) {
        res.status(400).send("User already has stuff");
        return;
      }

      const spawn = {
        buildingId: uuidv4(),
        structureType: "structureSpawn",
        owner: user.username,
        pos: { x: cell.x, y: cell.y },
        hits: 500,
        hitsMax: 500,
        actionTaken: false,
      };

      user.buildings.push(spawn.buildingId);
      await user.save();
      board = await updateBoardWithSpawn(spawn);

      const io = getIO();
      io.emit("updateBoard", board);
      io.emit("updateUser", user);
      res.status(200).send("Spawn location saved successfully");
    } else {
      res.status(400).send("Invalid spawn location");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

module.exports = placeFirstSpawn;
