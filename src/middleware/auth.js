const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const authenticate = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, username: decoded.username, email: decoded.email };
    next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, username: decoded.username, email: decoded.email };
  } catch {
    // silently continue without user
  }

  next();
};

module.exports = { authenticate, optionalAuth };
