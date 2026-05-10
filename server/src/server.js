const path = require("path");
const multer = require("multer");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDb = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const friendRoutes = require("./routes/friendRoutes");
const storyRoutes = require("./routes/storyRoutes");
const errorHandler = require("./middleware/errorHandler");
const { getTransporter, formatMailError } = require("./utils/mailer");

const rootEnv = path.join(__dirname, "..", "..", ".env");
const serverEnv = path.join(__dirname, "..", ".env");
dotenv.config({ path: rootEnv });
if (!process.env.MONGO_URI) dotenv.config({ path: serverEnv });

connectDb();

const app = express();
app.use(helmet());
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const corsOrigins = new Set(
  [clientUrl, "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean)
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsOrigins.has(origin)) return callback(null, true);
      console.warn(`[CORS] blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/stories", storyRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === "Only image uploads are allowed") {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  const tx = getTransporter();
  if (tx) {
    tx.verify()
      .then(() => console.log("[mail] SMTP connection verified"))
      .catch((e) => console.warn("[mail] SMTP verify failed — password reset emails will fail until fixed:", formatMailError(e)));
  } else {
    console.warn(
      "[mail] Not configured: set EMAIL_USER + EMAIL_PASS. Gmail: after 2FA, create an App password (myaccount.google.com → Security → App passwords) and put that 16-char value in EMAIL_PASS."
    );
  }
});
