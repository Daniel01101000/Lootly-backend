const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('./scraper.controller');

const router = Router();

router.post('/run', authenticate, controller.scrapeAll);
router.post('/category/:category', authenticate, controller.scrapeCategory);
router.post('/store/:store', authenticate, controller.scrapeStore);
router.get('/status', authenticate, controller.getStatus);
router.post('/scheduler', authenticate, controller.toggleScheduler);

module.exports = router;
