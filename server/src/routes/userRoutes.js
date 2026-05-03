const express = require("express");
const { body, query } = require("express-validator");
const auth = require("../middleware/auth");
const { createUploader } = require("../utils/upload");
const { getPublicProfile, updateProfile, toggleFollow, searchUsers } = require("../controllers/userController");

const router = express.Router();
const avatarUpload = createUploader("avatars");

router.get("/search", [query("q").optional().trim().isLength({ max: 100 }).escape()], searchUsers);
router.get("/:id", getPublicProfile);
router.put(
  "/:id",
  auth,
  avatarUpload.single("avatar"),
  [
    body("fullName").optional().trim().isLength({ max: 100 }).escape(),
    body("bio").optional().trim().isLength({ max: 300 }).escape(),
  ],
  updateProfile
);
router.post("/:id/follow", auth, toggleFollow);

module.exports = router;
