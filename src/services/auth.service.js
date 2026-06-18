const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userModel = require('../models/user.model');
const ApiError = require('../utils/ApiError');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

const register = async ({ username, email, password }) => {
  const existingEmail = await userModel.findByEmail(email);
  if (existingEmail) throw new ApiError(409, 'Email already registered');

  const existingUsername = await userModel.findByUsername(username);
  if (existingUsername) throw new ApiError(409, 'Username already taken');

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await userModel.create({ username, email, password: hashedPassword });
  const token = generateToken(user);

  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const token = generateToken(user);

  const { password: _, ...userData } = user;
  return { user: userData, token };
};

const getProfile = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

module.exports = { register, login, getProfile };
