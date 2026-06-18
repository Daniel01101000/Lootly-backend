const alertModel = require('../models/alert.model');
const productModel = require('../models/product.model');
const ApiError = require('../utils/ApiError');

const list = async (userId) => {
  return alertModel.findByUser(userId);
};

const create = async (userId, productId, targetPrice) => {
  const product = await productModel.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  return alertModel.create(userId, productId, targetPrice);
};

const remove = async (id, userId) => {
  const removed = await alertModel.remove(id, userId);
  if (!removed) throw new ApiError(404, 'Alert not found');
};

const toggle = async (id, userId) => {
  const alert = await alertModel.toggle(id, userId);
  if (!alert) throw new ApiError(404, 'Alert not found');
  return alert;
};

module.exports = { list, create, remove, toggle };
