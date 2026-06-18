const BaseScraper = require('../shared/base.scraper');
const { normalizeProduct } = require('../shared/productNormalizer');

const SPECIALS_URL = 'https://store.steampowered.com/specials?cc=MX&l=spanish';

class SteamScraper extends BaseScraper {
  constructor() {
    super('Steam', 'https://store.steampowered.com');
    this.maxProducts = 50;
    this._browser = null;
  }

  async searchProducts({ category } = {}) {
    console.log(`[STEAM] ==============================================`);
    console.log(`[STEAM] INICIANDO SCRAPER DOM REAL - Steam /specials`);
    console.log(`[STEAM] ==============================================`);

    const deals = await this._scrapeSpecials(category || 'games');

    console.log(`[STEAM] ==============================================`);
    console.log(`[STEAM] FINAL: ${deals.length} ofertas reales con descuento`);
    console.log(`[STEAM] ==============================================`);

    return deals.slice(0, this.maxProducts);
  }

  async _ensureBrowser() {
    if (!this._browser || !this._browser.isConnected()) {
      const { chromium } = require('playwright');
      this._browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }
    return this._browser;
  }

  async _scrapeSpecials(category) {
    let context = null;

    try {
      const browser = await this._ensureBrowser();
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'es-MX',
      });

      const page = await context.newPage();

      console.log(`[STEAM] Abriendo: ${SPECIALS_URL}`);
      await page.goto(SPECIALS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log(`[STEAM] Página cargada. Esperando renderizado JS...`);

      try {
        const acceptBtn = await page.waitForSelector('button:has-text("Aceptar"), button:has-text("Accept"), .cookie_policy_button', { timeout: 3000 });
        if (acceptBtn) {
          await acceptBtn.click();
          console.log(`[STEAM] Consentimiento aceptado`);
          await page.waitForTimeout(1000);
        }
      } catch (_) {}

      await page.waitForTimeout(5000);

      // Scroll to trigger lazy loading (multiple passes)
      console.log(`[STEAM] Cargando ofertas vía scroll (puede tomar unos segundos)...`);
      const scrollToBottom = async () => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
      };
      const scrollDown = async () => {
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(400);
      };

      // Pass 1: fast scroll to bottom
      for (let i = 0; i < 15; i++) { await scrollDown(); }
      await scrollToBottom();
      await page.waitForTimeout(2000);

