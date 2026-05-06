const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  image: { type: String, default: "" },
  text: { type: String, default: "" },
  background: { type: String, default: "#1d4ed8" },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  createdAt: { type: Date, default: Date.now },
});

// MongoDB TTL index: auto-deletes story documents after expiresAt
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Story", storySchema);
