const { Router } = require('express');
const { triggerMLScrape, triggerMigrations, triggerSeed } = require('../controllers/admin.controller');

const router = Router();

router.post('/scrape-ml', triggerMLScrape);
router.post('/migrate', triggerMigrations);
router.post('/seed', triggerSeed);

module.exports = router;
