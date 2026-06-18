const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const CATEGORY_KEYWORDS = [
  { keywords: ['tarjeta de video', 'tarjeta grafica', 'rtx', 'gtx', 'radeon', 'gpu', 'geforce'], category: 'gpu' },
  { keywords: ['procesador', 'ryzen', 'intel core', 'cpu', 'core i5', 'core i7', 'core i9'], category: 'cpu' },
  { keywords: ['monitor', 'pantalla', '144hz', '165hz', '240hz', 'gaming monitor'], category: 'monitor' },
  { keywords: ['teclado', 'keyboard', 'mecanico', 'gaming keyboard'], category: 'keyboard' },
  { keywords: ['mouse', 'raton', 'gaming mouse'], category: 'mouse' },
  { keywords: ['laptop', 'notebook', 'gaming laptop', 'laptop gamer'], category: 'laptop' },
  { keywords: ['audifonos', 'headset', 'auriculares', 'casco gamer'], category: 'headset' },
  { keywords: ['silla gamer', 'escritorio gamer', 'mesa gamer', 'gaming chair'], category: 'component' },
  { keywords: ['ssd', 'nvme', 'disco duro', 'almacenamiento'], category: 'component' },
  { keywords: ['memoria ram', 'ddr4', 'ddr5', 'ram gamer'], category: 'component' },
  { keywords: ['fuente de poder', 'psu', 'fuente gamer'], category: 'component' },
  { keywords: ['motherboard', 'tarjeta madre', 'placa base'], category: 'component' },
  { keywords: ['consola', 'playstation', 'xbox', 'nintendo switch'], category: 'console' },
  { keywords: ['videojuego', 'juego ps5', 'juego xbox'], category: 'games' },
  { keywords: ['celular', 'smartphone', 'galaxy', 'iphone', 'xiaomi', 'redmi', 'motorola moto'], category: 'phone' },
  { keywords: ['refrigerador', 'frigobar', 'lavadora', 'microondas', 'licuadora', 'aspiradora', 'estufa', 'horno'], category: 'appliance' },
];

function inferCategory(title) {
  const lower = title.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) return entry.category;
    }
  }
  return null;
}

async function scrapePage(browser, pageNum) {
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1366, height: 900 });

  const url = pageNum === 1
    ? 'https://www.mercadolibre.com.mx/ofertas'
    : `https://www.mercadolibre.com.mx/ofertas?page=${pageNum}`;

  console.log(`[Scraper] Navegando a: ${url}`);

  const results = [];

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.poly-card', { timeout: 15000 }).catch(() => null);

    const items = await page.evaluate(() => {
      const cards = document.querySelectorAll('.poly-card');
      const data = [];

      cards.forEach((card) => {
        try {
          const titleEl = card.querySelector('.poly-component__title');
          const title = titleEl?.textContent?.trim();
          const linkEl = card.querySelector('a.poly-component__title');
          const url = linkEl?.href || card.querySelector('a')?.href;

          const currentPriceEl = card.querySelector('.poly-price__current .andes-money-amount__fraction');
          const currentPrice = currentPriceEl?.textContent?.replace(/\D/g, '');

          const originalPriceContainer = card.querySelector('.andes-money-amount--previous');
          const originalPriceEl = originalPriceContainer?.querySelector('.andes-money-amount__fraction');
          const originalPrice = originalPriceEl?.textContent?.replace(/\D/g, '');

          const discountEl = card.querySelector('.andes-money-amount__discount');
          const discountText = discountEl?.textContent?.replace(/\D/g, '');

          const imgEl = card.querySelector('.poly-component__picture');
          const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src');

          if (title && currentPrice && url) {
            data.push({
              title,
              url,
              currentPrice: Number(currentPrice),
              originalPrice: originalPrice ? Number(originalPrice) : null,
              discount: discountText ? Number(discountText) : null,
              imageUrl,
            });
          }
        } catch (e) {
          // skip card si falla el parseo individual
        }
      });

      return data;
    });

    console.log(`[Scraper] Página ${pageNum} → ${items.length} items encontrados`);

    for (const item of items) {
      const discount = item.discount || (item.originalPrice
        ? Math.round((1 - item.currentPrice / item.originalPrice) * 100)
        : 0);

      if (!item.originalPrice || discount < 10) continue;

      const category = inferCategory(item.title);
      if (!category) continue;

      results.push({
        name: item.title,
        image_url: item.imageUrl,
        current_price: item.currentPrice,
        original_price: item.originalPrice,
        discount,
        url: item.url,
        store: 'Mercado Libre',
        category,
        currency: 'MXN',
      });
    }
  } catch (err) {
    console.warn(`[Scraper] Error en página ${pageNum}: ${err.message}`);
  } finally {
    await page.close();
  }

  return results;
}

async function scrapeAllDeals() {
  console.log('[Scraper] Iniciando navegador...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allDeals = [];

  for (let pageNum = 1; pageNum <= 5; pageNum++) {
    const deals = await scrapePage(browser, pageNum);
    allDeals.push(...deals);
    console.log(`[Scraper] Página ${pageNum} → ${deals.length} ofertas con descuento`);
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
