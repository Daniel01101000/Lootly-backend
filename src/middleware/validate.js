const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, _res, next) => {
  const errors = [];
  const data = { ...req.body, ...req.params, ...req.query };

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value === undefined || value === null) continue;

    if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push(`${field} must be a valid email`);
    }

    if (rules.minLength && String(value).length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }

    if (rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(`${field} must be at most ${rules.maxLength} characters`);
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join('; ')));
  }

  next();
};

module.exports = { validate };
