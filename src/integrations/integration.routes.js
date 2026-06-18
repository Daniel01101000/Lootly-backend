const { Router } = require('express');
const { run, status } = require('./integration.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/run', authenticate, run);
router.get('/status', authenticate, status);

module.exports = router;
