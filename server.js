const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./src/config');
const { errorHandler } = require('./src/middleware/errorHandler');
const routes = require('./src/routes');
const { initScheduler } = require('./src/scraper');
const { initIntegrationScheduler } = require('./src/integrations');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use('/api/v1', routes);

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Lootly API running on port ${config.port} [${config.nodeEnv}]`);
  initScheduler();
  initIntegrationScheduler();
});
