// utils/slackNotifier.js
const axios = require("axios");
require("dotenv").config();

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const sendSlackNotification = async (emailDetails) => {
  try {
    const { from, subject, date } = emailDetails;

    const message = {
      text: `📬 *New Interested Email Received*\n*From:* ${from}\n*Subject:* ${subject}\n*Date:* ${new Date(date).toLocaleString()}`,
    };

    await axios.post(SLACK_WEBHOOK_URL, message);
    console.log("✅ Slack notification sent");
  } catch (err) {
    console.error("❌ Slack notification failed:", err.message);
  }
};

module.exports = sendSlackNotification;
