const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const me = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.AUTH_SECRET_KEY);

      req.userId = decoded.id;

      const user = await User.findOne({ _id: decoded.id });
      if (!user) {
        throw new Error("User not found");
      }

      return res.status(200).json({
        message: "authentication successful, lol",
      });
    } catch (error) {
      return res
        .status(401)
        .json({ message: "authentication failed - invalid token lol" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "authentication failed - no token lol" });
  }
};

module.exports = me;
