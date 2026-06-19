const { query } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

const findByProduct = async (productId) => {
  const { rows } = await query(
    'SELECT * FROM price_history WHERE product_id = $1 ORDER BY recorded_at ASC',
    [productId]
  );
  return rows;
};

const record = async (productId, price) => {
  const id = uuidv4();
  const { rows } = await query(
    'INSERT INTO price_history (id, product_id, price) VALUES ($1, $2, $3) RETURNING *',
    [id, productId, price]
  );
  return rows[0];
};

module.exports = { findByProduct, record };
