
# 📬 Email Processing & Categorization System

This project automatically **fetches emails**, categorizes them using **AI (Gemini)**, stores them in **Elasticsearch**, moves them into appropriate folders, and sends **notifications** via Slack or webhooks.

![System Architecture](https://github.com/user-attachments/assets/21e00c01-1044-4d03-b496-cd4840d8759e)

---

## 🔧 Features

- 📥 **IMAP email fetching** with persistent sequence tracking  
- 🧠 **AI-powered categorization** using Gemini API  
- 📦 **Elasticsearch** storage for structured email data  
- 🗂 **Auto folder organization** based on categories  
- 🔔 **Slack & webhook notifications**  
- 🚦 **Rate limiting & caching** for efficiency  
- 🧬 **Vector store** for AI reply rules using ChromaDB  
- 🌐 **REST API** to interact with processed email data  

---

## 🧱 Architecture Overview

- **IMAP Handler** → Connects and fetches emails  
- **Email Fetcher** → Parses and stores emails in ES  
- **Gemini Client** → Categorizes emails with AI  
- **IMAP Mover** → Sorts emails into labeled folders  
- **Notification Service** → Sends updates via Slack/webhook  
- **Vector Store** → Handles embeddings for reply rules  
- **REST API** → Serves data to frontend clients  

---

## ⚙️ Setup Instructions

### ✅ Prerequisites

- Node.js v16+
- Elasticsearch or OpenSearch instance
- ChromaDB instance
- IMAP-enabled email account
- Google Gemini API Key

### 📦 1. Install Dependencies

```bash
npm install
```

### 🔐 2. Create `.env` Configuration

```env
# Email Configuration
EMAIL_1_HOST=your-imap-server.com
EMAIL_1_PORT=993
EMAIL_1_USER=your@email.com
EMAIL_1_PASS=your-password

# Elasticsearch
ES_URL=http://localhost:9200

# Gemini
GEMINI_API_KEY=your-gemini-key

# Notifications (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
WEBHOOK_SITE_URL=https://your-webhook-url

# ChromaDB
CHROMA_URL=http://localhost:8000

# Server Port
PORT=5000
```

### 🧱 3. Initialize Elasticsearch Index

```bash
node createIndex.js
```

### 🚀 4. Start Services

```bash
# Start IMAP Email Processing
node imapHandler.js

# Start API Server
node index.js
```

### 🧪 5. Test API

```bash
curl http://localhost:5000/api/ping
```

---

## 📁 Configuration Example

`config/emailAccounts.js`:

```js
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
```

---

## 📡 API Endpoints

| Method | Endpoint            | Description                         |
|--------|---------------------|-------------------------------------|
| GET    | `/api/ping`         | Health check                        |
| GET    | `/api/emails`       | Fetch processed emails              |
| POST   | `/api/ai-reply`     | Generate AI-powered email replies   |

---

## 🔁 Email Processing Flow

1. IMAP connection established  
2. Emails fetched since the last sequence  
3. Emails parsed & indexed into Elasticsearch  
4. Gemini API assigns category  
5. Email moved to appropriate folder (e.g., `Interested`)  
6. Slack/Webhook notifications sent  
7. Metadata tracked in `lastSeqMap.json`

---

## 🧠 Gemini Categorization

- Uses `gemini-1.5-flash` model  
- Prompt:  
  ```
  Categorize into: Interested, Meeting Booked, Not Interested, Spam, Out of Office
  ```
- ⏳ Cached for 1 hour  
- 🚦 Rate-limited: 10 requests/minute

---

## 🗃 Elasticsearch Email Schema

```json
{
  "from": "text",
  "to": "text",
  "subject": "text",
  "date": "date",
  "body": "text",
  "folder": "keyword",
  "account": "keyword",
  "category": "keyword",
  "messageId": "keyword"
}
```

---

## ⏱ Rate Limiting & Scheduling

| Action              | Limit                  |
|---------------------|-------------------------|
| Gemini API          | 10 requests/min         |
| IMAP Email Fetching | 2s delay per sequence   |
| Per Account         | 5 minutes gap           |

---

## 📊 Monitoring & Logs

- `processedEmails.log` → Email processing logs  
- `lastSeqMap.json` → Tracks last email sequence  
- `./cache/*.json` → Gemini API response cache  

---

## 🌍 Environment Variables

| Variable             | Required | Description                          |
|----------------------|----------|--------------------------------------|
| `EMAIL_1_*`          | ✅       | IMAP credentials                     |
| `ES_URL`             | ✅       | Elasticsearch instance URL           |
| `GEMINI_API_KEY`     | ✅       | Gemini AI API key                    |
| `SLACK_WEBHOOK_URL`  | ❌       | Slack notification webhook           |
| `WEBHOOK_SITE_URL`   | ❌       | Webhook URL for alerts               |
| `CHROMA_URL`         | ❌       | ChromaDB instance URL                |
| `PORT`               | ❌       | API server port (default: 5000)      |

---

## 🧰 Troubleshooting

### IMAP Issues
- ✅ Validate email credentials
- 🔐 Ensure correct ports (993 for IMAP SSL)
- 🧱 Server must support folder creation

### Elasticsearch
- 🟢 Confirm it's running and accessible
- 🔍 Ensure `raw_emails` index exists

### Gemini API
- 🔑 Check API key and permissions
- 🚦 Watch rate limits (60/min per API key)
