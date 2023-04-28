require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const { hashPassword } = require("../../utils/passwordHashing");
const signup = async (req, res) => {
  try {
    console.log(req.body)
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({ message: "username already exists." });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      username,
      password: hashedPassword,
      actions: 10,
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET_KEY
    );
    res.json({
      message: "User created successfully",
      token,
      id: user.id,
    });
  } catch (error) {
    console.error("Error in sign up:", error);
    res.status(500).json({ message: "Error creating user." });
  }
};

module.exports = signup
