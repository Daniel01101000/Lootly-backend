const axios = require('axios');
const { getAccessToken } = require('./mercadolibre.auth');

const ML_BASE = 'https://api.mercadolibre.com';
const TIMEOUT = 15000;
const MIN_REQUEST_INTERVAL = 150;

let lastRequestTime = 0;

const rateLimit = async () => {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();
};

const SEARCH_QUERIES = [
  { q: 'tarjeta de video gaming rtx', category: 'gpu' },
  { q: 'procesador gaming amd ryzen intel core', category: 'cpu' },
  { q: 'monitor gamer 144hz curvo', category: 'monitor' },
  { q: 'teclado mecanico gamer rgb', category: 'keyboard' },
  { q: 'mouse gamer inalambrico rgb', category: 'mouse' },
  { q: 'laptop gamer rtx ryzen', category: 'laptop' },
  { q: 'audifonos gamer diadema rgb', category: 'headset' },
  { q: 'silla gamer ergonomica', category: 'component' },
  { q: 'memoria ram ddr4 ddr5 gaming', category: 'component' },
  { q: 'ssd nvme m2 gaming', category: 'component' },
];

const mlGet = async (url) => {
  await rateLimit();
  const token = await getAccessToken();
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: TIMEOUT,
  });
  return response.data;
};

const searchProducts = async (query, category) => {
  try {
    const url = `${ML_BASE}/sites/MLM/search?q=${encodeURIComponent(query)}&discount=10-100&limit=50`;
    const data = await mlGet(url);

    if (!data?.results?.length) {
      console.log(`[ML API] Sin resultados para "${query}"`);
      return [];
    }

    console.log(`[ML API] ${data.results.length} resultados para "${query}"`);
    return data.results.map(p => ({ ...p, _forcedCategory: category }));
  } catch (err) {
    console.error(`[ML API] Error en "${query}": ${err.message}`);
    return [];
  }
};

const searchAll = async () => {
  console.log('[ML API] Iniciando búsqueda de productos gamer en oferta...');
  const allResults = [];

  for (const { q, category } of SEARCH_QUERIES) {
    const results = await searchProducts(q, category);
    allResults.push(...results);
  }

  console.log(`[ML API] Total productos crudos: ${allResults.length}`);
  return allResults;
};

module.exports = { searchProducts, searchAll };
