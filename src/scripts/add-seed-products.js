require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const {
  dellProducts, microCenterProducts, gogProducts, gameStopProducts,
  steelSeriesProducts, walmartProducts, lenovoProducts, hyperxProducts,
} = require('../database/seed-data');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lootly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const allNewProducts = [
  ...dellProducts,
  ...microCenterProducts,
  ...gogProducts,
  ...gameStopProducts,
  ...steelSeriesProducts,
  ...walmartProducts,
  ...lenovoProducts,
  ...hyperxProducts,
];

async function run() {
  console.log(`[SEED-ADD] Inserting ${allNewProducts.length} new products for low-volume stores...`);
  let inserted = 0;
  let skipped = 0;

  for (const product of allNewProducts) {
    try {
      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO products (id, name, description, image_url, current_price, original_price, store, category, url, rating, stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (url) DO NOTHING
         RETURNING id`,
        [id, product.name, product.description || null, product.imageUrl, product.currentPrice, product.originalPrice, product.store, product.category, product.url, product.rating ?? null, product.stock ?? null]
      );
      if (result.rows.length > 0) {
        inserted++;
        console.log(`  + ${product.store}: ${product.name}`);
      } else {
        skipped++;
      }
    } catch (err) {
      console.warn(`  ! Failed: ${product.name}: ${err.message}`);
    }
  }

  console.log(`\n[SEED-ADD] Inserted: ${inserted} | Skipped (already exist): ${skipped}`);

  const { rows: storeCounts } = await pool.query(
    `SELECT store, COUNT(*) as count FROM products GROUP BY store ORDER BY count DESC`
  );
  console.log(`\n[SEED-ADD] Updated store counts:`);
  storeCounts.forEach(s => console.log(`  ${s.store}: ${s.count}`));

  await pool.end();
}

run().catch(err => {
  console.error('[SEED-ADD] Error:', err.message);
  process.exit(1);
});
