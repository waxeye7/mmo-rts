const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const { createBoard, updateBoard } = require("../controllers/board");

// Create Board
router.post("/", createBoard);

// Update Board
router.put("/", updateBoard);


module.exports = router;
