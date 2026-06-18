require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lootly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`[MIGRATE] Running ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        console.warn(`[MIGRATE] Skipped statement in ${file}: ${err.message}`);
      }
    }
    console.log(`[MIGRATE] Done: ${file}`);
  }

  console.log('[MIGRATE] All migrations complete.');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('[MIGRATE] Fatal:', err.message);
  process.exit(1);
});
