const jwt = require("jsonwebtoken");

const jwtMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.AUTH_SECRET_KEY);

      req.userId = decoded.id;

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
