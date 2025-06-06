require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const emailRoutes = require("./routes/emailRoutes");
const AIReplyRoutes = require("./routes/AIReplyRoutes");
const connectMongo = require("./db/connectMongo");
const { initVectorDB, searchRelevantRules } = require("./utils/mongoVectorDb");

app.use(cors());
app.use(express.json());

app.use("/api", emailRoutes);
app.use("/api/ai-reply", AIReplyRoutes);
app.use("/api/emails", emailRoutes);


app.get("/api/ping", async (req, res) => {
  try {
    // await searchRelevantRules([0.1, 0.2, 0.3, 0.4]); // dummy vector (example)
    res.send("✅ Server and ChromaDB are alive");
  } catch (err) {
    console.error("Ping error:", err);
    res.status(500).send("❌ Chroma ping failed");
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await connectMongo();
  await initVectorDB();
  console.log(`🚀 Server running on port ${PORT}`);
});

// Keep the process alive
process.stdin.resume();
