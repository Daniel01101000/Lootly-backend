const cheerio = require('cheerio');
const { extractImage } = require('../shared/imageUtils');

const SEARCH_URL_TEMPLATE = 'https://www.cyberpuerta.mx/index.php?route=product/search&search={query}';

const buildSearchUrl = (query) => {
  return SEARCH_URL_TEMPLATE.replace('{query}', encodeURIComponent(query));
};

const parseSearchResults = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $('.product-layout, .product-grid, .product-thumb, [class*="producto"], .item').each((_, element) => {
    try {
      const $el = $(element);

      const nameEl = $el.find('.name a, .caption a, h4 a, .product-name a');
      let name = nameEl.text().trim();
      let url = nameEl.attr('href') || '';

      if (!name) {
        const altEl = $el.find('a[class*="title"], a[class*="name"]');
        name = altEl.text().trim();
        url = altEl.attr('href') || url;
      }
      if (!name) return;

      if (url && !url.startsWith('http')) {
        url = 'https://www.cyberpuerta.mx' + (url.startsWith('/') ? url : '/' + url);
      }

      const imageUrl = extractImage($el);

      const priceEl = $el.find('.price, .price-new, [class*="precio"]');
      let currentPrice = null;
      const priceText = priceEl.first().text().trim();
      if (priceText) {
        const cleaned = priceText.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
      }

      if (!currentPrice) {
        const altPrice = $el.find('.product-price, .precio').first().text().trim();
        if (altPrice) {
          const cleaned = altPrice.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
        }
      }

      if (!currentPrice || currentPrice <= 0) return;

      let originalPrice = null;
      const oldPriceEl = $el.find('.price-old, .old-price, [class*="old"], [class*="anterior"]');
      if (oldPriceEl.length) {
        const oldText = oldPriceEl.first().text().trim();
        if (oldText) {
          const cleaned = oldText.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed) && parsed > currentPrice) originalPrice = parsed;
        }
      }

      products.push({
        name,
        currentPrice,
        originalPrice: originalPrice || undefined,
        imageUrl,
        url: url || null,
        store: 'CyberPuerta',
      });
    } catch (err) {
    }
  });

  return products;
};

module.exports = { buildSearchUrl, parseSearchResults };
