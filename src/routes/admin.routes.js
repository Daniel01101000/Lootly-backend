const { Router } = require('express');
const { triggerMLScrape, triggerMigrations, triggerSeed, checkDuplicates, cleanDuplicates } = require('../controllers/admin.controller');

const router = Router();

router.post('/scrape-ml', triggerMLScrape);
router.post('/migrate', triggerMigrations);
router.post('/seed', triggerSeed);
router.post('/check-duplicates', checkDuplicates);
router.post('/clean-duplicates', cleanDuplicates);

module.exports = router;
