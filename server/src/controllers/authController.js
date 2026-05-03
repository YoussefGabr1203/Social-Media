const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { sendMail } = require("../utils/mailer");

const validate = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error(errors.array()[0].msg);
    err.statusCode = 400;
    throw err;
  }
};

const register = async (req, res, next) => {
  try {
    validate(req);
    const { username, email, password } = req.body;
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(409).json({ message: "Username or email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    let user;
    try {
      user = await User.create({ username, email, passwordHash, fullName: req.body.fullName || "" });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(409).json({ message: "Username or email already exists" });
      }
      throw dbErr;
    }
    const token = signToken(user._id);

    try {
      await sendMail({
        to: user.email,
        subject: "Welcome to Social Media App",
        html: `<h2>Hi ${user.username}, your account is ready.</h2>`,
      });
    } catch (mailErr) {
      console.error("Registration welcome email failed (account still created):", mailErr.message);
    }

    res.status(201).json({ token, user: await User.findById(user._id).select("-passwordHash") });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    validate(req);
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id);
    const safeUser = await User.findById(user._id).select("-passwordHash");
    res.json({ token, user: safeUser });
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res) => res.json({ message: "Logged out" });

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    next(e);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    validate(req);
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ message: "If the email exists, reset instructions were sent" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
    try {
      await sendMail({ to: user.email, subject: "Reset your password", html: `<a href="${resetUrl}">Reset password</a>` });
    } catch (mailErr) {
      console.error("Password reset email failed:", mailErr.message);
      return res.status(503).json({ message: "Could not send email. Check server email configuration." });
    }

    res.json({ message: "If the email exists, reset instructions were sent" });
  } catch (e) {
    next(e);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    validate(req);
    const { token, email, password } = req.body;
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordHash");

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (e) {
    next(e);
  }
};

module.exports = { register, login, logout, me, forgotPassword, resetPassword };
