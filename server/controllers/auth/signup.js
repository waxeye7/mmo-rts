const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const { hashPassword } = require("../../utils/passwordHashing");
const signup = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({ message: "username already exists." });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      username,
      password: hashedPassword,
      actions: [],
      resources: {
        gold: 1650,
        wood: 0,
        stone: 0,
        food: 0,
      },
      units: [],
      buildings: [],
      identifier: {
        backgroundColor: req.body.identifier.backgroundColor,
        shape: req.body.identifier.shape,
        fillColor: req.body.identifier.fillColor,
      },
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id },
      process.env.AUTH_SECRET_KEY
    );
    res.cookie('token', token, {
      httpOnly: true, 
      sameSite:'Strict',
      maxAge: 7200000 // expires after 2 hours
    });
    res.json({
      message: "User created successfully",
      // token
    });
  } catch (error) {
    console.error("Error in sign up:", error);
    res.status(500).json({ message: "Error creating user." });
  }
};

module.exports = signup
