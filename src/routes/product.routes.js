const { Router } = require('express');
const { list, getById, getPriceHistory, listStores } = require('../controllers/product.controller');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

router.get('/', optionalAuth, list);
router.get('/stores', optionalAuth, listStores);
router.get('/:id', optionalAuth, getById);
router.get('/:id/history', optionalAuth, getPriceHistory);

module.exports = router;
