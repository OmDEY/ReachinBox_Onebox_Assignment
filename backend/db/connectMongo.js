const mongoose = require("mongoose");
require("dotenv").config();

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "your-fallback-uri", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

module.exports = connectMongo;
