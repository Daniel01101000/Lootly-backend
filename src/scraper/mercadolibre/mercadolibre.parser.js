const cheerio = require('cheerio');

const SEARCH_URL_TEMPLATE = 'https://listado.mercadolibre.com.mx/{query}';

const buildSearchUrl = (query) => {
  return SEARCH_URL_TEMPLATE.replace('{query}', encodeURIComponent(query));
};

const parseSearchResults = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $('ol.ui-search-layout li.ui-search-layout__item').each((_, element) => {
    try {
      const $el = $(element);

      const nameEl = $el.find('h2.poly-box a.poly-component__title, .poly-component__title');
      const name = nameEl.text().trim();
      if (!name) return;

      const linkEl = $el.find('a.poly-component__title').first();
      let url = linkEl.attr('href') || '';
      if (url && !url.startsWith('http')) {
        url = 'https://www.mercadolibre.com.mx' + url;
      }

      const imageEl = $el.find('img.poly-component__picture, img[data-src], img[src]').first();
      const imageUrl = imageEl.attr('data-src') || imageEl.attr('src') || null;

      const priceEl = $el.find('.andes-money-amount__fraction').first();
      const priceText = priceEl.text().trim();
      const currentPrice = parseFloat(priceText.replace(/[^0-9]/g, ''));

      let originalPrice = null;
      const oldPriceEl = $el.find('s.andes-money-amount--previous .andes-money-amount__fraction');
      if (oldPriceEl.length) {
        const oldText = oldPriceEl.text().trim();
        originalPrice = parseFloat(oldText.replace(/[^0-9]/g, ''));
      }

      if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) return;

      products.push({
        name,
        currentPrice,
        originalPrice: originalPrice || undefined,
        imageUrl,
        url,
        store: 'Mercado Libre',
      });
    } catch (err) {
      console.warn(`[ML Parser] Skipping item: ${err.message}`);
    }
  });

  return products;
};

const API_URL_TEMPLATE = 'https://api.mercadolibre.com/sites/MLM/search?q={query}&limit=20';

const buildApiUrl = (query) => {
  return API_URL_TEMPLATE.replace('{query}', encodeURIComponent(query));
};

const parseApiResponse = (json) => {
  const products = [];

  if (!json || !json.results || !Array.isArray(json.results)) {
    console.warn(`[ML API Parser] Invalid API response`);
    return products;
  }

  for (const item of json.results) {
    try {
      const name = item.title?.trim();
      if (!name) continue;

      const currentPrice = item.price;
      if (!currentPrice || currentPrice <= 0) continue;

      const originalPrice = item.original_price || null;

      let imageUrl = null;
      if (item.thumbnail) {
        imageUrl = item.thumbnail.replace('-I.jpg', '-O.jpg');
      }
      if (!imageUrl && item.pictures && item.pictures.length > 0) {
        imageUrl = item.pictures[0].url;
      }

      let url = item.permalink || null;
      if (!url) {
        url = `https://www.mercadolibre.com.mx/item/${item.id}`;
      }

      products.push({
        name,
        currentPrice,
        originalPrice: originalPrice > currentPrice ? originalPrice : undefined,
        imageUrl,
        url,
        store: 'Mercado Libre',
        currency: item.currency_id || 'MXN',
        description: null,
        rating: item.seller?.seller_reputation?.transactions?.total || null,
      });
    } catch (err) {
      console.warn(`[ML API Parser] Skipping item: ${err.message}`);
    }
  }

  return products;
};

module.exports = { buildSearchUrl, buildApiUrl, parseSearchResults, parseApiResponse };
