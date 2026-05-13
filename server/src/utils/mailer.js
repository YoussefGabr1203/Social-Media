const nodemailer = require("nodemailer");

// ---------------------------------------------------------------------------
// Brevo (formerly Sendinblue) — HTTP API, no domain required, verify sender email only
// ---------------------------------------------------------------------------
const sendViaBrevo = async ({ to, subject, html, text }) => {
  const https = require("https");
  const fromAddr = (process.env.EMAIL_FROM || "").trim();
  const fromName = (process.env.EMAIL_FROM_NAME || "SocialDash").trim();

  const body = JSON.stringify({
    sender: { name: fromName, email: fromAddr },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text || undefined,
  });

  await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.brevo.com",
        path: "/v3/smtp/email",
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            const err = new Error(`Brevo API error ${res.statusCode}: ${data}`);
            reject(err);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
};

// ---------------------------------------------------------------------------
// Nodemailer / SMTP (local dev only — Railway blocks port 587)
// ---------------------------------------------------------------------------
let _smtpTransporter = null;

const normalizePassForGmail = (pass, host) => {
  const p = (pass || "").trim();
  if (!p) return p;
  if ((host || "").toLowerCase().includes("gmail")) return p.replace(/\s+/g, "");
  return p;
};

const createSmtpTransport = () => {
  const smtpUrl = (process.env.SMTP_URL || process.env.EMAIL_SMTP_URL || "").trim();
  if (smtpUrl) return nodemailer.createTransport(smtpUrl);

  const user = (process.env.EMAIL_USER || "").trim();
  const passRaw = (process.env.EMAIL_PASS || "").trim();
  if (!user || !passRaw) return null;

  const host = (process.env.SMTP_HOST || "").trim();
  if (host) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465;
    const opts = { host, port, secure, auth: { user, pass: normalizePassForGmail(passRaw, host) } };
    if (process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "false") opts.tls = { rejectUnauthorized: false };
    return nodemailer.createTransport(opts);
  }

  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass: normalizePassForGmail(passRaw, "smtp.gmail.com") },
    requireTLS: port === 587,
  });
};

const getSmtpTransporter = () => {
  if (!_smtpTransporter) _smtpTransporter = createSmtpTransport();
  return _smtpTransporter;
};

const sendViaSmtp = async ({ to, subject, html, text }) => {
  const tx = getSmtpTransporter();
  if (!tx) throw new Error("Email not configured — set BREVO_API_KEY in Railway variables");

  const fromAddr = (process.env.EMAIL_FROM || process.env.EMAIL_USER || "").trim();
  if (!fromAddr) throw new Error("Set EMAIL_FROM so outgoing mail has a From address");

  const name = (process.env.EMAIL_FROM_NAME || "").trim();
  const from = name ? `"${name}" <${fromAddr}>` : fromAddr;

  try {
    await tx.sendMail({ from, to, subject, html, text: text || undefined });
  } catch (err) {
    const parts = [err.message];
    if (err.code) parts.push(`code=${err.code}`);
    if (err.response) parts.push(String(err.response).slice(0, 500));
    err.mailDebugMessage = parts.join(" | ");
    throw err;
  }
};

// ---------------------------------------------------------------------------
// Public API — Brevo when key present, otherwise SMTP (local dev)
// ---------------------------------------------------------------------------
const sendMail = async (opts) => {
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevo(opts);
  }
  return sendViaSmtp(opts);
};

const resetTransporter = () => { _smtpTransporter = null; };

module.exports = { sendMail, resetTransporter };
