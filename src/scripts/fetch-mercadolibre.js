require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lootly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const TOKEN_URL = 'https://mnfapp.ath.cx/pruebas/mercadolibre/token.json';

const QUERIES = [
  { q: 'tarjeta de video gaming RTX AMD', category: 'gpu' },
  { q: 'procesador gaming AMD Ryzen Intel Core', category: 'cpu' },
  { q: 'memoria RAM DDR4 DDR5 gaming', category: 'component' },
  { q: 'SSD NVMe M2 gaming', category: 'component' },
  { q: 'monitor gamer 144hz 165hz 240hz', category: 'monitor' },
  { q: 'teclado mecanico gamer RGB', category: 'keyboard' },
  { q: 'mouse gamer inalambrico RGB', category: 'mouse' },
  { q: 'laptop gamer RTX 4060 4070', category: 'laptop' },
  { q: 'audifonos gamer diadema inalambrico', category: 'headset' },
  { q: 'silla gamer ergonomica', category: 'component' },
  { q: 'fuente de poder modular 80 plus gaming', category: 'component' },
  { q: 'gabinete PC gamer RGB', category: 'component' },
];

async function getToken() {
  const res = await fetch(TOKEN_URL);
  if (!res.ok) throw new Error('No se pudo obtener el token de ML');
  const data = await res.json();
  console.log('[ML] Token obtenido OK');
  return data.access_token;
}

async function searchProducts(token, query, category) {
  const url = `https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(query)}&discount=10-100&limit=50`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    console.warn(`[ML] Error ${res.status} para "${query}"`);
    return [];
  }
  const data = await res.json();
  return (data.results || []).map(item => ({ ...item, _category: category }));
}

async function run() {
  const token = await getToken();
  let inserted = 0;
  let skipped = 0;

  for (const { q, category } of QUERIES) {
    console.log(`[ML] Buscando: "${q}"...`);
    const items = await searchProducts(token, q, category);

    for (const item of items) {
      if (!item.original_price) { skipped++; continue; }
      const discount = Math.round((1 - item.price / item.original_price) * 100);
      if (discount < 10) { skipped++; continue; }

      const imageUrl = (item.thumbnail || '')
        .replace('http://', 'https://')
        .replace('I.jpg', 'O.jpg');

      try {
        const result = await pool.query(`
          INSERT INTO products (name, image_url, current_price, original_price, store, category, url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (url) DO UPDATE SET
            current_price = EXCLUDED.current_price,
            original_price = EXCLUDED.original_price,
            image_url = EXCLUDED.image_url,
            updated_at = NOW()
          RETURNING id
        `, [
          item.title,
          imageUrl,
          item.price,
          item.original_price,
          'Mercado Libre',
          item._category,
          item.permalink,
        ]);
        if (result.rows.length > 0) inserted++;
      } catch (err) {
        console.warn(`[ML] No se insertó "${item.title}": ${err.message}`);
      }
    }

    console.log(`[ML] "${q}" → ${items.length} encontrados`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n[ML] Proceso completo`);
  console.log(`[ML] Insertados/actualizados: ${inserted}`);
  console.log(`[ML] Saltados (sin descuento): ${skipped}`);

  const { rows } = await pool.query(`SELECT COUNT(*) FROM products WHERE store = 'Mercado Libre'`);
  console.log(`[ML] Total en DB ahora: ${rows[0].count} productos de Mercado Libre`);

  await pool.end();
}

run().catch(err => {
  console.error('[ML] Error fatal:', err.message);
  process.exit(1);
});
