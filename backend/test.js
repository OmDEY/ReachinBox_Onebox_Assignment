// 📦 Dependencies
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const { Client } = require("@elastic/elasticsearch");
const axios = require("axios");
const { IncomingWebhook } = require("@slack/webhook");
require("dotenv").config();

// 📦 ElasticSearch client
const esClient = new Client({ node: process.env.ES_URL });

// 📦 Slack webhook
const slack = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

// 📦 Fetch emails from the last 30 days
function fetchEmails() {
  const imap = new Imap({
    user: process.env.EMAIL_1_USER,
    password: process.env.EMAIL_1_PASS,
    host: process.env.EMAIL_1_HOST,
    port: parseInt(process.env.EMAIL_1_PORT),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  imap.once("ready", () => {
    imap.openBox("INBOX", false, () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      imap.search([["SINCE", since.toDateString()]], (err, results) => {
        if (err || !results.length) {
          imap.end();
          return;
        }

        const f = imap.fetch(results, { bodies: "", struct: true });

        f.on("message", (msg, seqno) => {
          msg.on("body", (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) return;

              const email = {
                messageId: parsed.messageId,
                from: parsed.from?.text,
                to: parsed.to?.text,
                subject: parsed.subject,
                date: parsed.date,
                body: parsed.text,
              };

              await indexEmail(email);
              const category = await classifyEmail(email);
              await tagEmail(imap, seqno, category);

              if (category === "Interested") {
                await sendSlackNotification(email);
              }
            });
          });
        });

        f.once("end", () => {
          imap.end();
        });
      });
    });
  });

  imap.once("error", (err) => console.error("IMAP Error:", err));
  imap.once("end", () => console.log("IMAP connection ended"));
  imap.connect();
}

// 🧠 Classify email using Gemini API
async function classifyEmail(email) {
  let retries = 5;
  let delay = 1000;

  while (retries--) {
    try {
      const res = await axios.post(process.env.GEMINI_API_URL, {
        subject: email.subject,
        body: email.body,
      });
      return res.data.category;
    } catch (err) {
      if (err.response?.status === 429) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      } else {
        console.error("Classification Error:", err);
        return "Uncategorized";
      }
    }
  }
  return "Uncategorized";
}

// 🗃️ Index email in Elasticsearch
async function indexEmail(email) {
  try {
    await esClient.index({
      index: "emails",
      id: email.messageId,
      document: email,
    });
  } catch (err) {
    console.error("Elasticsearch Error:", err);
  }
}

// 🏷️ Tag email in inbox
function tagEmail(imap, seqno, category) {
  const folder = category || "Uncategorized";

  imap.getBoxes((err, boxes) => {
    if (err) return console.error("Error getting boxes:", err);

    if (!boxes[folder]) {
      imap.addBox(folder, (err) => {
        if (err) return console.error("Add box error:", err);
        imap.move(
          seqno,
          folder,
          (err) => err && console.error("Move error:", err)
        );
      });
    } else {
      imap.move(
        seqno,
        folder,
        (err) => err && console.error("Move error:", err)
      );
    }
  });
}

// 🔔 Send Slack notification
async function sendSlackNotification(email) {
  await slack.send({
    text: `📬 *New Interested Email Received*
*From:* ${email.from}
*Subject:* ${email.subject}
*Date:* ${email.date}`,
  });
}

// 🚀 Start processing
fetchEmails();
