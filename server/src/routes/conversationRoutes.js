const express = require("express");
const { body, check } = require("express-validator");
const auth = require("../middleware/auth");
const { listConversations, createOrGetConversation, getMessages, sendMessage } = require("../controllers/messageController");

const router = express.Router();
router.use(auth);
router.get("/", listConversations);
router.post(
  "/",
  [
    check("participantId").optional().trim(),
    check("participantUsername").optional().trim().isLength({ max: 32 }),
    check().custom((_, { req }) => {
      const id = (req.body.participantId || "").trim();
      const un = (req.body.participantUsername || "").trim();
      if (!id && !un) throw new Error("Send participantUsername or participantId");
      return true;
    }),
  ],
  createOrGetConversation
);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", [body("text").trim().isLength({ min: 1, max: 2000 }).escape()], sendMessage);

module.exports = router;
