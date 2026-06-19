const axios = require('axios');
const { getRandomUserAgent } = require('../utils/userAgents');
const { withRetry } = require('../utils/retryHandler');
const { waitForSlot } = require('../utils/rateLimiter');
const { randomDelay } = require('../utils/delay');

class BaseScraper {
  constructor(name, baseUrl) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.domain = new URL(baseUrl).hostname;
    this.timeout = 15000;
  }

  _getHeaders() {
    return {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-MX,es-419;q=0.9,es;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': this.baseUrl,
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
    };
  }

  async fetchPage(url) {
    return withRetry(async () => {
      await waitForSlot(this.domain);
      await randomDelay(1500, 3500);

      console.log(`[${this.name}] Fetching: ${url}`);

      const response = await axios.get(url, {
        headers: this._getHeaders(),
        timeout: this.timeout,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 429) {
        const error = new Error(`HTTP 429 Too Many Requests`);
        error.response = { status: 429, headers: response.headers };
        throw error;
      }

      if (response.status === 404) {
        console.warn(`[${this.name}] Page not found: ${url}`);
        return null;
      }

      if (response.status !== 200) {
        console.warn(`[${this.name}] Unexpected status ${response.status} for: ${url}`);
      }

      return response.data;
    }, `fetchPage: ${this.name} - ${url}`);
  }

  async searchProducts(query) {
    throw new Error(`${this.name} must implement searchProducts()`);
  }

  parseProductList(html) {
    throw new Error(`${this.name} must implement parseProductList()`);
  }
}

module.exports = BaseScraper;
