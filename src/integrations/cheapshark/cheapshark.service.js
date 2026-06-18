const axios = require('axios');

const CHEAPSHARK_BASE = 'https://www.cheapshark.com/api/1.0';
const TIMEOUT = 10000;

const fetchDeals = async (options = {}) => {
  const params = new URLSearchParams();
  params.set('storeID', options.storeID || '1');
  params.set('upperPrice', options.upperPrice ?? '80');
  params.set('pageSize', options.pageSize || '60');
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.desc) params.set('desc', options.desc);

  const url = `${CHEAPSHARK_BASE}/deals?${params.toString()}`;

  console.log(`[CHEAPSHARK] Fetching deals: ${url}`);

  const response = await axios.get(url, { timeout: TIMEOUT });

  if (!response.data || !Array.isArray(response.data)) {
    console.warn('[CHEAPSHARK] Invalid response format');
    return [];
  }

  console.log(`[CHEAPSHARK] Deals fetched: ${response.data.length}`);
  return response.data;
};

module.exports = { fetchDeals };
