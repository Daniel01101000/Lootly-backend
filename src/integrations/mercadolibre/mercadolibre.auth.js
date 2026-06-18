const axios = require('axios');

const TOKEN_URL = 'https://mnfapp.ath.cx/pruebas/mercadolibre/token.json';
let cachedToken = null;
let lastFetch = 0;
const TOKEN_TTL = 4 * 60 * 60 * 1000;

const getAccessToken = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedToken && (now - lastFetch) < TOKEN_TTL) {
    return cachedToken;
  }

  try {
    const response = await axios.get(TOKEN_URL, { timeout: 15000 });
    const token = response.data?.access_token;

    if (!token || typeof token !== 'string' || token.length < 10) {
      throw new Error(`Respuesta de token inválida: ${JSON.stringify(response.data)}`);
    }

    cachedToken = token;
    lastFetch = now;
    console.log(`[ML AUTH] Token actualizado exitosamente (${token.substring(0, 10)}...${token.slice(-5)})`);
    return token;
  } catch (err) {
    if (cachedToken) {
      console.warn(`[ML AUTH] Error obteniendo token nuevo, usando cache: ${err.message}`);
      return cachedToken;
    }
    throw new Error(`[ML AUTH] No se pudo obtener access_token: ${err.message}`);
  }
};

const forceRefreshToken = () => getAccessToken(true);

module.exports = { getAccessToken, forceRefreshToken };
