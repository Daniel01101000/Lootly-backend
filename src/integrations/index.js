const integrationService = require('./integration.service');
const integrationRoutes = require('./integration.routes');
const config = require('../config');
const cron = require('node-cron');

const initIntegrationScheduler = () => {
  if (process.env.NODE_ENV === 'test') return;

  const enabled = [];

  if (config.integrations?.cheapsharkEnabled !== false) enabled.push('CheapShark');
  if (config.integrations?.mercadolibreEnabled !== false) enabled.push('MercadoLibre');
  if (config.integrations?.rawgEnabled) enabled.push('RAWG');

  console.log(`[IntegrationService] Active integrations: ${enabled.length > 0 ? enabled.join(', ') : 'none'}`);

  cron.schedule('0 */4 * * *', async () => {
    console.log('[IntegrationService] Running scheduled integration...');
    try {
      await integrationService.runAll();
    } catch (err) {
      console.error(`[IntegrationService] Scheduled run failed: ${err.message}`);
    }
  });

  console.log('[IntegrationService] Scheduler started (every 4 hours)`');
};

module.exports = { integrationService, integrationRoutes, initIntegrationScheduler };
