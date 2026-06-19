const { query } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

const findOrCreateCart = async (userId) => {
  const { rows: existing } = await query(
    'SELECT id FROM carts WHERE user_id = $1',
    [userId]
  );
  if (existing.length > 0) return existing[0];

  const id = uuidv4();
  const { rows } = await query(
    'INSERT INTO carts (id, user_id) VALUES ($1, $2) RETURNING id',
    [id, userId]
  );
  return rows[0];
};

const getCartWithItems = async (userId) => {
  const cart = await findOrCreateCart(userId);

  const { rows: items } = await query(
    `SELECT
      ci.id, ci.product_id, ci.quantity,
      p.name, p.image_url, p.current_price, p.original_price,
      p.store, p.url, p.currency, p.category
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.added_at DESC`,
    [cart.id]
  );

  return { id: cart.id, items };
};

const addItem = async (userId, productId, quantity = 1) => {
  const cart = await findOrCreateCart(userId);

  const { rows: existing } = await query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cart.id, productId]
  );

  if (existing.length > 0) {
    const newQty = existing[0].quantity + quantity;
    const { rows } = await query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, product_id, quantity`,
      [newQty, existing[0].id]
    );
    return rows[0];
  }

  const id = uuidv4();
  const { rows } = await query(
    `INSERT INTO cart_items (id, cart_id, product_id, quantity)
     VALUES ($1, $2, $3, $4) RETURNING id, product_id, quantity`,
    [id, cart.id, productId, quantity]
  );
  return rows[0];
};

const updateQuantity = async (userId, productId, quantity) => {
  const cart = await findOrCreateCart(userId);
  const { rows } = await query(
    `UPDATE cart_items SET quantity = $1, updated_at = NOW()
     WHERE cart_id = $2 AND product_id = $3 RETURNING id, product_id, quantity`,
    [quantity, cart.id, productId]
  );
  return rows[0] || null;
};

const removeItem = async (userId, productId) => {
  const cart = await findOrCreateCart(userId);
  const { rowCount } = await query(
    'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cart.id, productId]
  );
  return rowCount > 0;
};

const clearCart = async (userId) => {
  const cart = await findOrCreateCart(userId);
  await query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
};

module.exports = { getCartWithItems, addItem, updateQuantity, removeItem, clearCart };
