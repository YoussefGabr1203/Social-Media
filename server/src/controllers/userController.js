const { validationResult } = require("express-validator");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { findUserByParam } = require("../utils/resolveUser");

const validate = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error(errors.array()[0].msg);
    err.statusCode = 400;
    throw err;
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const user = await findUserByParam(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const obj = user.toObject();
    obj.friendsCount = (user.friends || []).length;
    delete obj.friends;
    res.json(obj);
  } catch (e) { next(e); }
};

const updateProfile = async (req, res, next) => {
  try {
    validate(req);
    if (req.user._id.toString() !== req.params.id) return res.status(403).json({ message: "Forbidden" });
    const updates = {
      fullName: req.body.fullName,
      bio: req.body.bio,
    };
    if (req.file) updates.profilePicture = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-passwordHash");
    res.json(user);
  } catch (e) { next(e); }
};

const toggleFollow = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id);
    const target = await findUserByParam(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    const targetId = target._id.toString();
    if (targetId === req.user._id.toString()) return res.status(400).json({ message: "Cannot follow yourself" });

    const isFollowing = me.following.some((id) => id.toString() === targetId);
    if (isFollowing) {
      me.following = me.following.filter((id) => id.toString() !== targetId);
      target.followers = target.followers.filter((id) => id.toString() !== me._id.toString());
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
      await Notification.create({
        recipient: target._id,
        sender: me._id,
        type: "follow",
      });
    }

    await me.save();
    await target.save();
    res.json({ following: !isFollowing });
  } catch (e) { next(e); }
};

const searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } },
      ],
    }).select("-passwordHash").limit(30);

    res.json(users);
  } catch (e) { next(e); }
};

module.exports = { getPublicProfile, updateProfile, toggleFollow, searchUsers };
