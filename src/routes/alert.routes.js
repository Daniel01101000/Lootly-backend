const { Router } = require('express');
const { list, create, remove, toggle } = require('../controllers/alert.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);
router.patch('/:id/toggle', toggle);

module.exports = router;
