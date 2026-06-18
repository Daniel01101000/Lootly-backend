const { randomDelay } = require('./delay');

const MAX_RETRIES = 3;
const BASE_DELAY = 3000;

const withRetry = async (fn, context = 'operation', retries = MAX_RETRIES) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Scraper] ${context} — Attempt ${attempt}/${retries}`);
      return await fn();
    } catch (err) {
      lastError = err;
      console.error(`[Scraper] ${context} — Attempt ${attempt} failed: ${err.message}`);

      if (err.response && err.response.status === 429) {
        const retryAfter = parseInt(err.response.headers['retry-after'], 10) * 1000 || 10000;
        console.log(`[Scraper] Rate limited (429). Waiting ${retryAfter}ms...`);
        await new Promise((r) => setTimeout(r, retryAfter));
      } else if (err.response && err.response.status >= 500) {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`[Scraper] Server error (${err.response.status}). Backing off ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1);
        console.log(`[Scraper] Network error (${err.code}). Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        if (attempt < retries) await randomDelay();
      }
    }
  }

  throw new Error(`${context} — All ${retries} attempts failed. Last error: ${lastError.message}`);
};

module.exports = { withRetry, MAX_RETRIES };
