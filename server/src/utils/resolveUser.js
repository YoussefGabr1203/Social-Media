const mongoose = require("mongoose");
const User = require("../models/User");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isObjectIdString = (s) =>
  typeof s === "string" && /^[a-fA-F0-9]{24}$/.test(s) && mongoose.Types.ObjectId.isValid(s);

const findUserByParam = async (param) => {
  if (!param || typeof param !== "string") return null;
  const trimmed = param.trim();
  if (!trimmed) return null;
  if (isObjectIdString(trimmed)) {
    return User.findById(trimmed).select("-passwordHash");
  }
  return User.findOne({ username: new RegExp(`^${escapeRegex(trimmed)}$`, "i") }).select("-passwordHash");
};

module.exports = { findUserByParam, isObjectIdString };
