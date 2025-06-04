const client = require("./elasticSearch");

async function createIndex() {
  try {
    const { body: exists } = await client.indices.exists({ index: "raw_emails" });

    if (!exists) {
      await client.indices.create({
        index: "raw_emails",
        body: {
          mappings: {
            properties: {
              from: { type: "text" },
              to: { type: "text" },
              subject: { type: "text" },
              date: { type: "date" },
              body: { type: "text" },
              folder: { type: "keyword" },
              account: { type: "keyword" },
              category: { type: "keyword" },
              messageId: { type: "keyword" },
            },
          },
        },
      });
      console.log(`✅ Index 'raw_emails' created successfully.`);
    } else {
      console.log("ℹ️ Index already exists.");
    }
  } catch (err) {
    console.error("❌ Error creating index:", err);
  }
}

createIndex();
