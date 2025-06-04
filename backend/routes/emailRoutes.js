const express = require('express');
const router = express.Router();
const { getEmails, sendReply, saveRule, generateReply } = require('../controllers/emailController');

router.get('/emails', getEmails); // e.g., /api/emails?search=test&category=work
router.post('/send-reply', sendReply);
router.post('/save-rule', saveRule);
router.post('/generate-reply', generateReply);

module.exports = router;
