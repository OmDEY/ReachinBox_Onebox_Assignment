const express = require('express');
const router = express.Router();
const { generateReply } = require('../controllers/AIReplyController');

router.post('/generate-reply', generateReply);

module.exports = router;