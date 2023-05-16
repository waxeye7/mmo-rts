const jwt = require("jsonwebtoken");
const User = require('../models/user');

const jwtMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.AUTH_SECRET_KEY);

      // Find the user
      const user = await User.findOne({ _id: decoded.id });

      if (!user) {
        throw new Error();
      }

      // Attach the user and token to the request
      req.user = user;
      req.token = token;
      req.userId = user._id;

      return next();
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

module.exports = jwtMiddleware;