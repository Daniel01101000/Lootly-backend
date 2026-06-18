const productService = require('../services/product.service');
const { success, paginated } = require('../utils/apiResponse');

const list = async (req, res, next) => {
  const startTime = Date.now();
  const { category, store, minPrice, maxPrice, sort, page, limit } = req.query;

  console.log(`[API] GET /api/v1/products — sort=${sort || 'default'}, page=${page || 1}, filters=${JSON.stringify({ category, store, minPrice, maxPrice })}`);

  try {
    const result = await productService.list({ category, store, minPrice, maxPrice, sort, page, limit });
    const elapsed = Date.now() - startTime;

    console.log(`[API] GET /api/v1/products — ${result.pagination.total} total, ${result.products.length} returned, ${elapsed}ms`);

    return paginated(res, result.products, result.pagination);
  } catch (err) {
    console.error(`[API] GET /api/v1/products FAILED in ${Date.now() - startTime}ms: ${err.message}`);
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    return success(res, product);
  } catch (err) {
    next(err);
  }
};

const getPriceHistory = async (req, res, next) => {
  try {
    const history = await productService.getPriceHistory(req.params.id);
    return success(res, history);
  } catch (err) {
    next(err);
  }
};

const listStores = async (_req, res, next) => {
  try {
    const stores = await productService.getStores();
    return success(res, stores);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, getPriceHistory, listStores };
