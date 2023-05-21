const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const { getVoiceover} = require("../controllers/voiceover");

// GET voiceover
router.get("/", jwtMiddleware, getVoiceover);

module.exports = router;
