const axios = require('axios');
const config = require('../../config');

const RAWG_BASE = 'https://api.rawg.io/api';
const TIMEOUT = 8000;

const enrichGame = async (gameName) => {
  const apiKey = config.integrations?.rawgApiKey;
  if (!apiKey) {
    return null;
  }

  try {
    const url = `${RAWG_BASE}/games?key=${apiKey}&search=${encodeURIComponent(gameName)}&page_size=1`;
    const response = await axios.get(url, { timeout: TIMEOUT });

    if (!response.data?.results?.length) {
      return null;
    }

    const game = response.data.results[0];
    console.log(`[RAWG] Metadata enriched: "${gameName.substring(0, 40)}"`);

    return {
      rating: game.rating || null,
      imageUrl: game.background_image || null,
      genres: game.genres ? game.genres.map(g => g.name) : [],
    };
  } catch (err) {
    console.error(`[RAWG] Failed: ${err.message}`);
    return null;
  }
};

const enrichDeals = async (deals) => {
  const enriched = [];
  for (const deal of deals) {
    const metadata = await enrichGame(deal.name);
    if (metadata) {
      enriched.push({
        ...deal,
        imageUrl: metadata.imageUrl || deal.imageUrl,
        rating: metadata.rating || deal.rating,
        description: metadata.genres?.length
          ? `G\u00e9neros: ${metadata.genres.join(', ')}`
          : deal.description,
      });
    } else {
      enriched.push(deal);
    }
  }
  return enriched;
};

module.exports = { enrichGame, enrichDeals };
