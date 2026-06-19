const scraperService = require('./scraper.service');
const { startScheduler, stopScheduler, getSchedulerStatus } = require('./scheduler/scheduler');
const { success } = require('../utils/apiResponse');

const scrapeAll = async (_req, res, next) => {
  try {
    console.log('[API] POST /api/v1/scraper/run — Starting full scrape...');
    const result = await scraperService.scrapeAll();
    console.log(`[API] POST /api/v1/scraper/run — Done. ${result.created} created, ${result.updated} updated`);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const scrapeCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    console.log(`[API] POST /api/v1/scraper/category/${category} — Starting...`);
    const result = await scraperService.scrapeCategory(category);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const scrapeStore = async (req, res, next) => {
  try {
    const { store } = req.params;
    console.log(`[API] POST /api/v1/scraper/store/${store} — Starting...`);
    const result = await scraperService.scrapeStore(store);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getStatus = async (_req, res, next) => {
  try {
    const scraperStatus = scraperService.getStatus();
    const schedulerStatus = getSchedulerStatus();
    return success(res, { scraper: scraperStatus, scheduler: schedulerStatus });
  } catch (err) {
    next(err);
  }
};

const toggleScheduler = async (req, res, next) => {
  try {
    const { action } = req.body;
    if (action === 'start') {
      startScheduler();
      return success(res, { message: 'Scheduler started' });
    } else if (action === 'stop') {
      stopScheduler();
      return success(res, { message: 'Scheduler stopped' });
    }
    return success(res, { message: `Scheduler is ${getSchedulerStatus().isScheduled ? 'running' : 'stopped'}` });
  } catch (err) {
    next(err);
  }
};

module.exports = { scrapeAll, scrapeCategory, scrapeStore, getStatus, toggleScheduler };
