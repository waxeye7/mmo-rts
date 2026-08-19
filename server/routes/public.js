const express = require("express");
const router = express.Router();
const getPublicState = require("../controllers/public/getPublicState");

router.get("/state", getPublicState);

module.exports = router;
