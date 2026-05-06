const express = require("express");
const auth = require("../middleware/auth");
const { createUploader } = require("../utils/upload");
const { getStories, createStory, viewStory, deleteStory } = require("../controllers/storyController");

const router = express.Router();
const storyUpload = createUploader("stories");

router.use(auth);
router.get("/", getStories);
router.post("/", storyUpload.single("image"), createStory);
router.post("/:id/view", viewStory);
router.delete("/:id", deleteStory);

module.exports = router;
