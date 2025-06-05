Email Processing and Categorization System
This project automatically fetches emails via IMAP, categorizes them using AI (Gemini), stores them in Elasticsearch, organizes them into folders, and sends notifications.

Features
📧 IMAP email fetching with persistent sequence tracking

🤖 AI-powered categorization using Gemini API

🗄️ Elasticsearch storage for structured email data

📂 Automatic folder organization based on categories

🔔 Slack and webhook notifications

⏱️ Rate limiting and caching for API efficiency

🔍 Vector storage for reply rules (ChromaDB)

🌐 REST API for email management

![deepseek_mermaid_20250605_1605f0](https://github.com/user-attachments/assets/21e00c01-1044-4d03-b496-cd4840d8759e)

Components:
IMAP Handler: Manages connections and email fetching

Email Fetcher: Parses emails and saves to Elasticsearch

Gemini Client: Categorizes emails using AI (with caching)

IMAP Mover: Organizes emails into folders

Notification System: Sends Slack/webhook alerts

Vector Store: Manages reply rules embeddings (ChromaDB)

REST API: Provides access to processed emails

Setup Instructions
Prerequisites
Node.js v16+

Elasticsearch/OpenSearch instance

ChromaDB instance

IMAP-enabled email account

Google Gemini API key

1. Install dependencies
   npm install
2. Configure environment variables
   Create .env file:

   # Email Configuration
EMAIL_1_HOST=your-imap-server.com
EMAIL_1_PORT=993
EMAIL_1_USER=your@email.com
EMAIL_1_PASS=your-password

# Elasticsearch
ES_URL=http://localhost:9200

# Gemini
GEMINI_API_KEY=your-gemini-key

# Notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
WEBHOOK_SITE_URL=https://your-webhook-url

# ChromaDB
CHROMA_URL=http://localhost:8000

# Server
PORT=5000

3. Initialize Elasticsearch index
   node createIndex.js

4. Start services
   # Start email processing
node imapHandler.js

# Start REST API server
node index.js

5. Verify operation
Check API status:

curl http://localhost:5000/api/ping

Configuration Files
config/emailAccounts.js

module.exports = [
  {
    id: "account1",
    user: process.env.EMAIL_1_USER,
    password: process.env.EMAIL_1_PASS,
    host: process.env.EMAIL_1_HOST,
    port: parseInt(process.env.EMAIL_1_PORT || "993"),
    tls: true,
    enabled: true
  }
];

API Endpoints
GET /api/ping: Service health check

GET /api/emails: Retrieve processed emails

POST /api/ai-reply: Generate AI-powered email replies

Key Implementation Details
Email Processing Flow:
IMAP connection established

New emails fetched since last processed sequence

Emails parsed and stored in Elasticsearch

Gemini API categorizes email content

Email moved to categorized folder (e.g., "Interested")

Notifications sent via Slack/webhook

Process metadata persisted in lastSeqMap.json

Gemini Categorization:
Uses gemini-1.5-flash model

Prompt: "Categorize into: Interested, Meeting Booked, Not Interested, Spam, Out of Office"

Responses cached locally for 1 hour

Rate limited (10 requests/minute)

Elasticsearch Schema:

{
  from: { type: "text" },
  to: { type: "text" },
  subject: { type: "text" },
  date: { type: "date" },
  body: { type: "text" },
  folder: { type: "keyword" },
  account: { type: "keyword" },
  category: { type: "keyword" },
  messageId: { type: "keyword" }
}

Rate Limiting
Gemini API: 10 requests/minute

IMAP operations: Sequential processing with 2s delays

Account processing: 5 minutes between accounts

Monitoring
Process logs: processedEmails.log

Last sequence tracking: lastSeqMap.json

Gemini cache: ./cache/*.json

Environment Variables
Variable	Required	Description
EMAIL_1_*	Yes	IMAP credentials
ES_URL	Yes	Elasticsearch URL
GEMINI_API_KEY	Yes	Gemini API key
SLACK_WEBHOOK_URL	No	Slack integration URL
WEBHOOK_SITE_URL	No	Generic webhook URL
CHROMA_URL	No	ChromaDB instance URL
PORT	No	API server port (default: 5000)
Troubleshooting
IMAP connection issues:

Verify credentials and server settings

Check firewall/port access (typically port 993)

Elasticsearch errors:

Ensure cluster is running and accessible

Verify index exists (raw_emails)

Gemini API failures:

Check rate limits (60 requests/minute)

Verify API key permissions

Folder creation issues:

Ensure IMAP account has create folder permissions

Check server-specific naming restrictions
