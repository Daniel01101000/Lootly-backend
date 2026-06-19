const { Router } = require('express');
const { register, login, profile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = Router();

const registerSchema = {
  username: { required: true, minLength: 3, maxLength: 30 },
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 6 },
};

const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true },
};

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/profile', authenticate, profile);

module.exports = router;
