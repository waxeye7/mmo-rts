const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const { getUser, updateUser, me, getAllUserIdentifiers, deleteAction, placeFirstSpawn } = require("../controllers/user");

// UPDATE a User by ID
router.put("/:id", jwtMiddleware, updateUser);

// GET my authenticated user
router.get("/me", me);

// GET all users usernames and identifiers
router.get("/all", getAllUserIdentifiers);

// GET a User by ID
router.get("/getone/:id", jwtMiddleware, getUser);

// GET a User by ID
router.post("/placefirstspawn", jwtMiddleware, placeFirstSpawn);

// DELETE an action by Index
router.delete("/actions/:id", jwtMiddleware, deleteAction)

module.exports = router;
