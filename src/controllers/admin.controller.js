const fs = require('fs');
const path = require('path');
const { scrapeAllDeals } = require('../scrapers/mercadolibre.scraper');
const { query } = require('../database/connection');
const { seed } = require('../database/seed');

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

module.exports = { triggerMLScrape, triggerMigrations, triggerSeed };

async function triggerMigrations(req, res) {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SCRAPE_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    const results = [];
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        try {
          await query(stmt);
        } catch (err) {
          console.warn(`[Migrate] Skipped statement in ${file}: ${err.message}`);
        }
      }
      results.push(file);
      console.log(`[Migrate] Done: ${file}`);
    }

    res.json({ success: true, message: 'Migraciones completadas', files: results });
  } catch (err) {
    console.error('[Migrate] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function triggerSeed(req, res) {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SCRAPE_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await seed();
    const { rows } = await query('SELECT COUNT(*)::int as cnt FROM products');
    res.json({ success: true, message: 'Seed completado', totalProducts: rows[0].cnt });
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}
