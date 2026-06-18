const cron = require('node-cron');
const scraperService = require('../scraper.service');

const CRON_SCHEDULE = '0 */6 * * *';

let isRunning = false;
let scheduledTask = null;
const HISTORY_LIMIT = 20;
const runHistory = [];

const startScheduler = (schedule = CRON_SCHEDULE) => {
  if (scheduledTask) {
    console.log('[Scheduler] Already running. Stopping first...');
    stopScheduler();
  }

  console.log(`[Scheduler] Starting with schedule: "${schedule}" (every 6 hours default)`);

  scheduledTask = cron.schedule(schedule, async () => {
    if (isRunning) {
      console.log('[Scheduler] Previous run still in progress. Skipping...');
      return;
    }

    isRunning = true;
    const startTime = Date.now();
    console.log('[Scheduler] Triggering scheduled scrape...');

    try {
      const result = await scraperService.scrapeAll();
      const duration = Date.now() - startTime;
      runHistory.unshift({ timestamp: new Date().toISOString(), duration, result: 'success', details: result });

      if (runHistory.length > HISTORY_LIMIT) runHistory.pop();

      console.log(`[Scheduler] Scrape completed in ${duration}ms. Created: ${result.created}, Updated: ${result.updated}`);
    } catch (err) {
      const duration = Date.now() - startTime;
      runHistory.unshift({ timestamp: new Date().toISOString(), duration, result: 'error', error: err.message });

      if (runHistory.length > HISTORY_LIMIT) runHistory.pop();

      console.error(`[Scheduler] Scrape failed after ${duration}ms: ${err.message}`);
    } finally {
      isRunning = false;
    }
  });

  console.log('[Scheduler] Started successfully');
  return true;
};

const stopScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Scheduler] Stopped');
  }
  return true;
};

const getSchedulerStatus = () => ({
  isRunning,
  isScheduled: scheduledTask !== null,
  schedule: CRON_SCHEDULE,
  lastRuns: runHistory.slice(0, 10),
});

module.exports = { startScheduler, stopScheduler, getSchedulerStatus };
