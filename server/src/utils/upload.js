const fs = require("fs");
const path = require("path");
const multer = require("multer");

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed"));
  }
  cb(null, true);
};

const makeStorage = (subDir) => {
  const dest = path.join(__dirname, "..", "..", "uploads", subDir);
  // Ensure the upload directory exists before multer tries to write to it
  fs.mkdirSync(dest, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
  });
};

const createUploader = (subDir) =>
  multer({
    storage: makeStorage(subDir),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

module.exports = { createUploader };
