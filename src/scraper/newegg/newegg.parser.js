const cheerio = require('cheerio');
const { extractImage } = require('../shared/imageUtils');

const SEARCH_URL_TEMPLATE = 'https://www.newegg.com/p/pl?d={query}&N=4131';

const buildSearchUrl = (query) => {
  return SEARCH_URL_TEMPLATE.replace('{query}', encodeURIComponent(query));
};

const parseSearchResults = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $('.item-cell, .item-container, [class*="item"], .product-item').each((_, element) => {
    try {
      const $el = $(element);

      const nameEl = $el.find('a.item-title, .product-title a, a[class*="title"]');
      let name = nameEl.text().trim();
      let url = nameEl.attr('href') || '';

      if (!name) {
        const altEl = $el.find('a[class*="description"], a[href*="/p/"]');
        name = altEl.text().trim();
        url = altEl.attr('href') || url;
      }
      if (!name) return;

      if (url && !url.startsWith('http')) {
        url = 'https://www.newegg.com' + (url.startsWith('/') ? url : '/' + url);
      }

      const imageUrl = extractImage($el);

      let currentPrice = null;

      const priceCurrent = $el.find('.price-current');
      if (priceCurrent.length) {
        const strong = priceCurrent.find('strong').text().trim();
        const sup = priceCurrent.find('sup').text().trim();
        if (strong) {
          const cleaned = (strong + '.' + sup).replace(/[^0-9.]/g, '');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
        }
      }

      if (!currentPrice) {
        const priceText = $el.find('.price, [class*="price"]').first().text().trim();
        const match = priceText.match(/\$[\s]*([\d,]+(?:\.\d{2})?)/);
        if (match) {
          const parsed = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
        }
      }

      if (!currentPrice || currentPrice <= 0) return;

      let originalPrice = null;
      const priceOld = $el.find('.price-was, .price-old, .was-price');
      if (priceOld.length) {
        const oldText = priceOld.first().text().trim();
        const match = oldText.match(/\$[\s]*([\d,]+(?:\.\d{2})?)/);
        if (match) {
          const parsed = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > currentPrice) originalPrice = parsed;
        }
      }

      products.push({
        name,
        currentPrice,
        originalPrice: originalPrice || undefined,
        imageUrl,
        url: url || null,
        store: 'Newegg',
        currency: 'USD',
      });
    } catch (err) {
    }
  });

  return products;
};

module.exports = { buildSearchUrl, parseSearchResults };
