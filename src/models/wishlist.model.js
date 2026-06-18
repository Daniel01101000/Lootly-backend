const { query } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

const findByUser = async (userId) => {
  const { rows } = await query(
    `SELECT p.*, w.added_at as wishlisted_at
     FROM wishlist w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = $1
     ORDER BY w.added_at DESC`,
    [userId]
  );
  return rows;
};

const add = async (userId, productId) => {
  const id = uuidv4();
  const { rows } = await query(
    'INSERT INTO wishlist (id, user_id, product_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *',
    [id, userId, productId]
  );
  return rows[0] || null;
};

const remove = async (userId, productId) => {
  const { rowCount } = await query(
    'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  return rowCount > 0;
};

const exists = async (userId, productId) => {
  const { rows } = await query(
    'SELECT 1 FROM wishlist WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  return rows.length > 0;
};

module.exports = { findByUser, add, remove, exists };
