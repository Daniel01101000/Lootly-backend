const scraperService = require('./scraper.service');
const scraperRoutes = require('./scraper.routes');
const { startScheduler } = require('./scheduler/scheduler');

const initScheduler = () => {
  if (process.env.NODE_ENV !== 'test') {
    startScheduler();
  }
};

module.exports = { scraperService, scraperRoutes, initScheduler };
