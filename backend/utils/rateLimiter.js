const Bottleneck = require('bottleneck');

// Create a limiter for Gemini API with rate limiting
const geminiLimiter = new Bottleneck({
  maxConcurrent: 1, // Only one request at a time
  minTime: 1000,    // Minimum 1 second between requests
  strategy: Bottleneck.strategy.LEAK, // Smooth out requests
  reservoir: 100,   // Maximum burst size
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60000 // Refresh reservoir every minute
});

/**
 * Rate-limited wrapper for Gemini API calls
 * @param {Function} apiCall - The API call function
 * @param {...any} args - Arguments for the API call
 * @returns {Promise<any>}
 */
async function rateLimitedGeminiCall(apiCall, ...args) {
  try {
    return await geminiLimiter.schedule(() => apiCall(...args));
  } catch (error) {
    if (error.message.includes('Too Many Requests')) {
      console.warn('⚠️  Gemini API rate limit hit. Waiting for 1 minute...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await rateLimitedGeminiCall(apiCall, ...args);
    }
    throw error;
  }
}

/**
 * Process emails sequentially per account
 * @param {Array} emails - Emails to process
 * @param {Function} processor - Email processing function
 * @returns {Promise<void>}
 */
async function processEmailsSequentially(emails, processor) {
  for (const email of emails) {
    try {
      await processor(email);
      // Small delay between emails to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error processing email:`, error);
      // Continue with next email even if one fails
    }
  }
}

/**
 * Process accounts sequentially
 * @param {Array} accounts - List of accounts
 * @param {Function} accountProcessor - Account processing function
 * @returns {Promise<void>}
 */
async function processAccountsSequentially(accounts, accountProcessor) {
  for (const account of accounts) {
    try {
      console.log(`🔄 Processing account: ${account.user}`);
      await accountProcessor(account);
      // Wait 5 minutes between accounts to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 300000));
    } catch (error) {
      console.error(`❌ Error processing account ${account.user}:`, error);
      // Continue with next account even if one fails
    }
  }
}

module.exports = {
  rateLimitedGeminiCall,
  processEmailsSequentially,
  processAccountsSequentially
};
