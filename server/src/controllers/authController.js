const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { sendMail } = require("../utils/mailer");
const formatMailError = (err) => err?.resendError ? JSON.stringify(err.resendError) : (err?.mailDebugMessage || err?.message || String(err));

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
    const token = signToken(user._id, user.tokenVersion);

    sendMail({
      to: user.email,
      subject: "Welcome to SocialDash",
      html: `<h2>Hi ${user.username}, your account is ready.</h2>`,
    }).catch((mailErr) => {
      console.error("Registration welcome email failed (account still created):", formatMailError(mailErr));
    });

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

    const token = signToken(user._id, user.tokenVersion);
    const safeUser = await User.findById(user._id).select("-passwordHash");
    res.json({ token, user: safeUser });
  } catch (e) {
    next(e);
  }
};

// Requires auth middleware — increments tokenVersion to invalidate all existing tokens for this user.
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    res.json({ message: "Logged out" });
  } catch (e) {
    next(e);
  }
};

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
  } catch (e) {
    return next(e);
  }

  // Always respond immediately — prevents email enumeration.
  res.json({ message: "If the email exists, reset instructions were sent" });

  (async () => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    const clientBase = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetUrl = `${clientBase}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[dev] Password reset link for ${user.email}:\n  ${resetUrl}\n`);
    }

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1d4ed8">Reset your SocialDash password</h2>
        <p>Hi ${user.username || ""},</p>
        <p>We received a request to reset your password. Click the button below — the link is valid for <strong>30 minutes</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Reset Password</a>
        <p style="color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email. Your password will not change.</p>
      </div>
    `.trim();
    const text = `Reset your SocialDash password (link valid 30 minutes):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`;

    try {
      await sendMail({ to: user.email, subject: "Reset your SocialDash password", html, text });
      console.log(`[mail] Reset email sent to ${user.email}`);
    } catch (mailErr) {
      console.error(`[mail] Reset email FAILED for ${user.email}:`, formatMailError(mailErr));
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save().catch(() => {});
    }
  })().catch((err) => console.error("forgotPassword background error:", err));
};

const resetPassword = async (req, res, next) => {
  console.log("[reset-password] request received, email:", req.body?.email);
  try {
    validate(req);
    const { token, email, password } = req.body;
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordHash +passwordResetToken +passwordResetExpires");

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate all existing sessions after password reset
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({ message: "Password reset successful. Please log in with your new password." });
  } catch (e) {
    next(e);
  }
};

const testEmail = async (req, res) => {
  const to = process.env.EMAIL_USER;
  if (!to) {
    return res.status(500).json({ ok: false, error: "EMAIL_USER is not set — nothing to test against" });
  }
  try {
    await sendMail({
      to,
      subject: "SocialDash — SMTP connectivity test",
      html: "<p>Your email configuration is working correctly.</p>",
      text: "Your email configuration is working correctly.",
    });
    res.json({ ok: true, message: `Test email sent to ${to}` });
  } catch (err) {
    res.status(500).json({ ok: false, error: formatMailError(err) });
  }
};

module.exports = { register, login, logout, me, forgotPassword, resetPassword, testEmail };
