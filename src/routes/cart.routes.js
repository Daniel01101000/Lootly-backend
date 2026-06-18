const { Router } = require('express');
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', addItem);
router.patch('/:productId', updateItem);
router.delete('/:productId', removeItem);
router.delete('/', clearCart);

module.exports = router;
