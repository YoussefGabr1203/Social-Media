const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authGuard = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "Invalid token" });

    // Validate token version — allows server-side logout invalidation.
    // Old tokens without `tv` claim are still accepted for backward compatibility.
    if (payload.tv !== undefined && payload.tv !== user.tokenVersion) {
      return res.status(401).json({ message: "Session expired, please log in again" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = authGuard;
