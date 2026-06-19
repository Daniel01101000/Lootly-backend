const cartService = require('../services/cart.service');
const { success } = require('../utils/apiResponse');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    return success(res, cart);
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const item = await cartService.add(req.user.id, productId, quantity);
    return success(res, item, 'Producto agregado al carrito', 201);
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await cartService.update(req.user.id, req.params.productId, quantity);
    return success(res, item, 'Cantidad actualizada');
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    await cartService.remove(req.user.id, req.params.productId);
    return success(res, null, 'Producto eliminado del carrito');
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await cartService.clear(req.user.id);
    return success(res, null, 'Carrito vaciado');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
