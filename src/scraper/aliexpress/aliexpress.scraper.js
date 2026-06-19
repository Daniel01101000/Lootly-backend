const BaseScraper = require('../shared/base.scraper');
const { buildSearchUrl, parseSearchResults, PRODUCT_CATEGORIES } = require('./aliexpress.parser');
const { normalizeProduct } = require('../shared/productNormalizer');
const { withRetry } = require('../utils/retryHandler');

class AliExpressScraper extends BaseScraper {
  constructor() {
    super('AliExpress', 'https://www.aliexpress.com');
    this.maxProductsPerCategory = 6;
    this._browser = null;
  }

  async searchProducts({ category, query } = {}) {
    const allProducts = [];

    if (query) {
      const products = await this._searchPlaywright(query, category || 'games');
      allProducts.push(...products);
      return allProducts;
    }

    if (category) {
      const catConfig = PRODUCT_CATEGORIES.find((c) => c.category === category);
      if (!catConfig) return [];
      const products = await this._searchCategory(catConfig);
      allProducts.push(...products);
      return allProducts;
    }

    for (const catConfig of PRODUCT_CATEGORIES) {
      const products = await this._searchCategory(catConfig);
      allProducts.push(...products);
    }

    return allProducts;
  }

  async _searchCategory(catConfig) {
    const products = [];

    for (const query of catConfig.queries) {
      if (products.length >= this.maxProductsPerCategory) break;
      try {
        const results = await this._searchPlaywright(query, catConfig.category);
        products.push(...results);
      } catch (err) {
        console.error(`[AliExpressScraper] Error searching "${query}": ${err.message}`);
      }
    }

    console.log(`[AliExpressScraper] Found ${products.length} products for category "${catConfig.category}"`);
    return products;
  }

  async _ensureBrowser() {
    if (!this._browser || !this._browser.isConnected()) {
      const { chromium } = require('playwright');
      this._browser = await withRetry(async () => {
        return await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security'],
        });
      }, 'AliExpress Playwright launch');
    }
    return this._browser;
  }

  async _searchPlaywright(query, category) {
    const browser = await this._ensureBrowser();
    let context = null;

    try {
      const url = buildSearchUrl(query);
      console.log(`[AliExpressScraper] Loading with Playwright: ${url}`);

      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'es-MX',
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(5000);

      // Scroll to trigger lazy loading
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(1000);
      }
      await page.waitForTimeout(3000);

      const bodyText = await page.evaluate(() => document.body.innerText);

      if (bodyText.includes('captcha') || bodyText.includes('unusual traffic') || bodyText.includes('slide to verify')) {
        console.warn(`[AliExpressScraper] CAPTCHA blocked for "${query}"`);
        if (context) await context.close();
        return [];
      }

      const extracted = await page.evaluate(() => {
        const items = document.querySelectorAll(
          'a[href*="/item/"], [class*="product"], [class*="Product"], [class*="card"], [class*="Card"], [class*="item"], [class*="Item"]'
        );
        const results = [];
        const seen = new Set();

        for (const item of items) {
          try {
            const name = item.getAttribute('title') ||
              item.querySelector('img')?.getAttribute('alt') ||
              item.textContent?.trim();
            if (!name || name.length < 10 || seen.has(name)) continue;
            seen.add(name);

            const link = item.getAttribute('href') || '';
            if (!link || !link.includes('/item/')) continue;

            const fullUrl = link.startsWith('http') ? link : 'https://www.aliexpress.com' + link;

            const img = item.querySelector('img');
            const imageUrl = img?.getAttribute('src') || img?.getAttribute('data-src') || null;

            const text = item.textContent;
            const priceMatch = text.match(/(?:US\s*\$|MX\s*\$|\$)\s*([\d,]+\.?\d*)/i);
            let currentPrice = null;
            if (priceMatch) {
              currentPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            }

            if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) return;

            const originalMatch = text.match(/(?:US\s*\$|MX\s*\$|\$)\s*([\d,]+\.?\d*)\s*[-–]\s*(?:US\s*\$|MX\s*\$|\$)\s*([\d,]+\.?\d*)/i);
            let originalPrice = null;
            if (originalMatch) {
              originalPrice = parseFloat(originalMatch[1].replace(/,/g, ''));
            }

            results.push({
              name: name.substring(0, 200),
              currentPrice,
              originalPrice: (originalPrice && originalPrice > currentPrice) ? originalPrice : undefined,
              imageUrl,
              url: fullUrl,
              store: 'AliExpress',
            });
          } catch (e) {
            // skip
          }
        }
        return results;
      });

      console.log(`[AliExpressScraper] Playwright extracted ${extracted.length} raw items`);
      if (context) await context.close();

      return extracted
        .map((p) => normalizeProduct({ ...p, category }, 'AliExpress'))
        .filter(Boolean);
    } catch (err) {
      console.error(`[AliExpressScraper] Playwright search failed for "${query}": ${err.message}`);
      if (context) try { await context.close(); } catch (_) {}
      return [];
    }
  }
}

module.exports = AliExpressScraper;
