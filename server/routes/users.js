const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const { getUser, updateUser, me, getAllUserIdentifiers } = require("../controllers/user");

// UPDATE a User by ID
router.put("/:id", jwtMiddleware, updateUser);

// GET my authenticated user
router.get("/me", jwtMiddleware, me);

// GET all users usernames and identifiers
router.get("/all", jwtMiddleware, getAllUserIdentifiers);

// GET a User by ID
router.get("/getone/:id", jwtMiddleware, getUser);

module.exports = router;
