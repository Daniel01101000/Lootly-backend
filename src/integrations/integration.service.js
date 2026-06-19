const productService = require('../services/product.service');
const cheapshark = require('./cheapshark');
const rawg = require('./rawg');
const config = require('../config');

const SEEN_URLS = new Set();

class IntegrationService {
  constructor() {
    this.stats = {
      totalFetched: 0,
      totalSaved: 0,
      totalUpdated: 0,
      totalErrors: 0,
      lastRun: null,
      lastRunDuration: null,
    };
  }

  async runAll() {
    const startTime = Date.now();
    console.log('[IntegrationService] Starting all API integrations...');

    SEEN_URLS.clear();
    let allProducts = [];
    let errors = 0;

    if (config.integrations?.cheapsharkEnabled !== false) {
      try {
        const rawDeals = await cheapshark.fetchDeals();
        let deals = cheapshark.mapDeals(rawDeals);

        if (config.integrations?.rawgEnabled && config.integrations?.rawgApiKey) {
          deals = await rawg.enrichDeals(deals);
        }

        console.log(`[CHEAPSHARK] Valid deals after mapping: ${deals.length}`);
        allProducts = allProducts.concat(deals);
      } catch (err) {
        errors++;
        console.error(`[IntegrationService] CheapShark error: ${err.message}`);
      }
    }

    if (config.integrations?.mercadolibreEnabled === true) {
      try {
        console.log('[MERCADOLIBRE] Running Puppeteer scraper for gaming deals...');
        const { scrapeAllDeals } = require('../scrapers/mercadolibre.scraper');
        const scrapedDeals = await scrapeAllDeals();
        console.log(`[MERCADOLIBRE] Scraper found ${scrapedDeals.length} valid deals`);
        const mappedDeals = scrapedDeals.map(d => ({
          name: d.name,
          imageUrl: d.image_url,
          currentPrice: d.current_price,
          originalPrice: d.original_price,
          store: d.store,
          category: d.category,
          url: d.url,
        }));
        allProducts = allProducts.concat(mappedDeals);
      } catch (err) {
        errors++;
        console.error(`[IntegrationService] MercadoLibre scraper error: ${err.message}`);
      }
    } else {
      console.log('[MERCADOLIBRE] Scraper disabled via config.');
    }

    console.log(`[IntegrationService] Total products to save: ${allProducts.length}`);

    const saved = await this._saveProducts(allProducts);

    this.stats.totalFetched += allProducts.length;
    this.stats.totalSaved += saved.created;
    this.stats.totalUpdated += saved.updated;
    this.stats.totalErrors += errors;
    this.stats.lastRun = new Date().toISOString();
    this.stats.lastRunDuration = Date.now() - startTime;

    console.log(
      `[IntegrationService] Complete. Created: ${saved.created}, Updated: ${saved.updated}, Errors: ${errors}, Duration: ${this.stats.lastRunDuration}ms`
    );

    return { products: allProducts, ...saved, errors, duration: this.stats.lastRunDuration };
  }

  async _saveProducts(products) {
    let created = 0;
    let updated = 0;

    for (const product of products) {
      try {
        if (!product.url || SEEN_URLS.has(product.url)) continue;
        SEEN_URLS.add(product.url);

        const result = await productService.createOrUpdate(product);
        const isNew = !result.updated_at || result.created_at === result.updated_at;
        if (isNew) created++;
        else updated++;
      } catch (err) {
        console.warn(`[IntegrationService] Failed to save "${product.name?.substring(0, 40)}": ${err.message}`);
      }
    }

    return { created, updated };
  }

  getStatus() {
    return { ...this.stats };
  }
}

module.exports = new IntegrationService();
