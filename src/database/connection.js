const config = require('../config');
const fs = require('fs');
const path = require('path');

let pool = null;
let _query = null;
let _getClient = null;
let initialized = false;
let initPromise = null;
let initError = null;

async function initialize() {
  if (initialized) return;
  if (initPromise) return initPromise;

  const startTime = Date.now();

  initPromise = (async () => {
    try {
      const { Pool } = require('pg');
      const testPool = new Pool({
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 30000,
      });

      await testPool.query('SELECT 1 AS health_check');

      testPool.on('error', (err) => {
        console.error(`[DB] Unexpected error on idle client: ${err.message}`);
      });

      pool = testPool;
      _query = (text, params) => pool.query(text, params);
      _getClient = () => pool.connect();
      initialized = true;

      console.log(`[DB] PostgreSQL connected at ${config.db.host}:${config.db.port}/${config.db.database} (${Date.now() - startTime}ms)`);
    } catch (connErr) {
      console.warn(`[DB] PostgreSQL unavailable (${connErr.message}). Falling back to pg-mem (in-memory).`);
      console.warn('[DB] Data will NOT persist between restarts. Use PostgreSQL for production.');

      try {
        const { newDb } = require('pg-mem');
        const { v4: uuidv4 } = require('uuid');

        const db = newDb();
        const p = db.public;

      const registerUuidFn = (name) => {
        p.registerFunction({
          name,
          args: [],
          returns: 'text',
          volatility: 'volatile',
          implementation: () => uuidv4(),
        });
      };

      registerUuidFn('gen_random_uuid');
      registerUuidFn('uuid_generate_v4');

        const migrationFiles = ['001_create_users.sql', '002_add_product_fields.sql', '005_create_carts.sql'];
        for (const file of migrationFiles) {
          const migrationPath = path.resolve(__dirname, 'migrations', file);
          if (fs.existsSync(migrationPath)) {
            const migrationSql = fs.readFileSync(migrationPath, 'utf8');
            const statements = migrationSql
              .split(';')
              .map(s => s.trim())
              .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const stmt of statements) {
              try {
                p.query(stmt);
              } catch (stmtErr) {
                console.warn(`[DB] Migration ${file} statement skipped: ${stmtErr.message}`);
              }
            }
            console.log(`[DB] Schema applied: ${file}`);
          } else {
            console.warn(`[DB] Migration file not found: ${migrationPath}`);
          }
        }

        const mockPg = db.adapters.createPg();
        pool = new mockPg.Pool();
        _query = (text, params) => pool.query(text, params);
        _getClient = () => pool.connect();
        initialized = true;

        console.log(`[DB] pg-mem in-memory database initialized (${Date.now() - startTime}ms)`);

        try {
          const { seed } = require('./seed');
          await seed();
        } catch (seedErr) {
          console.warn(`[DB] Seed skipped: ${seedErr.message}`);
        }
      } catch (memErr) {
        initError = memErr;
        console.error(`[DB] Failed to initialize database: ${memErr.message}`);
        throw memErr;
      }
    }
  })();

  return initPromise;
}

const query = async (text, params) => {
  if (initError) throw initError;
  if (!_query) await initialize();
  return _query(text, params);
};

const getClient = async () => {
  if (initError) throw initError;
  if (!_query) await initialize();
  return _getClient();
};

const init = initialize();
init.catch(err => {
  console.error('[DB] Fatal initialization error:', err.message);
  initError = err;
});

module.exports = { query, getClient, pool };
