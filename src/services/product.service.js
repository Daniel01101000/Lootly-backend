const productModel = require('../models/product.model');
const priceHistoryModel = require('../models/priceHistory.model');
const ApiError = require('../utils/ApiError');

const list = async (filters) => {
  return productModel.findAll(filters);
};

const getById = async (id) => {
  const product = await productModel.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const getPriceHistory = async (productId) => {
  const product = await productModel.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  return priceHistoryModel.findByProduct(productId);
};

const getStores = async () => {
  return productModel.getStores();
};

const createOrUpdate = async (productData) => {
  if (productData.url) {
    const existing = await productModel.findByUrl(productData.url);
    if (existing) {
      if (existing.current_price !== productData.currentPrice) {
        console.log(`[SAVE] Updating price for "${productData.name.substring(0, 40)}..." (cat: ${existing.category}, store: ${existing.store})`);
        await productModel.updatePrice(existing.id, productData.currentPrice);
        await priceHistoryModel.record(existing.id, productData.currentPrice);
      }
      return productModel.findById(existing.id);
    }
  }

  const product = await productModel.create(productData);
  console.log(`[SAVE] Created product "${productData.name.substring(0, 40)}..." → category: "${productData.category}", store: "${productData.store}", url: "${(productData.url || 'NONE').substring(0, 60)}"`);
  await priceHistoryModel.record(product.id, productData.currentPrice);
  return product;
};

module.exports = { list, getById, getPriceHistory, getStores, createOrUpdate };
