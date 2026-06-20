const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
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
          `INSERT INTO products (id, name, image_url, current_price, original_price, store, category, url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           ON CONFLICT (url) DO UPDATE SET
             current_price = EXCLUDED.current_price,
             original_price = EXCLUDED.original_price,
             image_url = EXCLUDED.image_url,
             updated_at = NOW()
           RETURNING id`,
          [uuidv4(), deal.name, deal.image_url, deal.current_price, deal.original_price, deal.store, deal.category, deal.url]
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

async function checkDuplicates(req, res) {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SCRAPE_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const constraints = await query(
      `SELECT conname, contype FROM pg_constraint WHERE conrelid = 'products'::regclass`
    );

    const indexes = await query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'products'`
    );

    const dupesByUrl = await query(
      `SELECT url, COUNT(*) as count
       FROM products
       WHERE store = 'Mercado Libre'
       GROUP BY url
       HAVING COUNT(*) > 1
       LIMIT 20`
    );

    const dupesByName = await query(
      `SELECT name, COUNT(*) as count, array_agg(url) as urls
       FROM products
       WHERE store = 'Mercado Libre'
       GROUP BY name
       HAVING COUNT(*) > 1
       LIMIT 20`
    );

    const totalML = await query(
      `SELECT COUNT(*)::int as cnt FROM products WHERE store = 'Mercado Libre'`
    );

    res.json({
      success: true,
      totalMercadoLibreProducts: totalML.rows[0].cnt,
      constraints: constraints.rows,
      indexes: indexes.rows,
      dupesByUrl: dupesByUrl.rows,
      dupesByName: dupesByName.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function cleanDuplicates(req, res) {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SCRAPE_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const before = await query(
      `SELECT COUNT(*)::int as cnt FROM products WHERE store = 'Mercado Libre'`
    );

    const result = await query(
      `DELETE FROM products a
       WHERE a.store = 'Mercado Libre'
       AND a.id NOT IN (
         SELECT DISTINCT ON (name) id
         FROM products
         WHERE store = 'Mercado Libre'
         ORDER BY name, updated_at DESC
       )`
    );

    const after = await query(
      `SELECT COUNT(*)::int as cnt FROM products WHERE store = 'Mercado Libre'`
    );

    res.json({
      success: true,
      message: 'Duplicados limpiados',
      beforeCleanup: before.rows[0].cnt,
      remainingProducts: after.rows[0].cnt,
      deleted: before.rows[0].cnt - after.rows[0].cnt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function cleanNonGaming(req, res) {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SCRAPE_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await query(
      `DELETE FROM products
       WHERE store = 'Mercado Libre'
       AND category IN ('phone', 'appliance')`
    );

    res.json({
      success: true,
      message: 'Productos no-gaming eliminados',
      deleted: result.rowCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { triggerMLScrape, triggerMigrations, triggerSeed, checkDuplicates, cleanDuplicates, cleanNonGaming };

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
