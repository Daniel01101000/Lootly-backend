const BaseScraper = require('../shared/base.scraper');
const { buildSearchUrl, parseSearchResults } = require('./amazon.parser');
const { normalizeProduct } = require('../shared/productNormalizer');

const PRODUCT_CATEGORIES = [
  { category: 'gpu', queries: ['tarjeta+grafica+rtx', 'tarjeta+grafica+amd+radeon', 'gpu+gamer'] },
  { category: 'cpu', queries: ['procesador+amd+ryzen', 'procesador+intel+core', 'cpu+gamer'] },
  { category: 'monitor', queries: ['monitor+gamer', 'monitor+4k+gaming', 'pantalla+gamer'] },
  { category: 'keyboard', queries: ['teclado+mecanico+gamer', 'teclado+gaming+rgb'] },
  { category: 'mouse', queries: ['mouse+gamer', 'raton+gaming+inalambrico'] },
  { category: 'laptop', queries: ['laptop+gamer', 'notebook+gaming+rtx'] },
  { category: 'console', queries: ['playstation+5', 'xbox+series', 'nintendo+switch+oled', 'consola+videojuegos'] },
  { category: 'games', queries: ['videojuegos+ps5', 'videojuegos+xbox', 'videojuegos+nintendo+switch'] },
  { category: 'component', queries: ['ssd+nvme+gamer', 'memoria+ram+ddr5', 'fuente+poder+gamer', 'tarjeta+madre+gamer'] },
];

class AmazonScraper extends BaseScraper {
  constructor() {
    super('Amazon México', 'https://www.amazon.com.mx');
    this.maxProductsPerCategory = 6;
  }

  async searchProducts({ category, query } = {}) {
    if (query) {
      const url = buildSearchUrl(query);
      const html = await this.fetchPage(url);
      if (!html) return [];
      const raw = parseSearchResults(html);
      return raw.map((p) => normalizeProduct({ ...p, category: category || 'games' }, 'Amazon México')).filter(Boolean);
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
          const normalized = normalizeProduct({ ...item, category: catConfig.category }, 'Amazon México');
          if (normalized) products.push(normalized);
        }
      } catch (err) {
        console.error(`[AmazonScraper] Error searching "${query}": ${err.message}`);
      }
    }
    console.log(`[AmazonScraper] Found ${products.length} products for category "${catConfig.category}"`);
    return products;
  }
}

module.exports = AmazonScraper;
