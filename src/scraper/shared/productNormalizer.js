const PLACEHOLDER_IMAGES = [
  'http2.mlstatic.com/frontend-assets',
  'mlstatic.com/frontend-assets',
  'placeholder',
  'no-image',
  'logo',
  'data:image',
  '1x1.gif',
  'pixel.gif',
];

const isValidImage = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return !PLACEHOLDER_IMAGES.some((p) => lower.includes(p)) && url.startsWith('http');
};

const isValidUrl = (url) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

const CATEGORY_KEYWORDS = {
  'games': [
    'videojuego', 'juego', 'game', 'jogos', 'videogame',
    'cyberpunk', 'elden ring', 'hades', 'red dead', 'stardew valley',
    'baldur', 'hollow knight', 'witcher', 'portal', 'doom eternal',
    'celeste', 'disco elysium', 'death stranding', 'it takes two',
    'fifa', 'call of duty', 'assassin', 'god of war', 'spider-man',
    'final fantasy', 'resident evil', 'grand theft auto', 'minecraft',
    'fortnite', 'league of legends', 'world of warcraft', 'diablo',
    'overwatch', 'apex legends', 'valorant', 'counter-strike', 'csgo',
    'rainbow six', 'battlefield', 'fallout', 'skyrim', 'starfield',
    'forza', 'halo', 'gears of war', 'tekken', 'street fighter',
    'metal gear', 'mass effect', 'dragon age', 'far cry',
    'tom clancy', 'mafia', 'saints row', 'bioShock', 'borderlands',
    'crusader kings', 'civilization', 'age of empires', 'total war',
    'city skylines', 'rimworld', 'factorio', 'satisfactory',
    'stray', 'sea of stars', 'octopath', 'persona', 'yakuza',
    'monster hunter', 'dark souls', 'sekiro', 'bloodborne',
    'payday', 'left 4 dead', 'team fortress', 'rocket league',
    'pubg', 'warframe', 'path of exile', 'destiny',
    'cd projekt', 'blizzard', 'ubisoft', 'electronic arts',
    'marvel', 'star wars', 'lego', 'sonic', 'super mario',
    'zelda', 'pokemon', 'metroid', 'kirby', 'animal crossing',
    'splatoon', 'mario kart', 'smash bros', 'crash bandicoot',
    'spyro', 'ratchet', 'silent hill', 'alan wake', 'control',
    'remnant', 'psychonauts', 'ghost of tsushima', 'horizon',
    'the last of us', 'uncharted', 'days gone',
  ],
  'gpu': [
    'graphics card', 'tarjeta grafica', 'gpu', 'rtx', 'gtx',
    'radeon', 'geforce', 'nvidia', '3080', '3090', '4060', '4070',
    '4080', '4090', '5070', '5080', '5090', '7900 xtx', '7900 xt',
    '7800 xt', '7700 xt', '7600 xt', 'arc a', 'intel arc',
    'rx 7900', 'rx 7800', 'rx 7700', 'rx 7600',
    'quadro', 'tesla', 'graphics gpu',
    'rtx a', 'nvidia titan', 'gigabyte', 'asus rog rtx',
    'msi rtx', 'zotac', 'evga', 'pny', 'gainward',
    'amd radeon', 'sapphire', 'powercolor', 'xfx',
  ],
  'cpu': [
    'processor', 'cpu', 'procesador',
    'ryzen 5', 'ryzen 7', 'ryzen 9', 'ryzen 3', 'threadripper',
    'intel core', 'core i3', 'core i5', 'core i7', 'core i9',
    'socket am', 'amd ryzen', 'intel ultra', 'xeon',
    'chipset', 'apu',
    'socket am5', 'lga1700', 'lga1851', 'lga1200',
    'intel core ultra', 'amd ryzen 9000', 'amd ryzen 7000',
  ],
  'monitor': [
    'monitor', 'pantalla', 'display',
    'ultragear', 'odyssey g', 'rog swift', 'predator x',
    'nitro xv', 'nitro vg', 'optix mag',
    'gaming monitor', 'monitor curvo',
    '144hz', '165hz', '240hz', '360hz', 'freesync', 'gsync',
    'oled monitor', '4k monitor', 'ultrawide',
    'asus rog monitor', 'samsung odyssey',
    'alienware monitor', 'lg ultragear',
  ],
  'keyboard': [
    'teclado', 'keyboard', 'mecanico', 'mecánico', 'k70', 'blackwidow',
    'apex pro', 'alloy origins', 'keycaps', 'teclas',
    'switches mecanicos', 'switches mecánicos', 'membrane keyboard',
    'rgb keyboard', 'gaming keyboard', 'magnetic switch',
    'hall effect keyboard', 'teclado gamer',
    'razer huntsman', 'logitech g pro', 'corsair k',
    'wooting', 'steelseries apex', 'ducky',
  ],
  'mouse': [
    'mouse', 'ratón', 'raton', 'deathadder', 'g502', 'superlight',
    'viper mini', 'basilisk', 'aerox', 'pulsefire', 'keris',
    'gaming mouse', 'raton gaming', 'inalambrico',
    'mousemat', 'mousepad', 'alfombrilla',
    'logitech g pro', 'razer viper', 'finalmouse',
    'glorious model', 'pulsar x2', 'lamzu',
  ],
  'laptop': [
    'laptop', 'notebook', 'zephyrus g', 'legion pro', 'razer blade',
    'tuf gaming', 'stealth studio', 'gaming laptop',
    'laptop gamer', 'predator helios', 'alienware', 'omén',
    'rog flow', 'rog strix', 'nitro 5', 'helios neo',
    'msi katana', 'msi cyborg', 'msi stealth',
    'gigabyte aorus', 'gaming notebook',
  ],
  'console': [
    'playstation', 'xbox series x', 'xbox series s', 'xbox one',
    'nintendo switch', 'nintendo ds', 'steam deck', 'rog ally',
    'playstation 5', 'ps5', 'ps4', 'ps4 pro',
    'consola', 'handheld console', 'gaming console',
    'xbox game pass', 'playstation portal', 'xbox controller',
    'ps5 controller', 'dual sense', 'nintendo switch oled',
    'steam deck oled', 'legion go', 'msi claw',
  ],
  'component': [
    'ram', 'memoria ram', 'ddr4', 'ddr5', 'nvme', 'ssd', 'm.2',
    'fuente poder', 'fuente de poder', 'power supply', 'psu',
    '850w', '750w', '1000w', '1200w',
    'motherboard', 'tarjeta madre', 'placa base',
    'refrigeracion', 'refrigeración', 'cpu cooler', 'aio cooler',
    'water cooling', 'ventilador pc', 'gabinete', 'chassis',
    'disco duro', 'hdd', 'almacenamiento',
    'tarjeta de red', 'wifi card',
    'corsair vengeance', 'g skill trident', 'kingston fury',
    'samsung 990', 'western digital', 'crucial',
    'seasonic', 'corsair rm', 'evga supernova',
    'nzxt', 'cooler master', 'noctua', 'be quiet',
    'lian li', 'fractal design', 'corsair 4000',
    'thermal paste', 'pasta termica', 'fan hub',
    'artic cooler', 'deepcool', 'asus rog motherboard',
    'msi motherboard', 'gigabyte motherboard',
    'samsung 870', 'samsung 980', 'wd black',
    'sabrent', 'team group', 'adata',
    'case fan', 'ventilador', 'rgb fan',
    'silla gamer', 'escritorio gamer', 'gaming chair',
  ],
  'headset': [
    'audifono', 'audifonos', 'headset', 'auricular', 'auriculares',
    'diadema', 'casco gamer', 'headphones', 'earbuds gaming',
    'hyperx cloud', 'steelseries arctis', 'corsair void',
    'razer kraken', 'logitech g pro headset', 'astro a',
  ],
  'phone': [
    'celular', 'smartphone', 'galaxy', 'iphone', 'xiaomi', 'redmi',
    'motorola moto', 'pixel phone', 'oneplus', 'realme',
    'samsung galaxy s', 'samsung galaxy a', 'samsung galaxy z',
    'iphone pro', 'iphone max', 'poco phone',
  ],
  'appliance': [
    'refrigerador', 'frigobar', 'lavadora', 'microondas', 'licuadora',
    'aspiradora', 'estufa', 'horno', 'secadora', 'lavavajillas',
    'aire acondicionado', 'calentador', 'cafetera', 'tostadora',
  ],
};

