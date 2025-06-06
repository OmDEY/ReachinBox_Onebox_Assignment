const client = require("../elasticSearch");
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { addRule, searchRelevantRules } = require("../utils/mongoVectorDb");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// exports.getEmails = async (req, res) => {
//   try {
//     const {
//       search = "",
//       folder = "",
//       account = "",
//       category = "",
//       from = 0,
//     } = req.query;

//     const must = [];

//     if (search.trim()) {
//       must.push({
//         multi_match: {
//           query: search,
//           fields: ["from", "to", "subject", "body"],
//           fuzziness: "AUTO",
//           operator: "and",
//         },
//       });
//     }

//     // Skip folder filter if folder is "Inbox" (case-insensitive)
//     if (folder.trim() && folder.toLowerCase() !== "inbox") {
//       must.push({ term: { "folder.keyword": folder } });
//     }

//     if (account.trim()) {
//       must.push({ term: { "account.keyword": account } });
//     }

//     if (category.trim()) {
//       must.push({ term: { "category.keyword": category } });
//     }

//     const queryBody = {
//       query: must.length ? { bool: { must } } : { match_all: {} },
//       sort: [{ date: { order: "desc" } }],
//       from: Number(from) || 0,
//       size: 100,
//     };

//     const response = await client.search({
//       index: "raw_emails",
//       body: queryBody,
//     });

//     const emails = response.hits.hits.map(({ _id, _source }) => ({
//       id: _id,
//       ..._source,
//     }));

//     res.status(200).json(emails);
//   } catch (error) {
//     console.error("❌ Error fetching emails:", error?.meta?.body || error);
//     res.status(500).json({ error: "Failed to fetch emails" });
//   }
// };

// Configure your transporter

exports.getEmails = async (req, res) => {
  try {
    const {
      search = "",
      folder = "",
      accountEmail = "",
      category = "",
      from = 0,
      size = 100,
    } = req.query;

    const must = [];

    if (search.trim()) {
      must.push({
        query_string: {
          query: `*${search}*`,
          fields: ["from", "to", "subject", "body"],
          default_operator: "AND",
        },
      });
    }

    // if (folder.trim() && folder.toLowerCase() !== "inbox") {
    //   must.push({ term: { "folder.keyword": folder } });
    // }

    if (folder.trim()) {
      must.push({ term: { folder: folder } }); // ✅ remove .keyword
    }

    if (accountEmail.trim()) {
      must.push({ term: { "accountEmail.keyword": accountEmail } }); // ✅ keep .keyword
    }

    if (category.trim()) {
      must.push({ term: { category: category } }); // ✅ remove .keyword
    }

    const queryBody = {
      query: must.length ? { bool: { must } } : { match_all: {} },
      sort: [{ date: { order: "desc" } }],
      from: Number(from),
      size: Number(size),
      track_total_hits: true,
    };

    const response = await client.search({
      index: "raw_emails",
      body: queryBody,
    });

    // console.log("response >>>> ", response.body.hits.hits);

    const hits = response?.body?.hits?.hits || [];
    const total = response?.body?.hits?.total?.value || 0;

    const emails = hits.map(({ _id, _source }) => ({
      id: _id,
      ..._source,
    }));

    res.status(200).json({ total, emails });
  } catch (error) {
    console.error("❌ Error fetching emails:", error?.meta?.body || error);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_1_USER,
    pass: process.env.EMAIL_1_PASS,
  },
});

exports.sendReply = async (req, res) => {
  const { to, subject, text, messageId } = req.body;

  if (!to || !subject || !text || !messageId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_1_USER,
      to,
      subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
      text,
      inReplyTo: messageId,
      references: [messageId],
    });

    res.json({ success: true, message: "Reply sent in same thread" });
  } catch (err) {
    console.error("Error sending reply:", err);
    res.status(500).json({ error: "Failed to send reply" });
  }
};

async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });

  const result = await model.embedContent({
    content: {
      parts: [{ text }],
    },
    taskType: "retrieval_document", // or "semantic_similarity" based on your use-case
  });

  return result.embedding;
}

exports.saveRule = async (req, res) => {
  const { id, text } = req.body;
  const embedding = await getEmbedding(text);
  console.log("embedding >>>> ", embedding);
  await addRule(id, text, embedding);
  res.status(200).json({ message: "Rule added!" });
};

exports.generateReply = async (req, res) => {
  const { subject, body, email } = req.body;

  const fullEmail = email || `${subject}\n${body}`; // fallback if `email` not provided
  const emailEmbedding = await getEmbedding(fullEmail);
  const rules = await searchRelevantRules(emailEmbedding);

  const prompt = `
You are an AI assistant helping reply to job-related emails.

Use the following rules to guide your reply:
${rules.join("\n")}

Keep the reply short, polite, and professional.
Include the following booking link exactly: https://cal.com/example
Do NOT add any extra salutations or signatures.

Email received:
"${email}"

Reply concisely:
`;

  const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await chatModel.generateContent(prompt);
  const reply = result.response.text();

  res.status(200).json({ reply });
};
