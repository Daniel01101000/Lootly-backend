const { newDb } = require('pg-mem');

function test() {
  const db = newDb();
  const p = db.public;

  // Register uuid-ossp extension functions manually
  p.registerFunction({
    name: 'uuid_generate_v4',
    args: [],
    returns: 'text',
    implementation: () => {
      const { v4 } = require('uuid');
      return v4();
    },
  });

  p.registerFunction({
    name: 'gen_random_uuid',
    args: [],
    returns: 'text',
    implementation: () => {
      const { v4 } = require('uuid');
      return v4();
    },
  });

  // Test full schema
  p.query(`CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    store VARCHAR(100),
    category VARCHAR(100),
    url VARCHAR(500) UNIQUE NOT NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`);

  p.query(`CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`);

  // Test INSERT with RETURNING
  const insertResult = p.query(
    `INSERT INTO products (name, current_price, original_price, store, category, url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ['Cyberpunk 2077', 29.99, 59.99, 'Steam', 'games', 'https://store.steampowered.com/app/1091500']
  );
  console.log('INSERT RETURNING id:', insertResult.rows[0].id);

  // Test parameterized SELECT
  const selectResult = p.query('SELECT * FROM products WHERE category = $1', ['games']);
  console.log('SELECT rows:', selectResult.rows.length);

  // Test COUNT with conditions
  const countResult = p.query('SELECT COUNT(*) as cnt FROM products WHERE store = $1', ['Steam']);
  console.log('COUNT:', countResult.rows[0].cnt);

  // Test ORDER BY expression (discount sort)
  const allResult = p.query(`SELECT p.* FROM products p ORDER BY (COALESCE(p.original_price, 0) - p.current_price) DESC NULLS LAST LIMIT $1 OFFSET $2`, [10, 0]);
  console.log('Discount sort rows:', allResult.rows.length);

  // Test UPDATE with RETURNING
  const updateResult = p.query(
    `UPDATE products SET current_price = $1, updated_at = NOW() WHERE url = $2 RETURNING *`,
    [24.99, 'https://store.steampowered.com/app/1091500']
  );
  console.log('UPDATE new price:', updateResult.rows[0].current_price);

  // Test price_history
  p.query(
    `INSERT INTO price_history (product_id, price) VALUES ($1, $2) RETURNING *`,
    [insertResult.rows[0].id, 29.99]
  );
  const histResult = p.query('SELECT * FROM price_history WHERE product_id = $1 ORDER BY recorded_at ASC', [insertResult.rows[0].id]);
  console.log('Price history rows:', histResult.rows.length);

  // Test with NULL original_price
  p.query(
    `INSERT INTO products (name, current_price, store, category, url)
     VALUES ($1, $2, $3, $4, $5)`,
    ['Free Game', 0, 'Epic', 'games', 'https://epicgames.com/free']
  );
  const nullResult = p.query('SELECT * FROM products WHERE original_price IS NULL');
  console.log('NULL original_price products:', nullResult.rows.length);

  // Test LIKE query (used elsewhere)
  const likeResult = p.query("SELECT * FROM products WHERE name LIKE $1", ['%Cyber%']);
  console.log('LIKE search:', likeResult.rows.length);

  console.log('\nALL PG-MEM TESTS PASSED');
}

try {
  test();
} catch (err) {
  console.error('FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
}
