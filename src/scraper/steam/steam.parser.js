const parseSteamPrice = (text) => {
  if (!text) return null;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^[A-Za-z$\s]+/, '');
  cleaned = cleaned.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const parsed = parseFloat(cleaned);
  return (!isNaN(parsed) && parsed > 0) ? Math.round(parsed * 100) / 100 : null;
};

module.exports = { parseSteamPrice };
