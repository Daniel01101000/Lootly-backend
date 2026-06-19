const { Router } = require('express');
const { list, add, remove } = require('../controllers/wishlist.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', list);
router.post('/', add);
router.delete('/:productId', remove);

module.exports = router;
