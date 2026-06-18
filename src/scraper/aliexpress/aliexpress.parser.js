const cheerio = require('cheerio');

const SEARCH_URL_TEMPLATE = 'https://www.aliexpress.com/wholesale?SearchText={query}';

const buildSearchUrl = (query) => {
  return SEARCH_URL_TEMPLATE.replace('{query}', encodeURIComponent(query));
};

const PRODUCT_CATEGORIES = [
  { category: 'gpu', queries: ['graphics+card+rtx', 'gpu+gaming', 'graphics+card+amd'] },
  { category: 'cpu', queries: ['cpu+processor+amd+ryzen', 'cpu+processor+intel', 'gaming+processor'] },
  { category: 'monitor', queries: ['gaming+monitor', 'monitor+144hz+gamer', 'monitor+gaming+4k'] },
  { category: 'keyboard', queries: ['mechanical+keyboard+gaming', 'gaming+keyboard+rgb'] },
  { category: 'mouse', queries: ['gaming+mouse', 'gaming+mouse+wireless', 'rgb+gaming+mouse'] },
  { category: 'laptop', queries: ['gaming+laptop', 'laptop+gamer+notebook'] },
  { category: 'console', queries: ['game+console', 'handheld+gaming+console', 'nintendo+switch'] },
  { category: 'games', queries: ['video+games', 'ps5+game', 'xbox+game'] },
  { category: 'component', queries: ['ssd+nvme+gaming', 'ram+ddr5+gaming', 'gaming+motherboard', 'gaming+power+supply'] },
];

const parseSearchResults = (html) => {
  const $ = cheerio.load(html);
  const products = [];

  $('div[class*="product-item"], div[class*="_1z5V"], div[class*="_1OU5"], div[class*="comet-v2-product-card"], div[class*="_1_pT"], div[class*="card"]').each((_, element) => {
    try {
      const $el = $(element);

      const nameEl = $el.find('a[class*="title"], a[class*="name"], h3[class*="title"], a[class*="product-title"]').first();
      const name = nameEl.text().trim();
      if (!name) return;

      const linkEl = $el.find('a[class*="title"], a[class*="name"], a[class*="product-title"], a[class*="card-link"]').first();
      let url = linkEl.attr('href') || '';
      if (url && !url.startsWith('http')) {
        url = 'https://www.aliexpress.com' + url;
      }

      const imageEl = $el.find('img[class*="image"], img[class*="pic"], img[class*="product-img"]').first();
      const imageUrl = imageEl.attr('src') || imageEl.attr('data-src') || imageEl.attr('data-sd') || null;

      const priceEl = $el.find('span[class*="price"], div[class*="price"], span[class*="current-price"]').first();
      const priceText = priceEl.text().trim();
      const currentPrice = parsePrice(priceText);

      let originalPrice = null;
      const oldPriceEl = $el.find('span[class*="original-price"], span[class*="old-price"], s span, del span').first();
      if (oldPriceEl.length) {
        originalPrice = parsePrice(oldPriceEl.text().trim());
      }

      if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) return;

      products.push({
        name,
        currentPrice,
        originalPrice: originalPrice || undefined,
        imageUrl,
        url,
        store: 'AliExpress',
      });
    } catch (err) {
      console.warn(`[AliExpress Parser] Skipping item: ${err.message}`);
    }
  });

  if (products.length === 0) {
    $('a[class*="_1k1I"], a[href*="item"], div[class*="item"]').each((_, element) => {
      try {
        const $el = $(element);
        const name = $el.attr('title') || $el.find('img').attr('alt') || '';
        if (!name) return;

        const url = $el.attr('href') || '';
        if (!url || !url.includes('/item/')) return;

        const img = $el.find('img').first();
        const imageUrl = img.attr('src') || img.attr('data-src') || null;

        const fullUrl = url.startsWith('http') ? url : 'https://www.aliexpress.com' + url;

        products.push({
          name: name.trim(),
          currentPrice: null,
          originalPrice: null,
          imageUrl,
          url: fullUrl,
          store: 'AliExpress',
        });
      } catch (err) {
        // silent
      }
    });
  }

  console.log(`[AliExpress Parser] Parsed ${products.length} products from search results`);
  return products;
};

const parsePlaywrightResults = (pageContent) => {
  return parseSearchResults(pageContent);
};

const parsePrice = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

module.exports = { buildSearchUrl, parseSearchResults, parsePlaywrightResults, PRODUCT_CATEGORIES };
