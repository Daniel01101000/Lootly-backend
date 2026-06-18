const { scrapeAllDeals } = require('../scrapers/mercadolibre.scraper');
const { query } = require('../database/connection');

const triggerMLScrape = async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SCRAPE_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  res.json({ success: true, message: 'Scraping iniciado en segundo plano. Revisa los logs de Render.' });

  try {
    const deals = await scrapeAllDeals();
    let inserted = 0;

    for (const deal of deals) {
      try {
        const result = await query(
          `INSERT INTO products (name, image_url, current_price, original_price, store, category, url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (url) DO UPDATE SET
             current_price = EXCLUDED.current_price,
             original_price = EXCLUDED.original_price,
             image_url = EXCLUDED.image_url,
             updated_at = NOW()
           RETURNING id`,
          [deal.name, deal.image_url, deal.current_price, deal.original_price, deal.store, deal.category, deal.url]
        );
        if (result.rows.length > 0) inserted++;
      } catch (err) {
        console.warn(`[Admin Scrape] No se insertó "${deal.name}": ${err.message}`);
      }
    }

    console.log(`[Admin Scrape] ✅ Completo. Insertados/actualizados: ${inserted} de ${deals.length}`);
  } catch (err) {
    console.error('[Admin Scrape] Error fatal:', err.message);
  }
};

module.exports = { triggerMLScrape };
