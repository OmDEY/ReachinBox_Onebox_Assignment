require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const emailRoutes = require("./routes/emailRoutes");
const AIReplyRoutes = require("./routes/AIReplyRoutes");
const { initVectorDB } = require("./utils/vectorStore");

app.use(cors());
app.use(express.json());

app.use("/api", emailRoutes);
app.use("/api/ai-reply", AIReplyRoutes);
app.use("/api/emails", emailRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await initVectorDB();
  console.log(`🚀 Server running on port ${PORT}`);
});

// Keep the process alive
process.stdin.resume();
