const cheerio = require('cheerio');
const { extractImage } = require('../shared/imageUtils');

const SEARCH_URL_TEMPLATE = 'https://www.bestbuy.com/site/searchpage.jsp?st={query}&_dyncharset=UTF-8&id=pcat17071&type=page';

const buildSearchUrl = (query) => {
  return SEARCH_URL_TEMPLATE.replace('{query}', encodeURIComponent(query));
};

const parseSearchResults = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $('[class*="list-item"], .product-item, [class*="product"], .sku-item').each((_, element) => {
    try {
      const $el = $(element);

      const nameEl = $el.find('[class*="title"] a, h4 a, a[class*="title"], .product-title a');
      let name = nameEl.text().trim();
      let url = nameEl.attr('href') || '';

      if (!name) {
        const altEl = $el.find('a[class*="name"], a[href*="/site/"]').first();
        name = altEl.text().trim();
        url = altEl.attr('href') || url;
      }
      if (!name) return;

      if (url && !url.startsWith('http')) {
        url = 'https://www.bestbuy.com' + (url.startsWith('/') ? url : '/' + url);
      }

      const imageUrl = extractImage($el);

      let currentPrice = null;
      const priceEl = $el.find('[class*="price"], .price, [class*="pricing"]');
      const priceText = priceEl.first().text().trim();
      const match = priceText.match(/\$[\s]*([\d,]+(?:\.\d{2})?)/);
      if (match) {
        const parsed = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
      }

      if (!currentPrice) {
        const allText = $el.text();
        const match2 = allText.match(/\$[\s]*([\d,]+(?:\.\d{2})?)/);
        if (match2) {
          const parsed = parseFloat(match2[1].replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) currentPrice = parsed;
        }
      }

      if (!currentPrice || currentPrice <= 0) return;

      let originalPrice = null;
      const oldPriceEl = $el.find('[class*="savings"], [class*="original"], [class*="was"], .regular-price');
      if (oldPriceEl.length) {
        const oldText = oldPriceEl.first().text().trim();
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
        store: 'Best Buy',
        currency: 'USD',
      });
    } catch (err) {
    }
  });

  return products;
};

module.exports = { buildSearchUrl, parseSearchResults };
