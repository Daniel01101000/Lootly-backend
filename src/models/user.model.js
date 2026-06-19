const { query } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

const findByEmail = async (email) => {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

const findByUsername = async (username) => {
  const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await query(
    'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const create = async ({ username, email, password }) => {
  const id = uuidv4();
  const { rows } = await query(
    `INSERT INTO users (id, username, email, password)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, avatar_url, created_at`,
    [id, username, email, password]
  );
  return rows[0];
};

const updateAvatar = async (id, avatarUrl) => {
  const { rows } = await query(
    'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, avatar_url',
    [avatarUrl, id]
  );
  return rows[0];
};

module.exports = { findByEmail, findByUsername, findById, create, updateAvatar };