const STORE_CATEGORY_MAP = {
  'steam': 'games',
  'epic games': 'games',
  'gog': 'games',
  'ubisoft': 'games',
  'xbox store': 'games',
  'playstation store': 'games',
  'nintendo eshop': 'games',
};

const parsePrice = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.,]/g, '').trim();
  if (!cleaned) return null;

  const dotCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;

  let normalized;
  if (dotCount > 0 && commaCount > 0) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastDot > lastComma) {
      normalized = cleaned.replace(/,/g, '');
    } else {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (dotCount > 0) {
    normalized = cleaned;
  } else if (commaCount > 0) {
    normalized = cleaned.replace(',', '.');
  } else {
    normalized = cleaned;
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};

const detectCategory = (name, store) => {
  if (!name) return 'uncategorized';

  const storeKey = (store || '').toLowerCase().trim();
  if (STORE_CATEGORY_MAP[storeKey]) {
    console.log(`[CATEGORY] Store-based override: "${store}" → "${STORE_CATEGORY_MAP[storeKey]}" (product: "${name.substring(0, 60)}")`);
    return STORE_CATEGORY_MAP[storeKey];
  }

  const lower = name.toLowerCase();
  let bestCategory = 'uncategorized';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (lower.includes(kw)) {
        const bonus = kw.split(' ').length > 1 ? 3 : 1;
        score += bonus;
        if (lower.startsWith(kw) || lower.includes(' ' + kw)) {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  console.log(`[CATEGORY] Detected: "${bestCategory}" (score: ${bestScore}) for "${name.substring(0, 60)}..."`);
  return bestCategory;
};

const normalizeProduct = (raw, store) => {
  const name = raw.name?.trim();
  if (!name) return null;

  if (!isValidUrl(raw.url)) {
    console.warn(`[NORMALIZE] Skipping "${name.substring(0, 40)}": invalid or missing URL`);
    return null;
  }

  if (!isValidImage(raw.imageUrl)) {
    console.warn(`[NORMALIZE] Skipping "${name.substring(0, 40)}": invalid or placeholder image`);
    return null;
  }

  const currentPrice = parsePrice(raw.currentPrice);
  if (!currentPrice || currentPrice <= 0) return null;

  const originalPrice = parsePrice(raw.originalPrice);

  let discount = 0;
  if (originalPrice && originalPrice > currentPrice) {
    discount = raw.discountPercent && raw.discountPercent > 0
      ? raw.discountPercent
      : Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  if (!discount || discount <= 0) return null;

  const forcedCategory = raw.category || null;
  const detectedCategory = detectCategory(name, raw.store || store);

  let finalCategory;
  if (forcedCategory && forcedCategory !== detectedCategory) {
    console.warn(
      `[CATEGORY-MISMATCH] Forced="${forcedCategory}" vs Detected="${detectedCategory}" for "${name.substring(0, 60)}..."`
    );
    if (detectedCategory !== 'uncategorized') {
      finalCategory = detectedCategory;
    } else {
      finalCategory = forcedCategory;
    }
  } else {
    finalCategory = detectedCategory;
  }

  return {
    name,
    currentPrice,
    originalPrice: originalPrice || currentPrice,
    discount,
    imageUrl: raw.imageUrl || null,
    url: raw.url,
    store: raw.store || store,
    category: finalCategory,
    currency: raw.currency || 'MXN',
    description: raw.description || null,
    rating: raw.rating || null,
  };
};

module.exports = { normalizeProduct, detectCategory, parsePrice, CATEGORY_KEYWORDS, STORE_CATEGORY_MAP };
