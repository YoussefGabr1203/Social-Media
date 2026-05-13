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
// mailer loaded lazily — no startup import needed

const rootEnv = path.join(__dirname, "..", "..", ".env");
const serverEnv = path.join(__dirname, "..", ".env");
dotenv.config({ path: rootEnv });
if (!process.env.MONGO_URI) dotenv.config({ path: serverEnv });

connectDb();

const app = express();
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "blob:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://*.railway.app", "https://*.vercel.app"],
    },
  },
}));

const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").trim();
const corsOrigins = new Set(
  [clientUrl, "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean)
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsOrigins.has(origin.trim())) return callback(null, true);
      console.warn(`[CORS] blocked origin: "${origin}" | CLIENT_URL: "${clientUrl}"`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));
// Limit JSON body to 50 KB — multipart uploads are handled by multer separately
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));
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
  if (process.env.BREVO_API_KEY) {
    console.log("[mail] Brevo API key detected — using Brevo for email delivery");
  } else if (process.env.EMAIL_USER) {
    console.log("[mail] BREVO_API_KEY not set — falling back to SMTP (may fail on Railway)");
  } else {
    console.warn("[mail] No email provider configured — set BREVO_API_KEY in Railway variables");
  }
});
