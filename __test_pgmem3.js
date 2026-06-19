const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

function test() {
  const db = newDb();
  const p = db.public;

  // Register uuid function
  p.registerFunction({
    name: 'gen_random_uuid',
    args: [],
    returns: 'text',
    implementation: () => uuidv4(),
  });

  // Create tables using the public interface
  p.query(`CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    current_price DECIMAL NOT NULL,
    original_price DECIMAL,
    currency VARCHAR(10) DEFAULT 'USD',
    store VARCHAR(100),
    category VARCHAR(100),
    url VARCHAR(500) UNIQUE NOT NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  p.query(`CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
  )`);

  // Now create the pg adapter and use it like real pg
  const mockPg = db.adapters.createPg();
  const pool = new mockPg.Pool();

  // This should accept $1, $2 params
  pool.query(
    `INSERT INTO products (name, current_price, original_price, store, category, url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ['Cyberpunk 2077', 29.99, 59.99, 'Steam', 'games', 'https://example.com/cyberpunk'],
    (err, result) => {
      if (err) {
        console.error('INSERT error:', err);
        return;
      }
      console.log('INSERT success, id:', result.rows[0].id);

      // Test SELECT with params
      pool.query(
        'SELECT * FROM products WHERE category = $1',
        ['games'],
        (err, result) => {
          if (err) { console.error('SELECT error:', err); return; }
          console.log('SELECT rows:', result.rows.length);

          // Test COUNT
          pool.query(
            'SELECT COUNT(*) as cnt FROM products',
            [],
            (err, result) => {
              if (err) { console.error('COUNT error:', err); return; }
              console.log('COUNT:', result.rows[0].cnt);

              // Test ORDER BY expression (discount sort)
              pool.query(
                'SELECT * FROM products ORDER BY (COALESCE(original_price, 0) - current_price) DESC LIMIT $1 OFFSET $2',
                [10, 0],
                (err, result) => {
                  if (err) { console.error('SORT error:', err); return; }
                  console.log('Discount sort rows:', result.rows.length);

                  // Test UPDATE with RETURNING
                  pool.query(
                    'UPDATE products SET current_price = $1 WHERE url = $2 RETURNING *',
                    [24.99, 'https://example.com/cyberpunk'],
                    (err, result) => {
                      if (err) { console.error('UPDATE error:', err); return; }
                      console.log('UPDATE success, new price:', result.rows[0].current_price);

                      // Test INSERT with price_history using RETURNING
                      const productId = result.rows[0].id;
                      pool.query(
                        'INSERT INTO price_history (product_id, price) VALUES ($1, $2) RETURNING *',
                        [productId, 29.99],
                        (err, result) => {
                          if (err) { console.error('HISTORY error:', err); return; }
                          console.log('Price history recorded, id:', result.rows[0].id);

                          console.log('\nALL PG-MEM ADAPTER TESTS PASSED!');
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

try {
  test();
} catch (err) {
  console.error('FAILED:', err.message);
  process.exit(1);
}
