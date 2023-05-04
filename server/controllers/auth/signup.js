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
      actions: 10,
      resources: {
        gold: 0,
        wood: 0,
      }
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id },
      process.env.AUTH_SECRET_KEY
    );
    res.json({
      message: "User created successfully",
      token,
      id: newUser._id,
    });
  } catch (error) {
    console.error("Error in sign up:", error);
    res.status(500).json({ message: "Error creating user." });
  }
};

module.exports = signup
