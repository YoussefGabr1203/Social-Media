const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { findUserByParam } = require("../utils/resolveUser");

const areFriends = (aId, bId, userDoc) =>
  (userDoc.friends || []).some((fid) => fid.toString() === bId.toString());

const sendRequest = async (req, res, next) => {
  try {
    const tu = (req.body.targetUsername || "").trim();
    const tid = (req.body.targetUserId || "").trim();
    const raw = tu || tid;
    if (!raw) return res.status(400).json({ message: "targetUsername or targetUserId required" });

    const target = await findUserByParam(raw);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot friend yourself" });
    }

    const me = await User.findById(req.user._id);
    if (areFriends(req.user._id, target._id, me)) {
      return res.status(409).json({ message: "Already friends" });
    }

    const reverse = await FriendRequest.findOne({ from: target._id, to: req.user._id, status: "pending" });
    if (reverse) {
      return res.status(409).json({ message: "This person already sent you a request — accept it in Friend requests." });
    }

    let fr = await FriendRequest.findOne({ from: req.user._id, to: target._id });
    if (fr) {
      if (fr.status === "pending") return res.status(409).json({ message: "Request already sent" });
      if (fr.status === "accepted") return res.status(409).json({ message: "Already friends" });
      fr.status = "pending";
      await fr.save();
    } else {
      fr = await FriendRequest.create({ from: req.user._id, to: target._id, status: "pending" });
    }

    await Notification.create({
      recipient: target._id,
      sender: req.user._id,
      type: "friend_request",
    });

    res.status(201).json({ message: "Friend request sent", requestId: fr._id });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Request already exists" });
    next(e);
  }
};

const cancelOutgoing = async (req, res, next) => {
  try {
    const target = await findUserByParam(req.params.slug);
    if (!target) return res.status(404).json({ message: "User not found" });
    const result = await FriendRequest.deleteOne({ from: req.user._id, to: target._id, status: "pending" });
    if (result.deletedCount === 0) return res.status(404).json({ message: "No pending request" });
    res.json({ message: "Request cancelled" });
  } catch (e) {
    next(e);
  }
};

const acceptRequest = async (req, res, next) => {
  try {
    const fr = await FriendRequest.findOne({
      _id: req.params.requestId,
      to: req.user._id,
      status: "pending",
    });
    if (!fr) return res.status(404).json({ message: "Request not found" });

    const a = fr.from;
    const b = fr.to;

    await User.updateOne({ _id: a }, { $addToSet: { friends: b } });
    await User.updateOne({ _id: b }, { $addToSet: { friends: a } });

    await FriendRequest.deleteMany({
      status: "pending",
      $or: [
        { from: a, to: b },
        { from: b, to: a },
      ],
    });

    res.json({ message: "You are now friends" });
  } catch (e) {
    next(e);
  }
};

const declineRequest = async (req, res, next) => {
  try {
    const fr = await FriendRequest.findOneAndUpdate(
      { _id: req.params.requestId, to: req.user._id, status: "pending" },
      { status: "declined" },
      { new: true }
    );
    if (!fr) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Request declined" });
  } catch (e) {
    next(e);
  }
};

const unfriend = async (req, res, next) => {
  try {
    const target = await findUserByParam(req.params.slug);
    if (!target) return res.status(404).json({ message: "User not found" });
    const tid = target._id;
    await User.updateOne({ _id: req.user._id }, { $pull: { friends: tid } });
    await User.updateOne({ _id: tid }, { $pull: { friends: req.user._id } });
    await FriendRequest.deleteMany({
      $or: [
        { from: req.user._id, to: tid },
        { from: tid, to: req.user._id },
      ],
    });
    res.json({ message: "Unfriended" });
  } catch (e) {
    next(e);
  }
};

const listIncoming = async (req, res, next) => {
  try {
    const list = await FriendRequest.find({ to: req.user._id, status: "pending" })
      .populate("from", "username fullName profilePicture")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
};

const listFriends = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id).populate("friends", "username fullName profilePicture");
    res.json(me.friends || []);
  } catch (e) {
    next(e);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const target = await findUserByParam(req.params.slug);
    if (!target) return res.status(404).json({ message: "User not found" });

    const me = await User.findById(req.user._id);
    if (areFriends(req.user._id, target._id, me)) {
      return res.json({ status: "friends" });
    }

    const out = await FriendRequest.findOne({ from: req.user._id, to: target._id, status: "pending" });
    if (out) return res.json({ status: "pending_out", requestId: out._id });

    const inc = await FriendRequest.findOne({ from: target._id, to: req.user._id, status: "pending" });
    if (inc) return res.json({ status: "pending_in", requestId: inc._id });

    res.json({ status: "none" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  sendRequest,
  cancelOutgoing,
  acceptRequest,
  declineRequest,
  unfriend,
  listIncoming,
  listFriends,
  getStatus,
};
