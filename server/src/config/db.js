const mongoose = require("mongoose");

const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || typeof uri !== "string") {
    console.error(
      "Missing MONGO_URI. Create a .env file in the project root (next to README.md) with MONGO_URI=... — see .env.example"
    );
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
};

module.exports = connectDb;
