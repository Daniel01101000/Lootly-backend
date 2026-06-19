const alertService = require('../services/alert.service');
const { success } = require('../utils/apiResponse');

const list = async (req, res, next) => {
  try {
    const alerts = await alertService.list(req.user.id);
    return success(res, alerts);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { productId, targetPrice } = req.body;
    const alert = await alertService.create(req.user.id, productId, targetPrice);
    return success(res, alert, 'Alert created', 201);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await alertService.remove(req.params.id, req.user.id);
    return success(res, null, 'Alert deleted');
  } catch (err) {
    next(err);
  }
};

const toggle = async (req, res, next) => {
  try {
    const alert = await alertService.toggle(req.params.id, req.user.id);
    return success(res, alert, 'Alert toggled');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, remove, toggle };