      // Pass 2: slower scroll
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollBy(0, 900));
        await page.waitForTimeout(1000);
      }
      await scrollToBottom();
      await page.waitForTimeout(2000);

      // Pass 3: bottom to top for any remaining lazy loads
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, -600));
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(2000);

      // Final: scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1500);

      // ===================================================================
      // EXTRACCIÓN: StoreSalePriceWidgetContainer → game link → data
      // ===================================================================
      const raw = await page.evaluate(() => {
        const results = [];
        const seenAppIds = new Set();
        let totalContainers = 0;
        let skippedNoPct = 0;
        let skippedNoPrices = 0;
        let skippedNoLink = 0;
        let skippedNoTitle = 0;
        let skippedNoImage = 0;
        let skippedDup = 0;
        let skippedInvalid = 0;

        const parsePrice = (t) => {
          if (!t) return null;
          let c = t.trim().replace(/^[A-Za-z$\s]+/, '').replace(/,/g, '').trim();
          if (!c) return null;
          const p = parseFloat(c);
          return (!isNaN(p) && p > 0) ? Math.round(p * 100) / 100 : null;
        };

        const findGameLink = (container) => {
          let el = container.parentElement;
          for (let d = 0; d < 15 && el && el !== document.body; d++) {
            const links = el.querySelectorAll('a[href*="/app/"]');
            for (const link of links) {
              const href = link.getAttribute('href') || '';
              if (!href.includes('#app_reviews_hash')) {
                const match = href.match(/\/app\/(\d+)/);
                if (match) return { link, appId: match[1], href };
              }
            }
            el = el.parentElement;
          }
          return null;
        };

        const containers = document.querySelectorAll('.StoreSalePriceWidgetContainer');
        totalContainers = containers.length;

        containers.forEach(container => {
          try {
            const priceText = container.textContent.trim();

            const pctMatch = priceText.match(/-(\d+)%/);
            if (!pctMatch) { skippedNoPct++; return; }
            const discountPercent = parseInt(pctMatch[1], 10);
            if (discountPercent <= 0 || discountPercent > 100) { skippedInvalid++; return; }

            const priceNumbers = [];
            const priceMatches = [...priceText.matchAll(/(?:Mex\s*\$|\$)\s*([\d.,]+)/g)];
            priceMatches.forEach(m => {
              const c = m[1].replace(/,/g, '');
              const p = parseFloat(c);
              if (!isNaN(p) && p > 0) priceNumbers.push(p);
            });
            if (priceNumbers.length < 2) { skippedNoPrices++; return; }
            const sorted = [...priceNumbers].sort((a, b) => b - a);
            const originalPrice = sorted[0];
            const finalPrice = sorted[sorted.length - 1];
            if (finalPrice >= originalPrice) { skippedInvalid++; return; }

            const gameInfo = findGameLink(container);
            if (!gameInfo) { skippedNoLink++; return; }
            if (seenAppIds.has(gameInfo.appId)) { skippedDup++; return; }
            seenAppIds.add(gameInfo.appId);

            const { link, href, appId } = gameInfo;

            let title = '';
            const img = link.querySelector('img');
            if (img) title = img.getAttribute('alt') || '';
            if (!title) {
              const t = link.textContent.trim();
              if (t && t.length > 1 && t.length < 120 && !t.includes('reseña') && !t.includes('review')) {
                title = t;
              }
            }
            if (!title) {
              let el = link.parentElement;
              for (let d = 0; d < 8 && el && el !== document.body; d++) {
                const nearLinks = el.querySelectorAll(`a[href*="/app/${appId}"]`);
                for (const nl of nearLinks) {
                  if (nl === link) continue;
                  const t = nl.textContent.trim();
                  if (t && t.length > 1 && t.length < 120 && !t.includes('reseña') && !t.includes('review') && !t.includes('(')) {
                    title = t; break;
                  }
                }
                if (title) break;
                el = el.parentElement;
              }
            }
            if (!title) { skippedNoTitle++; return; }

            let imageUrl = '';
            if (img) imageUrl = img.getAttribute('src') || img.getAttribute('data-src') || '';
            if (!imageUrl) {
              let el = link.parentElement;
              for (let d = 0; d < 8 && el; d++) {
                const imgs = el.querySelectorAll('img');
                for (const i of imgs) {
                  const s = i.getAttribute('src') || '';
                  if (s && (s.includes('/apps/') || s.includes('capsule') || s.includes('hero'))) {
                    imageUrl = s; break;
                  }
                }
                if (imageUrl) break;
                el = el.parentElement;
              }
            }
            if (!imageUrl) { skippedNoImage++; return; }

            results.push({
              title,
              currentPrice: finalPrice,
              originalPrice,
              discountPercent,
              imageUrl,
              url: href,
              store: 'Steam',
              category: 'games',
            });
          } catch (e) {
            skippedInvalid++;
          }
        });

        return {
          deals: results,
          stats: {
            totalContainers, skippedNoPct, skippedNoPrices,
            skippedNoLink, skippedNoTitle, skippedNoImage,
            skippedDup, skippedInvalid,
            valid: results.length,
          },
        };
      });

      if (context) await context.close();

      // Stats
      const s = raw.stats;
      console.log(`[STEAM] Contenedores precio encontrados: ${s.totalContainers}`);
      console.log(`[STEAM]   Sin descuento: ${s.skippedNoPct}`);
      console.log(`[STEAM]   Sin precios: ${s.skippedNoPrices}`);
      console.log(`[STEAM]   Sin game link: ${s.skippedNoLink}`);
      console.log(`[STEAM]   Sin título: ${s.skippedNoTitle}`);
      console.log(`[STEAM]   Sin imagen: ${s.skippedNoImage}`);
      console.log(`[STEAM]   Duplicados: ${s.skippedDup}`);
      console.log(`[STEAM]   Inválidos: ${s.skippedInvalid}`);
      console.log(`[STEAM]   VÁLIDOS: ${s.valid}`);

      for (const d of raw.deals) {
        console.log(`[STEAM] Oferta: ${d.title} -${d.discountPercent}% | Mex$${d.originalPrice.toFixed(2)} → Mex$${d.currentPrice.toFixed(2)}`);
      }

      if (raw.deals.length === 0) {
        console.log(`[STEAM] ⚠ NO se encontraron ofertas en el DOM`);
        return [];
      }

      // Normalize
      const normalized = raw.deals
        .filter(d => {
          const valid = d.title && d.url && d.imageUrl &&
            d.currentPrice && d.originalPrice && d.discountPercent &&
            d.originalPrice > d.currentPrice && d.discountPercent > 0;
          if (!valid) console.log(`[STEAM] Ignorado: ${d.title} - validación falló`);
          return valid;
        })
        .map(d => normalizeProduct({
          name: d.title,
          currentPrice: d.currentPrice,
          originalPrice: d.originalPrice,
          discountPercent: d.discountPercent,
          imageUrl: d.imageUrl,
          url: d.url,
          store: 'Steam',
          category: category || 'games',
        }, 'Steam'))
        .filter(d => {
          if (!d) {
            console.log(`[STEAM] Ignorado - normalización falló`);
            return false;
          }
          return true;
        });

      console.log(`[STEAM] Ofertas finales: ${normalized.length}`);
      return normalized;

    } catch (err) {
      console.error(`[STEAM] ERROR: ${err.message}`);
      if (context) { try { await context.close(); } catch (_) {} }
      return [];
    }
  }
}

module.exports = SteamScraper;
