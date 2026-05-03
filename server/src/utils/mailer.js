const nodemailer = require("nodemailer");

let transporter;

/**
 * Creates a transporter from environment variables.
 *
 * Priority:
 * 1) SMTP_URL or EMAIL_SMTP_URL — full connection string (e.g. smtps://user:pass@smtp.example.com:465)
 * 2) SMTP_HOST + EMAIL_USER + EMAIL_PASS — any provider (set SMTP_PORT, SMTP_SECURE as needed)
 * 3) EMAIL_USER + EMAIL_PASS only — assumes Gmail on smtp.gmail.com (port from SMTP_PORT or 465)
 *
 * Gmail: 2FA must be ON, then you create a separate "App password" (16 characters).
 * Put that value in EMAIL_PASS — not your normal Google sign-in password.
 * Google often shows the app password with spaces; spaces are stripped automatically for Gmail SMTP.
 */
const normalizePassForGmail = (pass, smtpHostOrHint) => {
  const p = (pass || "").trim();
  if (!p) return p;
  const h = (smtpHostOrHint || "").toLowerCase();
  if (h.includes("gmail")) return p.replace(/\s+/g, "");
  return p;
};

const createTransportFromEnv = () => {
  const smtpUrl = (process.env.SMTP_URL || process.env.EMAIL_SMTP_URL || "").trim();
  if (smtpUrl) {
    return nodemailer.createTransport(smtpUrl);
  }

  const user = (process.env.EMAIL_USER || "").trim();
  const passRaw = (process.env.EMAIL_PASS || "").trim();
  if (!user || !passRaw) {
    return null;
  }

  const host = (process.env.SMTP_HOST || "").trim();
  if (host) {
    const pass = normalizePassForGmail(passRaw, host);
    const port = Number(process.env.SMTP_PORT || 587);
    const secure =
      process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465;
    const opts = {
      host,
      port,
      secure,
      auth: { user, pass },
    };
    if (process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "false") {
      opts.tls = { rejectUnauthorized: false };
    }
    return nodemailer.createTransport(opts);
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465;
  const pass = normalizePassForGmail(passRaw, "smtp.gmail.com");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure && port === 587,
  });
};

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransportFromEnv();
  }
  return transporter;
};

const formatMailError = (err) => {
  const parts = [err.message];
  if (err.code) parts.push(`code=${err.code}`);
  if (err.response) parts.push(String(err.response).slice(0, 500));
  if (err.responseCode) parts.push(`smtp=${err.responseCode}`);
  return parts.join(" | ");
};

const sendMail = async ({ to, subject, html, text }) => {
  const tx = getTransporter();
  if (!tx) {
    throw new Error("Email is not configured (set EMAIL_USER and EMAIL_PASS, or SMTP_URL / SMTP_HOST)");
  }
  const fromAddr = (process.env.EMAIL_FROM || process.env.EMAIL_USER || "").trim();
  if (!fromAddr) {
    throw new Error("Set EMAIL_FROM or EMAIL_USER so outgoing mail has a From address");
  }
  const name = (process.env.EMAIL_FROM_NAME || "").trim();
  const fromHeader = name ? `"${name}" <${fromAddr}>` : fromAddr;
  try {
    await tx.sendMail({
      from: fromHeader,
      to,
      subject,
      html,
      text: text || undefined,
    });
  } catch (err) {
    err.mailDebugMessage = formatMailError(err);
    throw err;
  }
};

/** Clears cached transport (e.g. after env reload in tests). */
const resetTransporter = () => {
  transporter = null;
};

module.exports = { sendMail, getTransporter, resetTransporter, formatMailError };
