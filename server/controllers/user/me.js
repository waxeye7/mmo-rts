const jwt = require("jsonwebtoken");
const User = require("../../models/user");

const me = async (req, res) => {
  const token = req.cookies.token;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.AUTH_SECRET_KEY);

      const user = await User.findOne({ _id: decoded.id }).select(
        "username actions resources units buildings -_id"
      );
      if (!user) {
        throw new Error("User not found");
      }
      return res.json(user); // Send the user's data
    } catch (error) {
      return res.status(401).json({ message: "authentication failed - invalid token" });
    }
  } else {
    return res.status(401).json({ message: "authentication failed - no token provided" });
  }
};

module.exports = me;