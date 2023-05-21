const express = require("express");
const router = express.Router();
const { createBoard, updateBoard } = require("../controllers/board");

// Create Board
router.post("/", createBoard);

// Update Board
router.put("/", updateBoard);


module.exports = router;
