const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 5000;

const randomDelay = async (min = MIN_DELAY_MS, max = MAX_DELAY_MS) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`[Scraper] Waiting ${ms}ms...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = { randomDelay, MIN_DELAY_MS, MAX_DELAY_MS };
