const { validationResult } = require("express-validator");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
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

const listConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "username fullName profilePicture")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (e) { next(e); }
};

const createOrGetConversation = async (req, res, next) => {
  try {
    validate(req);
    const rawId = (req.body.participantId || "").trim();
    const rawUsername = (req.body.participantUsername || "").trim();

    let peer = null;
    if (rawUsername) {
      peer = await findUserByParam(rawUsername);
    } else if (rawId) {
      peer = await findUserByParam(rawId);
    }
    if (!peer) return res.status(404).json({ message: "User not found" });
    const participantId = peer._id;

    if (participantId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    })
      .populate("participants", "username fullName profilePicture")
      .populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.user._id, participantId] });
      conversation = await conversation.populate("participants", "username fullName profilePicture");
    }

    res.status(201).json(conversation);
  } catch (e) { next(e); }
};

const getMessages = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const convo = await Conversation.findById(req.params.id);
    if (!convo || !convo.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate("sender", "username fullName profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(messages.reverse());
  } catch (e) { next(e); }
};

const sendMessage = async (req, res, next) => {
  try {
    validate(req);
    const convo = await Conversation.findById(req.params.id);
    if (!convo || !convo.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = await Message.create({ conversation: convo._id, sender: req.user._id, text: req.body.text });
    convo.lastMessage = message._id;
    convo.updatedAt = new Date();
    await convo.save();

    const recipient = convo.participants.find((p) => p.toString() !== req.user._id.toString());
    if (recipient) {
      await Notification.create({ recipient, sender: req.user._id, type: "message" });
    }

    res.status(201).json(await message.populate("sender", "username fullName profilePicture"));
  } catch (e) { next(e); }
};

module.exports = { listConversations, createOrGetConversation, getMessages, sendMessage };
