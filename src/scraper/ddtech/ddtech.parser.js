const cheerio = require('cheerio');
const { extractImage } = require('../shared/imageUtils');

const SEARCH_URL_TEMPLATE = 'https://ddtech.mx/busqueda?q={query}';

const buildSearchUrl = (query) => {
  return SEARCH_URL_TEMPLATE.replace('{query}', encodeURIComponent(query));
};

const parseSearchResults = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $('.product-item, .product, [class*="producto"], article').each((_, element) => {
    try {
      const $el = $(element);

      const nameEl = $el.find('.product-name, h2 a, .nombre a, [class*="nombre"] a, h3 a');
      let name = nameEl.text().trim();
      let url = nameEl.attr('href') || '';

      if (!name) {
        const altNameEl = $el.find('a[class*="name"], a[class*="titulo"]');
        name = altNameEl.text().trim();
        url = altNameEl.attr('href') || url;
      }

      if (!name) return;

      if (url && !url.startsWith('http')) {
        url = 'https://ddtech.mx' + (url.startsWith('/') ? url : '/' + url);
      }

      const imageUrl = extractImage($el);

      const priceEl = $el.find('.price, [class*="precio"], .precio-actual, [class*="price"]');
      let currentPrice = null;
      const priceText = priceEl.first().text().trim();
      if (priceText) {
        const cleaned = priceText.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
      }

      if (!currentPrice) {
        const altPrice = $el.find('.precio, .product-price').first().text().trim();
        if (altPrice) {
          const cleaned = altPrice.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
        }
      }

      if (!currentPrice || currentPrice <= 0) return;

      let originalPrice = null;
      const oldPriceEl = $el.find('.old-price, .precio-anterior, [class*="old"], [class*="anterior"]');
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
        store: 'DDTech',
      });
    } catch (err) {
    }
  });

  return products;
};

module.exports = { buildSearchUrl, parseSearchResults };
