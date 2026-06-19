const BaseScraper = require('../shared/base.scraper');
const { buildSearchUrl, parseSearchResults } = require('./bestbuy.parser');
const { normalizeProduct } = require('../shared/productNormalizer');

const PRODUCT_CATEGORIES = [
  { category: 'gpu', queries: ['RTX 5090', 'RTX 5080', 'RTX 5070', 'RTX 4090', 'RTX 4080', 'RTX 4070', 'RTX 4060', 'Radeon RX 7900', 'graphics card', 'GPU'] },
  { category: 'cpu', queries: ['Ryzen 7', 'Ryzen 9', 'Ryzen 5', 'Intel Core i7', 'Intel Core i5', 'Intel Core i9', 'AMD Ryzen', 'Intel processor'] },
  { category: 'monitor', queries: ['gaming monitor', '144hz monitor', '240hz monitor', '4K gaming monitor'] },
  { category: 'keyboard', queries: ['mechanical keyboard', 'gaming keyboard', 'RGB keyboard'] },
  { category: 'mouse', queries: ['gaming mouse', 'wireless gaming mouse', 'gaming mouse pad'] },
  { category: 'laptop', queries: ['gaming laptop', 'RTX gaming laptop', 'gaming notebook'] },
  { category: 'console', queries: ['PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'Steam Deck'] },
  { category: 'games', queries: ['PS5 game', 'Xbox game', 'Nintendo Switch game', 'PC video game'] },
  { category: 'component', queries: ['NVMe SSD', 'DDR5 RAM', 'DDR4 RAM', 'power supply', 'motherboard', 'CPU cooler'] },
];

class BestBuyScraper extends BaseScraper {
  constructor() {
    super('Best Buy', 'https://www.bestbuy.com');
    this.maxProductsPerCategory = 10;
  }

  async searchProducts({ category, query } = {}) {
    if (query) {
      const url = buildSearchUrl(query);
      const html = await this.fetchPage(url);
      if (!html) return [];
      const raw = parseSearchResults(html);
      return raw.map((p) => normalizeProduct({ ...p, category: category || 'component' }, 'Best Buy')).filter(Boolean);
    }

    if (category) {
      const catConfig = PRODUCT_CATEGORIES.find((c) => c.category === category);
      if (!catConfig) return [];
      return this._searchCategory(catConfig);
    }

    const allProducts = [];
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
        const url = buildSearchUrl(query);
        const html = await this.fetchPage(url);
        if (!html) continue;

        const raw = parseSearchResults(html);
        for (const item of raw) {
          if (products.length >= this.maxProductsPerCategory) break;
          const normalized = normalizeProduct({ ...item, category: catConfig.category }, 'Best Buy');
          if (normalized) products.push(normalized);
        }
      } catch (err) {
        console.error(`[BestBuyScraper] Error searching "${query}": ${err.message}`);
      }
    }
    console.log(`[BestBuyScraper] Found ${products.length} products for category "${catConfig.category}"`);
    return products;
  }
}

module.exports = BestBuyScraper;
