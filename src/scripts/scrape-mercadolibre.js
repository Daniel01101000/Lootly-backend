const config = require('../config');

const { Pool } = require('pg');
const { scrapeAllDeals } = require('../scrapers/mercadolibre.scraper');
const productService = require('../services/product.service');
const { query } = require('../database/connection');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
});

async function run() {
  console.log('[ML Scrape] Iniciando scraping de Mercado Libre...');
  const deals = await scrapeAllDeals();

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const deal of deals) {
    try {
      const result = await productService.createOrUpdate({
        name: deal.name,
        currentPrice: deal.current_price,
        originalPrice: deal.original_price,
        imageUrl: deal.image_url,
        url: deal.url,
        store: deal.store,
        category: deal.category,
        currency: deal.currency,
      });
      if (result.created_at === result.updated_at) {
        created++;
      } else {
        updated++;
      }
      console.log(`[ML Scrape] ✓ ${deal.name} — $${deal.current_price} (-${deal.discount}%)`);
    } catch (err) {
      failed++;
      console.warn(`[ML Scrape] No se insertó "${deal.name}": ${err.message}`);
    }
  }

  console.log(`\n[ML Scrape] ✅ Proceso completo`);
  console.log(`[ML Scrape] Nuevos: ${created} | Actualizados: ${updated} | Fallidos: ${failed}`);

  const { rows } = await pool.query(`SELECT COUNT(*) FROM products WHERE store = 'Mercado Libre'`);
  console.log(`[ML Scrape] Total en DB ahora: ${rows[0].count} productos de Mercado Libre`);

  await pool.end();
}

run().catch((err) => {
  console.error('[ML Scrape] Error fatal:', err.message);
  process.exit(1);
});
