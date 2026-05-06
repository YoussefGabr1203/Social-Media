const Notification = require("../models/Notification");

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "username fullName profilePicture")
      .populate("post")
      .sort({ read: 1, createdAt: -1 });
    res.json(notifications);
  } catch (e) { next(e); }
};

const markOneRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (e) { next(e); }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (e) { next(e); }
};

const deleteOne = async (req, res, next) => {
  try {
    const result = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    if (!result) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Deleted" });
  } catch (e) { next(e); }
};

const deleteAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ message: "All notifications deleted" });
  } catch (e) { next(e); }
};

module.exports = { getNotifications, markOneRead, markAllRead, deleteOne, deleteAll };
