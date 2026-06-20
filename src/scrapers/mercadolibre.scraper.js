const puppeteerCore = require('puppeteer-core');

async function getBrowser() {
  if (process.env.NODE_ENV === 'production') {
    const chromium = require('@sparticuz/chromium');
    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    const puppeteerExtra = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteerExtra.use(StealthPlugin());
    return puppeteerExtra.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return rawUrl;
  }
}

const SEARCH_QUERIES = [
  { q: 'tarjeta de video gaming rtx', category: 'gpu' },
  { q: 'procesador gaming amd ryzen intel', category: 'cpu' },
  { q: 'monitor gamer 144hz', category: 'monitor' },
  { q: 'teclado mecanico gamer', category: 'keyboard' },
  { q: 'mouse gamer inalambrico', category: 'mouse' },
  { q: 'laptop gamer rtx', category: 'laptop' },
  { q: 'audifonos gamer', category: 'headset' },
  { q: 'silla gamer', category: 'component' },
  { q: 'ssd nvme gaming', category: 'component' },
  { q: 'memoria ram gaming', category: 'component' },
];

function buildSearchUrl(query) {
  const slug = query.trim().toLowerCase().replace(/\s+/g, '-');
  return `https://listado.mercadolibre.com.mx/${encodeURIComponent(slug)}`;
}

async function scrapeQuery(browser, query, category) {
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1366, height: 900 });

  const url = buildSearchUrl(query);
  console.log(`[Scraper] Navegando a: ${url}`);

  const results = [];

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.poly-card, .ui-search-layout__item', { timeout: 15000 }).catch(() => null);

    const items = await page.evaluate(() => {
      const cards = document.querySelectorAll('.poly-card, .ui-search-layout__item');
      const data = [];

      cards.forEach((card) => {
        try {
          const titleEl = card.querySelector('.poly-component__title, .ui-search-item__title');
          const title = titleEl?.textContent?.trim();
          const linkEl = card.querySelector('a.poly-component__title, a');
          const url = linkEl?.href;

          const currentPriceEl = card.querySelector('.poly-price__current .andes-money-amount__fraction, .price-tag-fraction');
          const currentPrice = currentPriceEl?.textContent?.replace(/\D/g, '');

          const originalPriceContainer = card.querySelector('.andes-money-amount--previous');
          const originalPriceEl = originalPriceContainer?.querySelector('.andes-money-amount__fraction');
          const originalPrice = originalPriceEl?.textContent?.replace(/\D/g, '');

          const discountEl = card.querySelector('.andes-money-amount__discount');
          const discountText = discountEl?.textContent?.replace(/\D/g, '');

          const imgEl = card.querySelector('.poly-component__picture, img');
          const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src');

          if (title && currentPrice && url) {
            data.push({
              title, url,
              currentPrice: Number(currentPrice),
              originalPrice: originalPrice ? Number(originalPrice) : null,
              discount: discountText ? Number(discountText) : null,
              imageUrl,
            });
          }
        } catch (e) {}
      });

      return data;
    });

    console.log(`[Scraper] "${query}" → ${items.length} items encontrados`);

    for (const item of items) {
      const discount = item.discount || (item.originalPrice
        ? Math.round((1 - item.currentPrice / item.originalPrice) * 100)
        : 0);
      if (!item.originalPrice || discount < 10) continue;

      results.push({
        name: item.title,
        image_url: item.imageUrl,
        current_price: item.currentPrice,
        original_price: item.originalPrice,
        discount,
        url: normalizeUrl(item.url),
        store: 'Mercado Libre',
        category,
        currency: 'MXN',
      });
    }
  } catch (err) {
    console.warn(`[Scraper] Error en "${query}": ${err.message}`);
  } finally {
    await page.close();
  }

  return results;
}

async function scrapeAllDeals() {
  console.log('[Scraper] Iniciando navegador...');
  const browser = await getBrowser();

  const allDeals = [];

  for (const { q, category } of SEARCH_QUERIES) {
    const deals = await scrapeQuery(browser, q, category);
    allDeals.push(...deals);
    console.log(`[Scraper] "${q}" → ${deals.length} ofertas con descuento`);
    await new Promise((r) => setTimeout(r, 2500));
  }

  await browser.close();

  const seen = new Set();
  const unique = allDeals.filter((d) => {
    if (seen.has(d.url)) return false;
    seen.add(d.url);
    return true;
  });

  console.log(`[Scraper] ✅ Total ofertas únicas con descuento: ${unique.length}`);
  return unique;
}

module.exports = { scrapeAllDeals };
