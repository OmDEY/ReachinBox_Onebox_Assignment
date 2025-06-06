// models/Rule.js
const mongoose = require("mongoose");

const RuleSchema = new mongoose.Schema({
  id: String,
  text: String,
  embedding: [Number],
});

module.exports = mongoose.model("Rule", RuleSchema);
