const BaseScraper = require('../shared/base.scraper');
const { buildSearchUrl, parseSearchResults } = require('./mercadolibre.parser');
const { normalizeProduct } = require('../shared/productNormalizer');
const { withRetry } = require('../utils/retryHandler');
const { randomDelay } = require('../utils/delay');

const PRODUCT_CATEGORIES = [
  { category: 'gpu', queries: ['tarjeta-grafica-rtx', 'tarjeta-grafica-amd'] },
  { category: 'cpu', queries: ['procesador-amd-ryzen', 'procesador-intel-core'] },
  { category: 'monitor', queries: ['monitor-gamer', 'pantalla-gamer'] },
  { category: 'keyboard', queries: ['teclado-mecanico-gamer', 'teclado-gaming-rgb'] },
  { category: 'mouse', queries: ['mouse-gamer', 'raton-gaming-inalambrico'] },
  { category: 'laptop', queries: ['laptop-gamer', 'notebook-gaming'] },
  { category: 'console', queries: ['playstation-5', 'xbox-series-x', 'nintendo-switch-oled'] },
  { category: 'games', queries: ['videojuegos-ps5', 'videojuegos-xbox'] },
  { category: 'headset', queries: ['audifonos-gamer-diadema', 'headset-gaming-rgb'] },
  { category: 'component', queries: ['ssd-nvme', 'memoria-ram-ddr5', 'motherboard-gamer'] },
];

const SECURITY_PAGE_KEYWORDS = ['seguridad', 'captcha', 'security', 'blocked', 'acceso denegado', 'automática'];
const MIN_SEARCH_INTERVAL_MS = 8000;

const PLACEHOLDER_IMAGES = [
  'http2.mlstatic.com/frontend-assets',
  'mlstatic.com/frontend-assets',
  'placeholder',
  'no-image',
  'logo',
];

const isValidImage = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return !PLACEHOLDER_IMAGES.some((p) => lower.includes(p)) && url.startsWith('http');
};

const isValidUrl = (url) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

class MercadoLibreScraper extends BaseScraper {
  constructor() {
    super('Mercado Libre', 'https://www.mercadolibre.com.mx');
    this.maxProductsPerCategory = 12;
    this._browser = null;
    this._lastSearchTime = 0;
    this._uaIndex = 0;
    this.storeHealth = {
      accessible: true,
      lastError: null,
      consecutiveErrors: 0,
      totalSearches: 0,
      successfulSearches: 0,
    };
  }

  getStoreHealth() {
    return { ...this.storeHealth, name: this.name };
  }

