const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const { register, login, logout, me, forgotPassword, resetPassword, testEmail } = require("../controllers/authController");
const { authLimiter, passwordResetLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  [
    body("username").trim().isLength({ min: 3, max: 30 }).escape(),
    body("email").trim().isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("fullName").optional().trim().isLength({ max: 100 }).escape(),
  ],
  register
);
router.post(
  "/login",
  authLimiter,
  [body("email").trim().isEmail().normalizeEmail(), body("password").isLength({ min: 6 })],
  login
);
router.post("/logout", auth, logout);
router.get("/me", auth, me);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  [body("email").trim().isEmail().normalizeEmail()],
  forgotPassword
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  [
    body("token").trim().notEmpty(),
    body("email").trim().isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  resetPassword
);

if (process.env.NODE_ENV !== "production") {
  router.get("/test-email", testEmail);
}

module.exports = router;
