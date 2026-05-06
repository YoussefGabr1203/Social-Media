const express = require("express");
const { body, query } = require("express-validator");
const auth = require("../middleware/auth");
const { createUploader } = require("../utils/upload");
const { getFeed, getPostsByUser, createPost, updatePost, deletePost, toggleLike, addComment, deleteComment, searchPosts } = require("../controllers/postController");

const router = express.Router();
const postUpload = createUploader("posts");

router.get("/", auth, getFeed);
router.get("/search", [query("q").optional().trim().isLength({ max: 100 })], searchPosts);
router.get("/user/:id", auth, getPostsByUser);
router.post(
  "/",
  auth,
  postUpload.single("image"),
  [body("content").trim().isLength({ min: 1, max: 2000 }), body("tags").optional().trim().isLength({ max: 200 })],
  createPost
);
router.put(
  "/:id",
  auth,
  postUpload.single("image"),
  [body("content").optional().trim().isLength({ min: 1, max: 2000 }).escape(), body("tags").optional().trim().isLength({ max: 200 })],
  updatePost
);
router.delete("/:id", auth, deletePost);
router.post("/:id/like", auth, toggleLike);
router.post("/:id/comment", auth, [body("text").trim().isLength({ min: 1, max: 500 })], addComment);
router.delete("/:id/comment/:cid", auth, deleteComment);

module.exports = router;
