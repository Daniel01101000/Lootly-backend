const cheerio = require('cheerio');
const { extractImage } = require('../shared/imageUtils');

const SEARCH_URL_TEMPLATE = 'https://www.amazon.com.mx/s?k={query}';

const buildSearchUrl = (query) => {
  return SEARCH_URL_TEMPLATE.replace('{query}', encodeURIComponent(query));
};

const parseSearchResults = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $('div[data-component-type="s-search-result"]').each((_, element) => {
    try {
      const $el = $(element);

      let name = '';
      const nameSpan = $el.find('h2 a span, h2 span').first();
      if (nameSpan.length) {
        name = nameSpan.text().trim();
      }
      if (!name) {
        const nameDirect = $el.find('h2').first();
        if (nameDirect.length) name = nameDirect.text().trim();
      }
      if (!name) return;

      let url = '';
      const productLink = $el.find('a[href*="/dp/"]').first();
      if (productLink.length) {
        url = productLink.attr('href') || '';
      }
      if (!url || url === '#') {
        const asin = $el.attr('data-asin');
        if (asin) url = `/dp/${asin}`;
      }
      if (url && !url.startsWith('http')) {
        url = 'https://www.amazon.com.mx' + url;
      }

      const imageUrl = extractImage($el);

      let currentPrice = 0;
      const priceWhole = $el.find('.a-price-whole').first().text().trim();
      const priceFraction = $el.find('.a-price-fraction').first().text().trim();
      if (priceWhole) {
        const priceText = priceWhole + (priceFraction ? '.' + priceFraction : '');
        currentPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      }
      if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) return;

      let originalPrice = null;
      const strikeEl = $el.find('.a-text-price span.a-offscreen').first();
      if (strikeEl.length) {
        const strikeText = strikeEl.text().trim();
        originalPrice = parseFloat(strikeText.replace(/[^0-9.,]/g, '').replace(',', '.'));
      }

      products.push({
        name,
        currentPrice,
        originalPrice: originalPrice || undefined,
        imageUrl,
        url,
        store: 'Amazon México',
      });
    } catch (err) {
      console.warn(`[Amazon Parser] Skipping item: ${err.message}`);
    }
  });

  console.log(`[Amazon Parser] Parsed ${products.length} products from search results`);
  return products;
};

module.exports = { buildSearchUrl, parseSearchResults };
