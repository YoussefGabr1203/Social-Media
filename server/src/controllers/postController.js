const { validationResult } = require("express-validator");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { findUserByParam } = require("../utils/resolveUser");

const AUTHOR_FIELDS = "username fullName profilePicture";

const sharedFromPopulate = {
  path: "sharedFrom",
  populate: { path: "author", select: AUTHOR_FIELDS },
};

const extractMentions = async (text, senderId, postId) => {
  const handles = [...new Set((text.match(/@(\w+)/g) || []).map((h) => h.slice(1)))];
  if (!handles.length) return;
  const users = await User.find({ username: { $in: handles } }).select("_id");
  const notifs = users
    .filter((u) => u._id.toString() !== senderId.toString())
    .map((u) => ({ recipient: u._id, sender: senderId, type: "mention", post: postId }));
  if (notifs.length) await Notification.insertMany(notifs);
};

const validate = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error(errors.array()[0].msg);
    err.statusCode = 400;
    throw err;
  }
};

const getFeed = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const me = await User.findById(req.user._id);
    const friends = me.friends && me.friends.length > 0 ? me.friends : [];
    const authors = friends.length > 0 ? [...friends, me._id] : [...me.following, me._id];
    const posts = await Post.find({ author: { $in: authors } })
      .populate("author", AUTHOR_FIELDS)
      .populate("comments.user", "username profilePicture")
      .populate(sharedFromPopulate)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(posts);
  } catch (e) { next(e); }
};

const getPostsByUser = async (req, res, next) => {
  try {
    const author = await findUserByParam(req.params.id);
    if (!author) return res.status(404).json({ message: "User not found" });
    const posts = await Post.find({ author: author._id })
      .populate("author", AUTHOR_FIELDS)
      .populate(sharedFromPopulate)
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (e) { next(e); }
};

const createPost = async (req, res, next) => {
  try {
    validate(req);
    const tags = req.body.tags ? req.body.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const post = await Post.create({
      author: req.user._id,
      content: req.body.content,
      image: req.file ? req.file.path : "",
      tags,
    });
    await extractMentions(req.body.content || "", req.user._id, post._id);
    res.status(201).json(await post.populate("author", AUTHOR_FIELDS));
  } catch (e) { next(e); }
};

const sharePost = async (req, res, next) => {
  try {
    const original = await Post.findById(req.params.id)
      .populate("author", AUTHOR_FIELDS)
      .populate(sharedFromPopulate);
    if (!original) return res.status(404).json({ message: "Post not found" });

    // Always point to the root post — prevent nested share chains
    const rootId = original.sharedFrom ? original.sharedFrom._id : original._id;

    const quoteContent = (req.body.content || "").trim().slice(0, 500);

    const shared = await Post.create({
      author: req.user._id,
      content: quoteContent,
      sharedFrom: rootId,
    });

    // Increment share count on the root post
    await Post.findByIdAndUpdate(rootId, { $inc: { shareCount: 1 } });

    // Notify original author if it's not the sharer themselves
    const rootAuthorId = original.sharedFrom
      ? original.sharedFrom.author?._id || original.sharedFrom.author
      : original.author?._id || original.author;

    if (rootAuthorId && rootAuthorId.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: rootAuthorId,
        sender: req.user._id,
        type: "share",
        post: rootId,
      });
    }

    const populated = await Post.findById(shared._id)
      .populate("author", AUTHOR_FIELDS)
      .populate(sharedFromPopulate);

    res.status(201).json(populated);
  } catch (e) { next(e); }
};

const updatePost = async (req, res, next) => {
  try {
    validate(req);
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });

    post.content = req.body.content ?? post.content;
    if (req.body.tags) post.tags = req.body.tags.split(",").map((t) => t.trim());
    if (req.file) post.image = req.file.path;
    await post.save();
    res.json(post);
  } catch (e) { next(e); }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });
    await post.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) { next(e); }
};

const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const idx = post.likes.findIndex((l) => l.user.toString() === req.user._id.toString());
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push({ user: req.user._id });
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({ recipient: post.author, sender: req.user._id, type: "like", post: post._id });
      }
    }
    await post.save();
    res.json({ likes: post.likes.length });
  } catch (e) { next(e); }
};

const addComment = async (req, res, next) => {
  try {
    validate(req);
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.comments.push({ user: req.user._id, text: req.body.text });
    await post.save();
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({ recipient: post.author, sender: req.user._id, type: "comment", post: post._id });
    }
    await extractMentions(req.body.text || "", req.user._id, post._id);
    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (e) { next(e); }
};

const deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comment = post.comments.id(req.params.cid);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });
    comment.deleteOne();
    await post.save();
    res.json({ message: "Comment removed" });
  } catch (e) { next(e); }
};

const searchPosts = async (req, res, next) => {
  try {
    const raw = (req.query.q || "").trim();
    if (!raw) return res.json([]);
    const q = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingAuthors = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } },
      ],
    }).select("_id");
    const authorIds = matchingAuthors.map((u) => u._id);
    const posts = await Post.find({
      $or: [
        { content: { $regex: q, $options: "i" } },
        { tags: { $elemMatch: { $regex: q, $options: "i" } } },
        ...(authorIds.length > 0 ? [{ author: { $in: authorIds } }] : []),
      ],
    })
      .populate("author", AUTHOR_FIELDS)
      .populate(sharedFromPopulate)
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (e) { next(e); }
};

module.exports = { getFeed, getPostsByUser, createPost, sharePost, updatePost, deletePost, toggleLike, addComment, deleteComment, searchPosts };
