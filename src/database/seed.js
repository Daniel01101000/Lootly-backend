const { query } = require('./connection');
const { v4: uuidv4 } = require('uuid');
const {
  gpu, keyboards, mice, monitors, laptops, consoles, mercadolibre,
  dellProducts, microCenterProducts, gogProducts, gameStopProducts,
  steelSeriesProducts, walmartProducts, lenovoProducts, hyperxProducts,
} = require('./seed-data');

const gameProducts = [
  {
    name: 'Cyberpunk 2077',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg',
    currentPrice: 29.99,
    originalPrice: 59.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/',
    rating: 4.6,
    stock: 999,
  },
  {
    name: 'Elden Ring',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg',
    currentPrice: 39.99,
    originalPrice: 59.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/1245620/Elden_Ring/',
    rating: 4.9,
    stock: 999,
  },
  {
    name: 'Hades',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg',
    currentPrice: 12.49,
    originalPrice: 24.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/1145360/Hades/',
    rating: 4.8,
    stock: 999,
  },
  {
    name: 'Red Dead Redemption 2',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg',
    currentPrice: 29.99,
    originalPrice: 59.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/',
    rating: 4.7,
    stock: 999,
  },
  {
    name: 'Stardew Valley',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg',
    currentPrice: 9.99,
    originalPrice: 14.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/413150/Stardew_Valley/',
    rating: 4.8,
    stock: 999,
  },
  {
    name: 'Baldur\'s Gate 3',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg',
    currentPrice: 49.99,
    originalPrice: 59.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/1086940/Baldurs_Gate_3/',
    rating: 4.9,
    stock: 999,
  },
  {
    name: 'Hollow Knight',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg',
    currentPrice: 7.49,
    originalPrice: 14.99,
    store: 'GOG',
    category: 'games',
    url: 'https://www.gog.com/en/game/hollow_knight',
    rating: 4.7,
    stock: 999,
  },
  {
    name: 'The Witcher 3: Wild Hunt',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg',
    currentPrice: 9.99,
    originalPrice: 39.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/',
    rating: 4.8,
    stock: 999,
  },
  {
    name: 'Portal 2',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/620/header.jpg',
    currentPrice: 2.99,
    originalPrice: 9.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/620/Portal_2/',
    rating: 4.9,
    stock: 999,
  },
  {
    name: 'Doom Eternal',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/782330/header.jpg',
    currentPrice: 19.99,
    originalPrice: 39.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/782330/Doom_Eternal/',
    rating: 4.6,
    stock: 999,
  },
  {
    name: 'Celeste',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/504230/header.jpg',
    currentPrice: 4.99,
    originalPrice: 19.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/504230/Celeste/',
    rating: 4.9,
    stock: 999,
  },
  {
    name: 'Disco Elysium',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/632470/header.jpg',
    currentPrice: 13.99,
    originalPrice: 39.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/632470/Disco_Elysium__The_Final_Cut/',
    rating: 4.8,
    stock: 999,
  },
  {
    name: 'Death Stranding',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1190460/header.jpg',
    currentPrice: 24.99,
    originalPrice: 39.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/1190460/Death_Stranding/',
    rating: 4.4,
    stock: 999,
  },
  {
    name: 'It Takes Two',
    imageUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1426210/header.jpg',
    currentPrice: 19.99,
    originalPrice: 39.99,
    store: 'Steam',
    category: 'games',
    url: 'https://store.steampowered.com/app/1426210/It_Takes_Two/',
    rating: 4.8,
    stock: 999,
  },
];

const seedProducts = [
  ...gameProducts,
  ...gpu,
  ...keyboards,
  ...mice,
  ...monitors,
  ...laptops,
  ...consoles,
  ...mercadolibre,
  ...dellProducts,
  ...microCenterProducts,
  ...gogProducts,
  ...gameStopProducts,
  ...steelSeriesProducts,
  ...walmartProducts,
  ...lenovoProducts,
  ...hyperxProducts,
];

async function seed() {
  console.log('[SEED] Checking if seed data needed...');

  try {
    const { rows } = await query('SELECT COUNT(*)::int as cnt FROM products');
    if (rows[0].cnt > 0) {
      console.log(`[SEED] Database already has ${rows[0].cnt} products. Skipping seed.`);
      return;
    }
  } catch (err) {
    console.log('[SEED] Could not check product count, will attempt seed anyway:', err.message);
  }

  console.log(`[SEED] Inserting ${seedProducts.length} products...`);

  for (const product of seedProducts) {
    try {
      const id = uuidv4();
      const result = await query(
        `INSERT INTO products (id, name, description, image_url, current_price, original_price, store, category, url, rating, stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (url) DO NOTHING
         RETURNING id`,
        [id, product.name, product.description || null, product.imageUrl, product.currentPrice, product.originalPrice, product.store, product.category, product.url, product.rating ?? null, product.stock ?? null]
      );
      if (result.rows.length > 0) {
        console.log(`[SEED] Created: ${product.name} (${product.category}, $${product.currentPrice})`);
      }
    } catch (err) {
      console.warn(`[SEED] Failed to insert ${product.name}: ${err.message}`);
    }
  }

  console.log('[SEED] Seed complete.');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('[SEED] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SEED] Failed:', err);
      process.exit(1);
    });
}

module.exports = { seed, seedProducts };
