const express = require("express");
const router = express.Router();
const { login, signup } = require("../controllers/auth");

// POST login
router.post("/login", login);

// POST signup
router.post("/signup", signup);

module.exports = router;
