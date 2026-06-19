const parsePrice = (value) => {
  if (value == null) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const mapDeal = (deal) => {
  if (!deal || !deal.title) return null;

  const salePrice = parsePrice(deal.salePrice);
  const normalPrice = parsePrice(deal.normalPrice);
  const savings = parsePrice(deal.savings);
  const steamAppID = deal.steamAppID;

  if (salePrice == null || salePrice <= 0) return null;
  if (normalPrice == null || normalPrice <= salePrice) return null;
  if (savings == null || savings <= 0) return null;

  const discount = Math.round(savings);

  const url = steamAppID
    ? `https://store.steampowered.com/app/${steamAppID}`
    : `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`;

  return {
    name: deal.title.trim(),
    currentPrice: salePrice,
    originalPrice: normalPrice,
    discount,
    imageUrl: deal.thumb || null,
    url,
    store: 'Steam',
    category: 'games',
    currency: 'USD',
    description: null,
    rating: null,
  };
};

const mapDeals = (deals) => {
  const mapped = deals.map(mapDeal).filter(Boolean);
  console.log(`[CHEAPSHARK] Mapped ${mapped.length}/${deals.length} valid deals`);
  return mapped;
};

module.exports = { mapDeal, mapDeals };
