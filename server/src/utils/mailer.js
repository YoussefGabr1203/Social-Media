const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html }) => {
  const tx = getTransporter();
  if (!tx) {
    throw new Error("Email is not configured (set EMAIL_USER and EMAIL_PASS in .env)");
  }
  await tx.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

module.exports = { sendMail };
