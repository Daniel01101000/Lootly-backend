const BaseScraper = require('../shared/base.scraper');
const { buildSearchUrl, parseSearchResults } = require('./zegucom.parser');
const { normalizeProduct } = require('../shared/productNormalizer');

const PRODUCT_CATEGORIES = [
  { category: 'gpu', queries: ['rtx 5090', 'rtx 5080', 'rtx 5070', 'rtx 4090', 'rtx 4080', 'rtx 4070', 'rtx 4060', 'radeon rx', 'tarjeta grafica', 'gpu'] },
  { category: 'cpu', queries: ['ryzen 7', 'ryzen 9', 'ryzen 5', 'intel core i7', 'intel core i5', 'intel core i9', 'procesador amd', 'procesador intel'] },
  { category: 'monitor', queries: ['monitor gamer', 'monitor 144hz', 'monitor 240hz', 'pantalla gaming'] },
  { category: 'keyboard', queries: ['teclado mecanico', 'teclado gamer', 'keyboard rgb'] },
  { category: 'mouse', queries: ['mouse gamer', 'raton gaming', 'mouse inalambrico'] },
  { category: 'laptop', queries: ['laptop gamer', 'notebook gaming', 'laptop rtx'] },
  { category: 'console', queries: ['playstation 5', 'xbox series', 'nintendo switch', 'consola'] },
  { category: 'component', queries: ['ssd nvme', 'memoria ram ddr5', 'memoria ram ddr4', 'fuente poder', 'motherboard', 'tarjeta madre', 'gabinete pc', 'refrigeracion cpu'] },
];

class ZegucomScraper extends BaseScraper {
  constructor() {
    super('Zegucom', 'https://zegucom.com.mx');
    this.maxProductsPerCategory = 10;
  }

  async searchProducts({ category, query } = {}) {
    if (query) {
      const url = buildSearchUrl(query);
      const html = await this.fetchPage(url);
      if (!html) return [];
      const raw = parseSearchResults(html);
      return raw.map((p) => normalizeProduct({ ...p, category: category || 'component' }, 'Zegucom')).filter(Boolean);
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
          const normalized = normalizeProduct({ ...item, category: catConfig.category }, 'Zegucom');
          if (normalized) products.push(normalized);
        }
      } catch (err) {
        console.error(`[ZegucomScraper] Error searching "${query}": ${err.message}`);
      }
    }
    console.log(`[ZegucomScraper] Found ${products.length} products for category "${catConfig.category}"`);
    return products;
  }
}

module.exports = ZegucomScraper;
