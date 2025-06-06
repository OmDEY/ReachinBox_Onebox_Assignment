const Rule = require("../models/Rule");
const cosineSimilarity = require("./cosineSim"); // We'll define this

async function initVectorDB() {
  // Mongo doesn't need init, but keep for consistency
  console.log("MongoDB Vector DB initialized.");
}

async function addRule(id, text, embedding) {
  await Rule.findOneAndUpdate(
    { id },
    { id, text, embedding: embedding.values },
    { upsert: true }
  );
}

async function searchRelevantRules(embedding, topK = 3) {
  const rules = await Rule.find();
  const inputVector = embedding.values;

  const scored = rules
    .map(rule => ({
      rule: rule.text,
      score: cosineSimilarity(inputVector, rule.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(s => s.rule);
}

module.exports = {
  initVectorDB,
  addRule,
  searchRelevantRules,
};
