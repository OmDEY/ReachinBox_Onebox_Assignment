require("dotenv").config();
const Imap = require("imap");
const { handleEmailStream } = require("./emailFetcher");
const emailAccounts = require("./config/emailAccounts");
const client = require("./elasticSearch");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");

const SEQ_PATH = path.join(__dirname, "lastSeqMap.json");
const PROCESSED_EMAILS_LOG = path.join(__dirname, "processedEmails.log");

// Improved logging function
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(PROCESSED_EMAILS_LOG, logMessage);
  console.log(message);
}

function saveLastSeq(accountId, seqno) {
  let data = {};
  try {
    if (fs.existsSync(SEQ_PATH)) {
      data = JSON.parse(fs.readFileSync(SEQ_PATH));
    }
  } catch (err) {
    logToFile(`❌ Error reading lastSeqMap: ${err.message}`);
  }
  data[accountId] = seqno;
  fs.writeFileSync(SEQ_PATH, JSON.stringify(data, null, 2));
}

function loadLastSeq(accountId) {
  try {
    if (fs.existsSync(SEQ_PATH)) {
      const data = JSON.parse(fs.readFileSync(SEQ_PATH));
      return data[accountId] || 0;
    }
  } catch (err) {
    logToFile(`❌ Error loading lastSeqMap: ${err.message}`);
  }
  return 0;
}

const connections = new Map();

function createImapConnection(account) {
  return new Imap({
    user: account.user,
    password: account.password,
    host: account.host,
    port: account.port,
    tls: account.tls,
    tlsOptions: { ...account.tlsOptions, rejectUnauthorized: false },
    keepalive: true,
    keepaliveInterval: 30000,
    keepaliveCountMax: 3,
  });
}

async function isEmailAlreadyProcessed(accountId, messageId) {
  if (!messageId) return false;
  try {
    const { body } = await client.search({
      index: "raw_emails",
      size: 1,
      body: {
        query: {
          bool: {
            must: [
              { term: { accountId: accountId } },
              { term: { messageId: messageId } },
            ],
          },
        },
      },
    });

    const totalHits =
      typeof body.hits.total === "object"
        ? body.hits.total.value
        : body.hits.total;

    return totalHits > 0;
  } catch (err) {
    logToFile(`[${accountId}] ❌ ES check error: ${err.message}`);
    return false;
  }
}

