const BaseScraper = require('./base.scraper');
const { normalizeProduct, detectCategory, parsePrice } = require('./productNormalizer');

module.exports = {
  BaseScraper,
  normalizeProduct,
  detectCategory,
  parsePrice,
};
