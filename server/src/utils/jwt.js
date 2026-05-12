const jwt = require("jsonwebtoken");

const signToken = (userId, tokenVersion = 0) =>
  jwt.sign({ sub: userId, tv: tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

module.exports = { signToken };
