const cheerio = require('cheerio');
const { extractImage } = require('../shared/imageUtils');

const SEARCH_URL_TEMPLATE = 'https://zegucom.com.mx/busqueda?q={query}';

const buildSearchUrl = (query) => {
  return SEARCH_URL_TEMPLATE.replace('{query}', encodeURIComponent(query));
};

const parseSearchResults = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $('.product, .item, [class*="producto"], article, .product-item, .grid-item').each((_, element) => {
    try {
      const $el = $(element);

      const nameEl = $el.find('.name a, .product-name a, h2 a, h3 a, a[class*="name"], a[class*="title"]');
      let name = nameEl.text().trim();
      let url = nameEl.attr('href') || '';

      if (!name) return;

      if (url && !url.startsWith('http')) {
        url = 'https://zegucom.com.mx' + (url.startsWith('/') ? url : '/' + url);
      }

      const imageUrl = extractImage($el);

      let currentPrice = null;
      const priceEl = $el.find('.price, .precio, .product-price, [class*="precio-actual"]');
      const priceText = priceEl.first().text().trim();
      if (priceText) {
        const cleaned = priceText.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
      }

      if (!currentPrice) {
        const allText = $el.text();
        const match = allText.match(/\$[\s]*([\d,]+(?:\.\d{2})?)/);
        if (match) {
          const parsed = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
        }
      }

      if (!currentPrice || currentPrice <= 0) return;

      let originalPrice = null;
      const oldPriceEl = $el.find('.old-price, .precio-anterior, [class*="old"], [class*="anterior"], s');
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
        store: 'Zegucom',
      });
    } catch (err) {
    }
  });

  return products;
};

module.exports = { buildSearchUrl, parseSearchResults };
