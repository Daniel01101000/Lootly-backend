const cartModel = require('../models/cart.model');
const productModel = require('../models/product.model');
const ApiError = require('../utils/ApiError');

const getCart = async (userId) => {
  return cartModel.getCartWithItems(userId);
};

const add = async (userId, productId, quantity = 1) => {
  const product = await productModel.findById(productId);
  if (!product) throw new ApiError(404, 'Producto no encontrado');

  const item = await cartModel.addItem(userId, productId, quantity);
  return item;
};

const update = async (userId, productId, quantity) => {
  if (quantity < 1) throw new ApiError(400, 'La cantidad debe ser al menos 1');

  const item = await cartModel.updateQuantity(userId, productId, quantity);
  if (!item) throw new ApiError(404, 'Producto no encontrado en el carrito');
  return item;
};

const remove = async (userId, productId) => {
  const removed = await cartModel.removeItem(userId, productId);
  if (!removed) throw new ApiError(404, 'Producto no encontrado en el carrito');
};

const clear = async (userId) => {
  await cartModel.clearCart(userId);
};

module.exports = { getCart, add, update, remove, clear };
