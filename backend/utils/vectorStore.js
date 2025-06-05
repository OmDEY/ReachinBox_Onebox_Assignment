const { ChromaClient } = require("chromadb");
require("dotenv").config();
console.log("process.env.CHROMA_URL >>> ", process.env.CHROMA_URL)
const client = new ChromaClient({
  baseUrl: process.env.CHROMA_URL || "http://localhost:8000",
});
// const client = new ChromaClient({
//   baseUrl: "http://localhost:8000",
// });

let collection = null;

async function initVectorDB() {
  try {
    collection = await client.getOrCreateCollection({ name: "reply-rules" });
  } catch (err) {
    console.error("Chroma init error:", err);
  }
}

async function addRule(id, text, embedding) {
  await collection.add({
    ids: [id],
    embeddings: [embedding.values],
    documents: [text],
    metadatas: [{ type: "rule" }],
  });
}

async function searchRelevantRules(embedding, topK = 3) {
  const rawEmbedding = embedding.values ? embedding.values : embedding;
  const results = await collection.query({
    queryEmbeddings: [rawEmbedding],
    nResults: topK,
  });
  return results.documents[0];
}

module.exports = {
  initVectorDB,
  addRule,
  searchRelevantRules,
};
