const { newDb } = require('pg-mem');

function test() {
  const db = newDb();
  const p = db.public;

  p.registerFunction({
    name: 'gen_random_uuid',
    args: [],
    returns: 'text',
    implementation: () => {
      const { v4 } = require('uuid');
      return v4();
    },
  });

  // Try DECIMAL without precision
  p.query(`CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    current_price DECIMAL NOT NULL,
    original_price DECIMAL,
    currency VARCHAR(10) DEFAULT 'USD',
    store VARCHAR(100),
    category VARCHAR(100),
    url VARCHAR(500) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  console.log('Table created with DECIMAL (no precision)');

  // Test all operations
  const ins = p.query(
    `INSERT INTO products (name, current_price, original_price, store, category, url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ['Test Game', 29.99, 59.99, 'Steam', 'games', 'https://example.com/game']
  );
  console.log('Inserted:', ins.rows[0].name);

  const sel = p.query('SELECT * FROM products WHERE category = $1', ['games']);
  console.log('Selected:', sel.rows.length);

  const cnt = p.query('SELECT COUNT(*) as cnt FROM products');
  console.log('Count:', cnt.rows[0].cnt);

  const disc = p.query(
    'SELECT * FROM products ORDER BY (COALESCE(original_price, 0) - current_price) DESC LIMIT $1 OFFSET $2',
    [10, 0]
  );
  console.log('Discount sort:', disc.rows.length);

  const upd = p.query(
    "UPDATE products SET current_price = $1 WHERE url = $2 RETURNING *",
    [19.99, 'https://example.com/game']
  );
  console.log('Updated price:', upd.rows[0].current_price);

  const del = p.query("DELETE FROM products WHERE url = $1 RETURNING *", ['https://example.com/game']);
  console.log('Deleted:', del.rows.length);

  console.log('\nALL SIMPLIFIED PG-MEM TESTS PASSED');
}

try {
  test();
} catch (err) {
  console.error('FAILED:', err.message);
  process.exit(1);
}
