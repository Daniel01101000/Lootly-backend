const MIN_INTERVAL_MS = 4000;

const domainTimers = new Map();

const waitForSlot = async (domain) => {
  const now = Date.now();
  const lastCall = domainTimers.get(domain) || 0;
  const waitTime = Math.max(0, MIN_INTERVAL_MS - (now - lastCall));

  if (waitTime > 0) {
    console.log(`[RateLimiter] Waiting ${waitTime}ms before next request to ${domain}`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  domainTimers.set(domain, Date.now());
};

const resetLimiter = () => {
  domainTimers.clear();
};

module.exports = { waitForSlot, resetLimiter, MIN_INTERVAL_MS };
