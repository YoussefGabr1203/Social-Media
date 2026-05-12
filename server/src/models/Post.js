const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true, maxlength: 2000, default: "" },
    image: { type: String, default: "" },
    tags: [{ type: String, trim: true }],
    likes: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],
    comments: [commentSchema],
    sharedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    shareCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
