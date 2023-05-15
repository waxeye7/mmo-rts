const express = require("express");
const router = express.Router();
const { login, signup, logout } = require("../controllers/auth");

// POST login
router.post("/login", login);

// POST signup
router.post("/signup", signup);

// POST signup
router.get("/logout", logout);


module.exports = router;
