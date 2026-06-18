const { query } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

const findByUser = async (userId) => {
  const { rows } = await query(
    `SELECT a.*, p.name as product_name, p.image_url, p.current_price
     FROM price_alerts a
     JOIN products p ON p.id = a.product_id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`,
    [userId]
  );
  return rows;
};

const create = async (userId, productId, targetPrice) => {
  const id = uuidv4();
  const { rows } = await query(
    'INSERT INTO price_alerts (id, user_id, product_id, target_price) VALUES ($1, $2, $3, $4) RETURNING *',
    [id, userId, productId, targetPrice]
  );
  return rows[0];
};

const remove = async (id, userId) => {
  const { rowCount } = await query(
    'DELETE FROM price_alerts WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

const toggle = async (id, userId) => {
  const { rows } = await query(
    `UPDATE price_alerts SET is_active = NOT is_active WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return rows[0] || null;
};

module.exports = { findByUser, create, remove, toggle };
