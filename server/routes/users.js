const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const { getUser, updateUser, me } = require("../controllers/user");

// UPDATE a User by ID
router.put("/:id", jwtMiddleware, updateUser);

// GET my authenticated user
router.get("/me", jwtMiddleware, me);

// GET a User by ID
router.get("/:id", jwtMiddleware, getUser);

module.exports = router;
