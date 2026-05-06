const Story = require("../models/Story");
const User = require("../models/User");

const getStories = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id);
    const authorIds = [
      ...(me.friends || []),
      ...(me.following || []),
      me._id,
    ];
    const stories = await Story.find({
      creator: { $in: authorIds },
      expiresAt: { $gt: new Date() },
    })
      .populate("creator", "username fullName profilePicture")
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (e) { next(e); }
};

const createStory = async (req, res, next) => {
  try {
    const { text, background } = req.body;
    if (!text?.trim() && !req.file) {
      return res.status(400).json({ message: "A story needs either text or an image" });
    }
    const story = await Story.create({
      creator: req.user._id,
      image: req.file ? `/uploads/stories/${req.file.filename}` : "",
      text: text || "",
      background: background || "#1d4ed8",
    });
    res.status(201).json(await story.populate("creator", "username fullName profilePicture"));
  } catch (e) { next(e); }
};

const viewStory = async (req, res, next) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewers: req.user._id },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    if (story.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await story.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) { next(e); }
};

module.exports = { getStories, createStory, viewStory, deleteStory };
