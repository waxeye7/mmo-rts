const User = require("../../models/user");
const loadBoardState = require("../board/loadBoardState");
const loadNextTaskTimestamp = require("../taskTimestamp/loadNextTaskTimestamp");

const getPublicState = async (req, res) => {
  try {
    const [board, nextTick, users] = await Promise.all([
      loadBoardState(),
      loadNextTaskTimestamp(),
      User.find().select("username identifier -_id"),
    ]);

    const players = {};
    for (const user of users) {
      players[user.username] = user.identifier || null;
    }

    res.json({
      board,
      players,
      nextTick,
      remainingSeconds: Math.max(0, Math.floor((nextTick - Date.now()) / 1000)),
    });
  } catch (error) {
    console.error("Error loading public state:", error);
    res.status(500).json({ message: "Could not load public game state." });
  }
};

module.exports = getPublicState;
