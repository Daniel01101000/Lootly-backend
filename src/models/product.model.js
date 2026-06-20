const { query } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

const logQuery = (label, sql, params) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SQL] ${label}: ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}`);
  }
};

const findAll = async ({ category, store, minPrice, maxPrice, sort, page = 1, limit = 500 }) => {
  const startTime = Date.now();
  const conditions = [];
  const params = [];
  let idx = 1;

  if (category) {
    conditions.push(`p.category = $${idx++}`);
    params.push(category);
  }
  if (store) {
    conditions.push(`p.store = $${idx++}`);
    params.push(store);
  }
  if (minPrice) {
    conditions.push(`p.current_price >= $${idx++}`);
    params.push(minPrice);
  }
  if (maxPrice) {
    conditions.push(`p.current_price <= $${idx++}`);
    params.push(maxPrice);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.current_price ASC';
  if (sort === 'price_desc') orderBy = 'p.current_price DESC';
  if (sort === 'discount') orderBy = '(COALESCE(p.original_price, 0) - p.current_price) DESC NULLS LAST';

  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) FROM products p ${where}`;
  const dataQuery = `SELECT p.* FROM products p ${where} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  logQuery('COUNT', countQuery, params.slice(0, -2));
  logQuery('SELECT', dataQuery, params);

  const [countResult, dataResult] = await Promise.all([
    query(countQuery, params.slice(0, -2)),
    query(dataQuery, params),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);
  const elapsed = Date.now() - startTime;

  console.log(`[DB] findAll returned ${dataResult.rows.length} products (total: ${total}) in ${elapsed}ms`);

  return {
    products: dataResult.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0] || null;
};

const findByUrl = async (url) => {
  const { rows } = await query('SELECT * FROM products WHERE url = $1', [url]);
  return rows[0] || null;
};

const create = async ({ name, imageUrl, currentPrice, originalPrice, currency, store, category, url, description, rating, stock }) => {
  const id = uuidv4();
  const { rows } = await query(
    `INSERT INTO products (id, name, image_url, current_price, original_price, currency, store, category, url, description, rating, stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (url) DO UPDATE SET
       current_price = EXCLUDED.current_price,
       original_price = EXCLUDED.original_price,
       image_url = EXCLUDED.image_url,
       updated_at = NOW()
     RETURNING *`,
    [id, name, imageUrl, currentPrice, originalPrice, currency || 'USD', store, category, url, description || null, rating || null, stock ?? null]
  );
  return rows[0];
};

const updatePrice = async (id, price) => {
  const { rows } = await query(
    `UPDATE products SET current_price = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [price, id]
  );
  return rows[0];
};

const getStores = async () => {
  const { rows } = await query(
    `SELECT store, COUNT(*)::int as count FROM products WHERE store IS NOT NULL AND store != '' GROUP BY store ORDER BY count DESC`
  );
  return rows;
};

module.exports = { findAll, findById, findByUrl, create, updatePrice, getStores };
