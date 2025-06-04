const { GoogleGenerativeAI } = require("@google/generative-ai");
const Bottleneck = require("bottleneck");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Cache setup
const cacheDir = path.join(__dirname, "./cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const readCache = promisify(fs.readFile);
const writeCache = promisify(fs.writeFile);
const cacheTTL = 3600000; // 1 hour

async function getFromCache(text) {
  const hash = require("crypto").createHash("sha256").update(text).digest("hex");
  const cachePath = path.join(cacheDir, `${hash}.json`);
  try {
    const data = await readCache(cachePath, "utf8");
    const cached = JSON.parse(data);
    if (Date.now() - cached.timestamp < cacheTTL) return cached.category;
    fs.unlinkSync(cachePath); // expired
  } catch {}
  return null;
}

async function saveToCache(text, category) {
  const hash = require("crypto").createHash("sha256").update(text).digest("hex");
  const cachePath = path.join(cacheDir, `${hash}.json`);
  await writeCache(cachePath, JSON.stringify({ category, timestamp: Date.now() }));
}

// Bottleneck setup: 1 request every 6s (10 per minute)
const limiter = new Bottleneck({
  minTime: 6000,
  maxConcurrent: 1,
  reservoir: 10,
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 60 * 1000, // 1 min
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function categorizeEmail(text, attempt = 1) {
  const cachedCategory = await getFromCache(text);
  if (cachedCategory) return cachedCategory;

  const prompt = `
You are an assistant that categorizes emails into one of these labels:
Interested, Meeting Booked, Not Interested, Spam, Out of Office.

Given the following email text, return ONLY the category name.

Email:
"""
${text}
"""
Category:
  `.trim();

  try {
    // Random jitter + limiter
    await delay(Math.floor(Math.random() * 1000) + 1000);
    const response = await limiter.schedule(() => model.generateContent(prompt));
    const category = response.response.candidates[0].content.parts[0].text.trim();

    await saveToCache(text, category);
    return category;
  } catch (error) {
    const message = error?.message || "";
    const retryInfo = extractRetryDelay(error);

    console.error(`❌ Gemini API Error (Attempt ${attempt}):`, message);

    if (attempt < 5 && /429|quota|limit|rate/i.test(message)) {
      const backoff = retryInfo || Math.min(60000, 2000 * attempt);
      console.log(`⏳ Retrying after ${Math.ceil(backoff / 1000)}s...`);
      await delay(backoff);
      return categorizeEmail(text, attempt + 1);
    }

    return "Uncategorized";
  }
}

function extractRetryDelay(error) {
  try {
    const json = JSON.stringify(error.response);
    const retryMatch = /"retryDelay":"(\d+)s"/.exec(json);
    if (retryMatch) {
      return parseInt(retryMatch[1]) * 1000;
    }
  } catch {}
  return null;
}

module.exports = categorizeEmail;
