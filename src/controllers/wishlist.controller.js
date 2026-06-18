const wishlistService = require('../services/wishlist.service');
const { success } = require('../utils/apiResponse');

const list = async (req, res, next) => {
  try {
    const items = await wishlistService.list(req.user.id);
    return success(res, items);
  } catch (err) {
    next(err);
  }
};

const add = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await wishlistService.add(req.user.id, productId);
    return success(res, product, 'Added to wishlist', 201);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await wishlistService.remove(req.user.id, req.params.productId);
    return success(res, null, 'Removed from wishlist');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, add, remove };
