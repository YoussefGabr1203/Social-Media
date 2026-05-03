const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const {
  sendRequest,
  cancelOutgoing,
  acceptRequest,
  declineRequest,
  unfriend,
  listIncoming,
  listFriends,
  getStatus,
} = require("../controllers/friendController");

const router = express.Router();
router.use(auth);

router.get("/incoming", listIncoming);
router.get("/list", listFriends);
router.get("/status/:slug", getStatus);

router.post(
  "/request",
  [
    body("targetUsername").optional().trim().isLength({ max: 32 }),
    body("targetUserId").optional().trim().isLength({ max: 32 }),
    body().custom((_, { req }) => {
      const a = (req.body.targetUsername || "").trim();
      const b = (req.body.targetUserId || "").trim();
      if (!a && !b) throw new Error("Send targetUsername or targetUserId");
      return true;
    }),
  ],
  sendRequest
);

router.delete("/request/:slug", cancelOutgoing);
router.post("/accept/:requestId", acceptRequest);
router.post("/decline/:requestId", declineRequest);
router.delete("/:slug", unfriend);

module.exports = router;
