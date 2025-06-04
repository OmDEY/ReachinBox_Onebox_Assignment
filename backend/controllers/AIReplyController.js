const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateReply = async (req, res) => {
  const { subject, body } = req.body;

  if (!subject || !body) {
    return res.status(400).json({ error: 'Missing email subject or body' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      I received an email with the subject: "${subject}" and the body: "${body}".
      Generate exactly 3 professional, concise, and polite replies I could send in response.
      Label them as 1., 2., and 3. for easy parsing.
    `.trim();

    const result = await model.generateContent(prompt);

    const text =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean and split the Gemini response
    const suggestions = text
      .split(/\n?\s*\d\.\s+/) // Split by 1. 2. 3.
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim());

    // Edge case: if model returns raw text without numbering
    if (suggestions.length < 3) {
      return res.status(502).json({
        error: 'AI returned an unexpected format. Please try again.',
        raw: text,
      });
    }

    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions.map((reply, index) => ({
        id: index + 1,
        reply,
      })),
    });
  } catch (error) {
    console.error('💥 Gemini API Error:', error?.message || error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI replies',
    });
  }
};

module.exports = { generateReply };
