const { simpleParser } = require("mailparser");
const client = require("./elasticSearch");
const categorizeEmail = require("./gemniClient");
const { moveToFolder } = require("./utils/imapMover");
const sendSlackNotification = require("./utils/slackNotifier");
const triggerWebhook = require("./utils/webhookNotifier");

/**
 * Save raw email to Elasticsearch
 * @param {Object} parsed - Parsed email object
 * @param {Object} metadata - Includes account info and sequence number
 */
async function saveRawEmail(parsed, metadata) {
  const { accountId, accountEmail, seqno } = metadata;

  if (!accountId || !accountEmail) {
    throw new Error("Missing account information in metadata");
  }

  const rawEmailData = {
    messageId: parsed.messageId || "",
    seqno,
    accountId,
    accountEmail,
    account: accountEmail, // ✅ ADDED
    folder: parsed.folder || "inbox", // ✅ ADDED — fallback default
    category: parsed.category || "uncategorized", // ✅ ADDED — fallback default
    from: parsed.from?.text || "",
    to: parsed.to?.text || "",
    cc: parsed.cc?.text || "",
    bcc: parsed.bcc?.text || "",
    subject: parsed.subject || "(No Subject)",
    date: parsed.date || new Date(),
    body: parsed.text || "",
    html: parsed.html || "",
    attachments:
      parsed.attachments?.map((att) => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
      })) || [],
    fetchedAt: new Date(),
    processed: false,
  };

  try {
    const result = await client.index({
      index: "raw_emails",
      body: rawEmailData,
    });

    const docId = result.body?._id;

    if (!docId) {
      throw new Error("Failed to retrieve document ID after indexing");
    }

    console.log(`[${accountId}] ✅ Email saved to Elasticsearch`);
    // 🚀 Trigger post-processing
    await processEmailPostSave(rawEmailData, docId);
  } catch (error) {
    console.error(`[${accountId}] ❌ Failed to save email:`, error.message);
    throw error;
  }
}

async function processEmailPostSave(email, docId) {
  try {
    const text = [email.subject, email.body].filter(Boolean).join("\n");
    const category = await categorizeEmail(text);
    const cleanedCategory = category.trim().toLowerCase();

    // 1. Update ES with category
    await client.update({
      index: "raw_emails",
      id: docId,
      body: {
        doc: {
          category: cleanedCategory,
          processed: true,
          processedAt: new Date(),
        },
      },
    });

    // 2. Move email in mailbox
    const folder = cleanedCategory.replace(/\s+/g, "");
    await moveToFolder({
      seqno: email.seqno,
      fromFolder: "INBOX",
      toFolder: folder,
      accountId: email.accountId,
      account: {
        user: email.accountEmail,
        password: process.env.EMAIL_1_PASS,
        host: process.env.EMAIL_1_HOST,
        port: parseInt(process.env.EMAIL_1_PORT || "993"),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      },
    });
    console.log("going to send slack notification");
    // 3. Send notifications
    const payload = { ...email, category: cleanedCategory };
    if (process.env.SLACK_WEBHOOK_URL) {
      await sendSlackNotification(payload);
    }

    console.log("going to send webhook notification");
    if (process.env.WEBHOOK_SITE_URL) {
      await triggerWebhook(payload);
    }

    console.log(
      `[${email.accountId}] ✅ Processed & labeled as: ${cleanedCategory}`
    );
  } catch (err) {
    console.error(
      `[${email.accountId}] ❌ Error post-processing email:`,
      err.message
    );
  }
}

/**
 * Parse stream and save email to Elasticsearch
 */
async function handleEmailStream(stream, metadata) {
  try {
    const parsed = await simpleParser(stream);
    metadata.messageId = parsed.messageId;
    await saveRawEmail(parsed, metadata);
  } catch (error) {
    console.error(
      `[${metadata.accountId}] ❌ Error parsing email:`,
      error.message
    );
  }
}

module.exports = {
  handleEmailStream,
};
