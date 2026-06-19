const { Router } = require('express');
const { triggerMLScrape } = require('../controllers/admin.controller');

const router = Router();

router.post('/scrape-ml', triggerMLScrape);

module.exports = router;
