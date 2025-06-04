// utils/slackNotifier.js
const axios = require("axios");

const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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";

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
