const { searchAll, searchProducts } = require('./mercadolibre.service');
const { mapProducts, mapProduct } = require('./mercadolibre.mapper');

module.exports = { searchAll, searchProducts, mapProducts, mapProduct };
