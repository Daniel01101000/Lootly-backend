const authService = require('../services/auth.service');
const { success } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register({ username, email, password });
    return success(res, result, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const profile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, profile };
