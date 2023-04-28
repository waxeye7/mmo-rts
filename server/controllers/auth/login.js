require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const { verifyPassword } = require("../../utils/passwordHashing");
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid username." });
    }

    const isPasswordMatch = await verifyPassword(password, user.password);
    if (!isPasswordMatch) {
      res.status(401).json({ message: "Invalid password." });
      return;
    }
  
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY
    );
    res.json({
      token,
      id: user.id,
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Error logging in user." });
  }
};

module.exports = login
