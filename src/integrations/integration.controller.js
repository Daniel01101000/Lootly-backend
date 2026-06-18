const integrationService = require('./integration.service');
const { success } = require('../utils/apiResponse');

const run = async (_req, res, next) => {
  try {
    const result = await integrationService.runAll();
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const status = (_req, res, next) => {
  try {
    return success(res, integrationService.getStatus());
  } catch (err) {
    next(err);
  }
};

module.exports = { run, status };
