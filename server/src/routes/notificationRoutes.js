const express = require("express");
const auth = require("../middleware/auth");
const { getNotifications, markOneRead, markAllRead, deleteOne, deleteAll } = require("../controllers/notificationController");

const router = express.Router();
router.use(auth);
router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markOneRead);
router.delete("/", deleteAll);
router.delete("/:id", deleteOne);

module.exports = router;
