require('dotenv').config(); // Ensure this is present at the top

const axios = require("axios");

const WEBHOOK_URL = process.env.WEBHOOK_SITE_URL;

const triggerWebhook = async (emailDetails) => {
  try {
    await axios.post(WEBHOOK_URL, {
      event: "InterestedEmail",
      ...emailDetails,
      timestamp: new Date(),
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("Webhook triggered successfully");
  } catch (err) {
    console.error("Webhook trigger failed:", err.response?.data || err.message, err.response?.status);
  }
};

module.exports = triggerWebhook;