async function fetchRecentEmails(account) {
  const { imap, state } = connections.get(account.id);
  const since = new Date();
  since.setDate(since.getDate() - 1);

  try {
    // Open the mailbox first
    await new Promise((resolve, reject) => {
      imap.openBox("INBOX", false, (err) => {
        if (err) {
          logToFile(`[${account.id}] ❌ Inbox open error: ${err.message}`);
          reject(err);
          return;
        }
        resolve();
      });
    });

    // Get the total message count from the open box
    const box = imap._box;

    const totalMessages = box.messages.total || 0;
    logToFile(`[${account.id}] ℹ️ Total messages in INBOX: ${totalMessages}`);
    logToFile(`[${account.id}] ℹ️ Last processed seqno: ${state.lastSeq}`);

    // Search for recent messages
    const results = await new Promise((resolve, reject) => {
      imap.search([["SINCE", since]], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results || []);
        }
      });
    });

    const sorted = results.sort((a, b) => a - b);
    const totalEmails = sorted.length;

    logToFile(
      `[${
        account.id
      }] 📩 Found ${totalEmails} emails since ${since.toISOString()}`
    );

    if (totalEmails === 0) {
      logToFile(`[${account.id}] 📭 No new emails to process`);
      return;
    }

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const seqno of sorted) {
      if (seqno <= state.lastSeq) {
        logToFile(
          `[${account.id}] ⏭ Skipping already processed seqno: ${seqno}`
        );
        skipped++;
        continue;
      }

      try {
        logToFile(
          `[${account.id}] 🚀 Processing seqno: ${seqno} (${
            processed + skipped + failed + 1
          }/${totalEmails})`
        );

        const parsed = await new Promise((resolve, reject) => {
          const f = imap.fetch(seqno, { bodies: "" });
          let emailData = null;

          f.on("message", (msg) => {
            msg.on("body", async (stream) => {
              try {
                emailData = await simpleParser(stream);
                resolve(emailData);
              } catch (err) {
                reject(err);
              }
            });
          });

          f.on("error", (err) => {
            reject(err);
          });
        });

        const messageId = parsed.messageId;
        const alreadyProcessed = await isEmailAlreadyProcessed(
          account.id,
          messageId
        );

        if (alreadyProcessed) {
          logToFile(
            `[${account.id}] ⏭ Skipped duplicate messageId: ${messageId}`
          );
          skipped++;
          continue;
        }

        // Recreate the stream for processing
        const f = imap.fetch(seqno, { bodies: "" });
        await new Promise((resolve) => {
          f.on("message", (msg) => {
            msg.on("body", async (stream) => {
              try {
                await handleEmailStream(stream, {
                  seqno,
                  accountId: account.id,
                  accountEmail: account.user,
                  messageId,
                });

                logToFile(
                  `[${account.id}] ✅ Processed seqno: ${seqno} (Message ID: ${messageId})`
                );
                state.lastSeq = seqno;
                saveLastSeq(account.id, seqno);
                processed++;
              } catch (err) {
                logToFile(
                  `[${account.id}] ❌ Processing error seqno ${seqno}: ${err.message}`
                );
                failed++;
              } finally {
                resolve();
              }
            });
          });
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        logToFile(
          `[${account.id}] ❌ Fetch error seqno ${seqno}: ${err.message}`
        );
        failed++;
      }
    }

    logToFile(`[${account.id}] 📊 Summary:`);
    logToFile(`[${account.id}] Total emails found: ${totalEmails}`);
    logToFile(`[${account.id}] Successfully processed: ${processed}`);
    logToFile(`[${account.id}] Skipped (already processed): ${skipped}`);
    logToFile(`[${account.id}] Failed to process: ${failed}`);
    logToFile(`[${account.id}] Last processed seqno: ${state.lastSeq}`);
  } catch (err) {
    logToFile(`[${account.id}] ❌ Mailbox processing error: ${err.message}`);
  }
}

function connectAccount(account) {
  const imap = createImapConnection(account);
  const state = { lastSeq: loadLastSeq(account.id), isConnected: false };
  connections.set(account.id, { imap, state });

  imap.once("ready", () => {
    logToFile(`[${account.id}] 🟢 IMAP Connected`);
    state.isConnected = true;

    // Process existing emails
    fetchRecentEmails(account);

    imap.on("mail", (numNew) => {
      if (typeof numNew !== "number" || numNew <= 0) {
        logToFile(`[${account.id}] ❌ Invalid new mail count: ${numNew}`);
        return;
      }

      logToFile(`[${account.id}] 📬 New mail arrived: ${numNew} new messages`);

      // Process new emails
      fetchRecentEmails(account);
    });
  });

  imap.once("error", (err) => {
    logToFile(`[${account.id}] ❌ IMAP error: ${err.message}`);
    state.isConnected = false;
    setTimeout(() => connectAccount(account), 10000);
  });

  imap.once("end", () => {
    logToFile(`[${account.id}] 🔌 IMAP connection closed`);
    state.isConnected = false;
    setTimeout(() => connectAccount(account), 10000);
  });

  imap.connect();
}

function start() {
  const account = emailAccounts.find((a) => a.enabled);
  if (!account) {
    logToFile("❌ No account enabled in config");
    return;
  }

  logToFile(`🚀 Starting IMAP for: ${account.user}`);
  logToFile(`ℹ️ Account ID: ${account.id}`);

  // Initialize the processed emails log
  if (!fs.existsSync(PROCESSED_EMAILS_LOG)) {
    fs.writeFileSync(PROCESSED_EMAILS_LOG, "");
  }

  connectAccount(account);
}

start();
