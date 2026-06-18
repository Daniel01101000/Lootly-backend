const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'lootly',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
};

config.integrations = {
  cheapsharkEnabled: process.env.CHEAPSHARK_ENABLED !== 'false',
  mercadolibreEnabled: process.env.MERCADOLIBRE_ENABLED === 'true',
  rawgEnabled: process.env.RAWG_ENABLED === 'true',
  rawgApiKey: process.env.RAWG_API_KEY || null,
};

module.exports = config;