  async searchProducts({ category, query } = {}) {
    const allProducts = [];

    if (query) {
      const products = await this._searchWithPlaywright(query, category || 'games');
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
        await this._waitBetweenSearches();
        const results = await this._searchWithPlaywright(query, catConfig.category);
        products.push(...results);
      } catch (err) {
        console.error(`[MLScraper] Error searching "${query}": ${err.message}`);
      }
    }
    console.log(`[MLScraper] Category "${catConfig.category}": ${products.length} valid products (max ${this.maxProductsPerCategory})`);
    return products;
  }

  async _waitBetweenSearches() {
    const now = Date.now();
    const elapsed = now - this._lastSearchTime;
    if (this._lastSearchTime > 0 && elapsed < MIN_SEARCH_INTERVAL_MS) {
      const wait = MIN_SEARCH_INTERVAL_MS - elapsed + Math.floor(Math.random() * 5000);
      console.log(`[MLScraper] Waiting ${wait}ms before next search...`);
      await new Promise((r) => setTimeout(r, wait));
    }
    this._lastSearchTime = Date.now();
  }

  _nextUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
    ];
    const ua = agents[this._uaIndex % agents.length];
    this._uaIndex++;
    return ua;
  }

  _nextViewport() {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
    ];
    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  _isSecurityPage(pageTitle) {
    if (!pageTitle) return false;
    const lower = pageTitle.toLowerCase();
    return SECURITY_PAGE_KEYWORDS.some((k) => lower.includes(k));
  }

  async _ensureBrowser() {
    if (!this._browser || !this._browser.isConnected()) {
      const { chromium } = require('playwright');
      this._browser = await withRetry(async () => {
        return await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
      }, 'ML Playwright launch');
    }
    return this._browser;
  }

  async _searchWithPlaywright(query, category) {
    const browser = await this._ensureBrowser();
    let context = null;
    this.storeHealth.totalSearches++;

    try {
      const url = buildSearchUrl(query);
      console.log(`[MLScraper] Searching "${query}" (category: ${category})`);

      context = await browser.newContext({
        userAgent: this._nextUserAgent(),
        viewport: this._nextViewport(),
        locale: 'es-MX',
      });

      const page = await context.newPage();
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      if (!response || !response.ok()) {
        const status = response ? response.status() : 'no response';
        console.warn(`[MLScraper] Page returned ${status} for "${query}"`);
        if (status === 404 || status >= 500) {
          this.storeHealth.consecutiveErrors++;
          this.storeHealth.lastError = `HTTP ${status}`;
        }
        if (context) await context.close();
        return [];
      }

      await page.waitForTimeout(3000 + Math.random() * 2000);

      const pageTitle = await page.title().catch(() => 'unknown');
      console.log(`[MLScraper] Page title: "${pageTitle.substring(0, 80)}"`);

      if (this._isSecurityPage(pageTitle)) {
        console.warn(`[MLScraper] Security page detected for "${query}" - Mercado Libre is blocking automated access`);
        this.storeHealth.consecutiveErrors++;
        this.storeHealth.lastError = 'security page';
        if (context) await context.close();
        return [];
      }

      let hasCards = false;
      for (const sel of ['.poly-card', '.ui-search-layout__item', '[data-identifier]']) {
        try {
          const count = await page.locator(sel).count();
          if (count > 0) { hasCards = true; break; }
        } catch (_) {}
      }
      if (!hasCards) {
        const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 200) || '');
        console.warn(`[MLScraper] No product cards for "${query}". Body preview: "${bodyText?.substring(0, 100)}"`);
        this.storeHealth.consecutiveErrors++;
        this.storeHealth.lastError = 'no product cards found';
        if (context) await context.close();
        return [];
      }

      const extracted = await page.evaluate(() => {
        const selectors = [
          '.poly-card',
          '.ui-search-layout__item',
          '[data-identifier]',
          '.ui-search-result__item',
          'li[role="listitem"]',
        ];
        let items = [];
        for (const sel of selectors) {
          const found = document.querySelectorAll(sel);
          if (found.length > 0) {
            items = found;
            break;
          }
        }
        const results = [];

        for (const item of items) {
          try {
            const titleSelectors = [
              '.poly-component__title',
              'h2 a',
              'h2',
              '.ui-search-item__title',
              '[data-identifier] a',
              '.poly-box a',
            ];
            let name = null;
            for (const sel of titleSelectors) {
              const el = item.querySelector(sel);
              if (el?.textContent?.trim()) {
                name = el.textContent.trim();
                break;
              }
            }
            if (!name) return;

            const linkSelectors = [
              'a.poly-component__title',
              'a[href*="/p/MLM"]',
              'a[href*="/item/"]',
              'a.ui-search-item__group__element',
              'a[data-identifier]',
              'a.ui-search-link',
            ];
            let url = '';
            for (const sel of linkSelectors) {
              const el = item.querySelector(sel);
              if (el?.getAttribute('href')) {
                url = el.getAttribute('href');
                break;
              }
            }
            if (url && url.startsWith('/')) url = 'https://www.mercadolibre.com.mx' + url;

            const imgSelectors = [
              'img.poly-component__picture',
              'img.ui-search-result-image__element',
              'img[data-src]',
              'img[src]',
            ];
            let imageUrl = null;
            for (const sel of imgSelectors) {
              const el = item.querySelector(sel);
              if (el) {
                imageUrl = el.getAttribute('data-src') || el.getAttribute('src') || el.getAttribute('data-lazy-src') || el.getAttribute('data-original') || null;
                if (imageUrl) break;
              }
            }
            if (!imageUrl) {
              const allImgs = item.querySelectorAll('img');
              if (allImgs.length > 0) {
                const img = allImgs[0];
                imageUrl = img.getAttribute('data-src') || img.getAttribute('src') || null;
              }
            }
            if (imageUrl && imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;

            let currentPrice = null;
            const priceSelectors = [
              '.poly-price__current .andes-money-amount__fraction',
              '.andes-money-amount__fraction',
              '.ui-search-price__part--medium .andes-money-amount__fraction',
              '.ui-search-item__group--price .andes-money-amount__fraction',
              '[class*="price"] [class*="fraction"]',
            ];
            for (const sel of priceSelectors) {
              const el = item.querySelector(sel);
              if (el) {
                const priceText = el.textContent.trim().replace(/[^0-9]/g, '');
                if (priceText) {
                  currentPrice = parseFloat(priceText);
                  if (currentPrice > 0) break;
                }
              }
            }
            if (!currentPrice || currentPrice <= 0) {
              const allText = item.textContent;
              const priceMatch = allText.match(/\$[\s]*([\d,]+(?:\.\d{2})?)/);
              if (priceMatch) {
                currentPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
              }
            }
            if (!currentPrice || currentPrice <= 0) return;

            let originalPrice = null;
            const oldPriceSelectors = [
              '.poly-price__previous .andes-money-amount__fraction',
              's .andes-money-amount__fraction',
              '.andes-money-amount--previous .andes-money-amount__fraction',
              '.ui-search-price__part--disabled .andes-money-amount__fraction',
              '[class*="previous"] [class*="fraction"]',
            ];
            for (const sel of oldPriceSelectors) {
              const el = item.querySelector(sel);
              if (el) {
                const oldText = el.textContent.trim().replace(/[^0-9]/g, '');
                if (oldText) {
                  originalPrice = parseFloat(oldText);
                  break;
                }
              }
            }

            const discountEl = item.querySelector('.poly-component__discount, .andes-money-amount__discount, [class*="discount"]');
            const discountText = discountEl?.textContent?.trim() || '';

            results.push({
              name,
              currentPrice,
              originalPrice: (originalPrice && originalPrice > currentPrice) ? originalPrice : undefined,
              imageUrl,
              url,
              discount: discountText,
            });
          } catch (e) {
            // skip item on error
          }
        }
        return results;
      });

      if (extracted.length === 0) {
        console.warn(`[MLScraper] No items extracted for "${query}" - possible layout change or blocking`);
        this.storeHealth.consecutiveErrors++;
        this.storeHealth.lastError = 'zero items extracted';
        if (context) await context.close();
        return [];
      }

      this.storeHealth.consecutiveErrors = 0;
      this.storeHealth.successfulSearches++;

      const validProducts = [];
      const diagnostics = { total: extracted.length, valid: 0, invalid: { noName: 0, noPrice: 0, noImage: 0, noUrl: 0 } };

      for (const p of extracted) {
        if (!isValidUrl(p.url)) { diagnostics.invalid.noUrl++; continue; }
        if (!isValidImage(p.imageUrl)) { diagnostics.invalid.noImage++; continue; }
        if (!p.currentPrice || p.currentPrice <= 0) { diagnostics.invalid.noPrice++; continue; }
        if (!p.name) { diagnostics.invalid.noName++; continue; }
        diagnostics.valid++;

        const normalized = normalizeProduct({ ...p, category }, 'Mercado Libre');
        if (normalized) validProducts.push(normalized);
      }

      console.log(`[MLScraper] "${query}": ${diagnostics.total} extracted, ${diagnostics.valid} passed validation, ${validProducts.length} normalized`);
      if (diagnostics.invalid.noUrl > 0) console.warn(`[MLScraper]   ${diagnostics.invalid.noUrl} items skipped: invalid URL`);
      if (diagnostics.invalid.noImage > 0) console.warn(`[MLScraper]   ${diagnostics.invalid.noImage} items skipped: placeholder/missing image`);
      if (diagnostics.invalid.noPrice > 0) console.warn(`[MLScraper]   ${diagnostics.invalid.noPrice} items skipped: invalid price`);

      if (context) await context.close();
      return validProducts;
    } catch (err) {
      const errorMsg = err.message?.substring(0, 120) || 'unknown error';
      console.error(`[MLScraper] Search failed for "${query}": ${errorMsg}`);
      this.storeHealth.consecutiveErrors++;
      this.storeHealth.lastError = errorMsg;
      if (err.message?.includes('net::')) {
        console.warn(`[MLScraper] Network error - Mercado Libre may be blocking or unreachable`);
        this.storeHealth.accessible = false;
      }
      if (context) try { await context.close(); } catch (_) {}
      return [];
    }
  }
}

module.exports = MercadoLibreScraper;
