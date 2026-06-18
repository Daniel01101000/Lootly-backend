const wishlistModel = require('../models/wishlist.model');
const productModel = require('../models/product.model');
const ApiError = require('../utils/ApiError');

const list = async (userId) => {
  return wishlistModel.findByUser(userId);
};

const add = async (userId, productId) => {
  const product = await productModel.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const exists = await wishlistModel.exists(userId, productId);
  if (exists) throw new ApiError(409, 'Product already in wishlist');

  await wishlistModel.add(userId, productId);
  return product;
};

const remove = async (userId, productId) => {
  const removed = await wishlistModel.remove(userId, productId);
  if (!removed) throw new ApiError(404, 'Product not found in wishlist');
};

module.exports = { list, add, remove };
