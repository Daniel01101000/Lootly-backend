require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lootly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function run() {
  console.log('[FIX] Connecting to database...');

  const { rows: before } = await pool.query(
    `SELECT name, category FROM products WHERE store = 'Mercado Libre' AND category = 'games' AND (name ILIKE '%samsung%' OR name ILIKE '%galaxy%' OR name ILIKE '%iphone%' OR name ILIKE '%refrigerador%' OR name ILIKE '%frigobar%')`
  );
  console.log(`[FIX] Found ${before.length} miscategorized products (games that are phones/appliances):`);
  before.forEach(p => console.log(`  - ${p.name} (${p.category})`));

  const phoneResult = await pool.query(
    `UPDATE products SET category = 'phone' WHERE category != 'phone' AND (name ILIKE '%galaxy%' OR name ILIKE '%iphone%' OR name ILIKE '%xiaomi%' OR name ILIKE '%redmi%' OR name ILIKE '%celular%' OR name ILIKE '%smartphone%') AND store = 'Mercado Libre'`
  );
  console.log(`[FIX] Re-categorized ${phoneResult.rowCount} products → phone`);

  const applianceResult = await pool.query(
    `UPDATE products SET category = 'appliance' WHERE category != 'appliance' AND (name ILIKE '%refrigerador%' OR name ILIKE '%frigobar%' OR name ILIKE '%lavadora%' OR name ILIKE '%microondas%' OR name ILIKE '%licuadora%' OR name ILIKE '%aspiradora%') AND store = 'Mercado Libre'`
  );
  console.log(`[FIX] Re-categorized ${applianceResult.rowCount} products → appliance`);

  const { rows: phoneCount } = await pool.query(`SELECT COUNT(*) FROM products WHERE category = 'phone'`);
  const { rows: applianceCount } = await pool.query(`SELECT COUNT(*) FROM products WHERE category = 'appliance'`);
  console.log(`[FIX] Total products in 'phone': ${phoneCount[0].count}`);
  console.log(`[FIX] Total products in 'appliance': ${applianceCount[0].count}`);

  const { rows: storeCounts } = await pool.query(
    `SELECT store, COUNT(*) as count FROM products GROUP BY store ORDER BY count DESC`
  );
  console.log(`[FIX] Products per store:`);
  storeCounts.forEach(s => console.log(`  ${s.store}: ${s.count}`));

  await pool.end();
}

run().catch(err => {
  console.error('[FIX] Error:', err.message);
  process.exit(1);
});
