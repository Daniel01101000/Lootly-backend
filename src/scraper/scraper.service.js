const AmazonScraper = require('./amazon/amazon.scraper');
const MercadoLibreScraper = require('./mercadolibre/mercadolibre.scraper');
// const SteamScraper = require('./steam/steam.scraper');
const DDTechScraper = require('./ddtech/ddtech.scraper');
const CyberPuertaScraper = require('./cyberpuerta/cyberpuerta.scraper');
const GamePlanetScraper = require('./gameplanet/gameplanet.scraper');
const DigitalLifeScraper = require('./digitallife/digitallife.scraper');
const ZegucomScraper = require('./zegucom/zegucom.scraper');
const NeweggScraper = require('./newegg/newegg.scraper');
const BestBuyScraper = require('./bestbuy/bestbuy.scraper');
const productService = require('../services/product.service');

const SEEN_URLS = new Set();

class ScraperService {
  constructor() {
    this.amazon = new AmazonScraper();
    this.mercadolibre = new MercadoLibreScraper();
    // this.steam = new SteamScraper();
    this.ddtech = new DDTechScraper();
    this.cyberpuerta = new CyberPuertaScraper();
    this.gameplanet = new GamePlanetScraper();
    this.digitallife = new DigitalLifeScraper();
    this.zegucom = new ZegucomScraper();
    this.newegg = new NeweggScraper();
    this.bestbuy = new BestBuyScraper();
    this.stats = {
      totalScraped: 0,
      totalSaved: 0,
      totalUpdated: 0,
      totalErrors: 0,
      lastRun: null,
      lastRunDuration: null,
    };
  }

  async scrapeAll() {
    const startTime = Date.now();
    console.log('[ScraperService] Starting full scrape of all categories from all stores...');

    SEEN_URLS.clear();
    let allProducts = [];
    let errors = 0;

    const scrapers = [
      { name: 'DDTech', instance: this.ddtech },
      { name: 'CyberPuerta', instance: this.cyberpuerta },
      { name: 'GamePlanet', instance: this.gameplanet },
      { name: 'Digital Life', instance: this.digitallife },
      { name: 'Zegucom', instance: this.zegucom },
      { name: 'Newegg', instance: this.newegg },
      { name: 'Best Buy', instance: this.bestbuy },
      { name: 'Amazon', instance: this.amazon },
      { name: 'Mercado Libre', instance: this.mercadolibre },
      // { name: 'Steam', instance: this.steam },
    ];

    for (const { name, instance } of scrapers) {
      try {
        console.log(`[ScraperService] Running ${name} scraper...`);
        const start = Date.now();
        const products = await instance.searchProducts();
        const elapsed = Date.now() - start;

        let storeHealth = null;
        if (typeof instance.getStoreHealth === 'function') {
          storeHealth = instance.getStoreHealth();
        }

        if (products.length === 0) {
          console.warn(`[SCRAPER-DIAG] ⚠ ${name} returned 0 products in ${elapsed}ms`);
          if (storeHealth) {
            console.warn(`[SCRAPER-DIAG]   accessible: ${storeHealth.accessible}, consecutiveErrors: ${storeHealth.consecutiveErrors}, lastError: ${storeHealth.lastError || 'none'}`);
          }
        } else {
          console.log(`[SCRAPER-DIAG] ✓ ${name} returned ${products.length} products in ${elapsed}ms`);
          if (storeHealth) {
            console.log(`[SCRAPER-DIAG]   accessible: ${storeHealth.accessible}, successfulSearches: ${storeHealth.successfulSearches}/${storeHealth.totalSearches}`);
          }
        }

        const catCounts = {};
        for (const p of products) {
          catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        }
        for (const [cat, count] of Object.entries(catCounts)) {
          console.log(`[STORE]   ${cat}: ${count} products`);
        }
        allProducts = allProducts.concat(products);
      } catch (err) {
        errors++;
        console.error(`[SCRAPER-DIAG] ✗ ${name} scraper FAILED: ${err.message}`);
      }
    }

    console.log(`[ScraperService] Total raw products collected: ${allProducts.length}`);

    const saved = await this._saveProducts(allProducts);

    this.stats.totalScraped += allProducts.length;
    this.stats.totalSaved += saved.created;
    this.stats.totalUpdated += saved.updated;
    this.stats.totalErrors += errors;
    this.stats.lastRun = new Date().toISOString();
    this.stats.lastRunDuration = Date.now() - startTime;

    console.log(`[ScraperService] Scrape complete. Created: ${saved.created}, Updated: ${saved.updated}, Errors: ${errors}, Duration: ${this.stats.lastRunDuration}ms`);

    return { products: allProducts, ...saved, errors, duration: this.stats.lastRunDuration };
  }

