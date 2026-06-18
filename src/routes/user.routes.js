const { Router } = require('express');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

// User routes can be expanded later (update profile, avatar, etc.)
router.get('/me', (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