  async scrapeCategory(category) {
    const startTime = Date.now();
    console.log(`[ScraperService] Scraping category "${category}" from all stores...`);

    SEEN_URLS.clear();
    let allProducts = [];
    let errors = 0;

    const scrapers = [
      { name: 'DDTech', instance: this.ddtech },
      { name: 'CyberPuerta', instance: this.cyberpuerta },
      { name: 'GamePlanet', instance: this.gameplanet },
      { name: 'Digital Life', instance: this.digitallife },
      { name: 'Zegucom', instance: this.zegucom },
      { name: 'Newegg', instance: this.newegg },
      { name: 'Best Buy', instance: this.bestbuy },
      { name: 'Amazon', instance: this.amazon },
      { name: 'Mercado Libre', instance: this.mercadolibre },
      // { name: 'Steam', instance: this.steam },
    ];

    for (const { name, instance } of scrapers) {
      try {
        console.log(`[ScraperService] Running ${name} for category "${category}"...`);
        const products = await instance.searchProducts({ category });
        console.log(`[CATEGORY] ${name} returned ${products.length} products for "${category}":`);
        const catCounts = {};
        for (const p of products) {
          catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        }
        for (const [cat, count] of Object.entries(catCounts)) {
          console.log(`[CATEGORY]   ${cat}: ${count} products`);
        }
        allProducts = allProducts.concat(products);
      } catch (err) {
        errors++;
        console.error(`[ScraperService] ${name} failed for "${category}": ${err.message}`);
      }
    }

    const saved = await this._saveProducts(allProducts);
    const duration = Date.now() - startTime;

    console.log(`[ScraperService] Category "${category}" scrape complete. Created: ${saved.created}, Updated: ${saved.updated}, Duration: ${duration}ms`);

    return { products: allProducts, ...saved, errors, duration };
  }

  async scrapeStore(store) {
    const startTime = Date.now();
    console.log(`[ScraperService] Scraping all categories from "${store}"...`);

    SEEN_URLS.clear();
    let allProducts = [];
    let errors = 0;

    const storeMap = {
      'amazon': this.amazon,
      'mercadolibre': this.mercadolibre,
      // 'steam': this.steam,
      'ddtech': this.ddtech,
      'cyberpuerta': this.cyberpuerta,
      'gameplanet': this.gameplanet,
      'digitallife': this.digitallife,
      'zegucom': this.zegucom,
      'newegg': this.newegg,
      'bestbuy': this.bestbuy,
    };

    const instance = storeMap[store];
    if (!instance) {
      throw new Error(`Unknown store: "${store}". Use: ${Object.keys(storeMap).join(', ')}`);
    }

    try {
      allProducts = await instance.searchProducts();
    } catch (err) {
      errors++;
      console.error(`[ScraperService] ${instance.name} failed: ${err.message}`);
    }

    const saved = await this._saveProducts(allProducts);
    const duration = Date.now() - startTime;

    return { products: allProducts, ...saved, errors, duration };
  }

  async _saveProducts(products) {
    let created = 0;
    let updated = 0;

    for (const product of products) {
      try {
        if (!product.url || SEEN_URLS.has(product.url)) continue;
        SEEN_URLS.add(product.url);

        const result = await productService.createOrUpdate(product);
        const isNew = result.created_at === result.updated_at || !result.updated_at;
        if (isNew) created++;
        else updated++;
      } catch (err) {
        console.warn(`[ScraperService] Failed to save product "${product.name}": ${err.message}`);
      }
    }

    return { created, updated };
  }

  getStatus() {
    return { ...this.stats };
  }
}

module.exports = new ScraperService();
