const http = require('http');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { initScheduler } = require('./jobs/scheduler');
const { ensureDefaultSettings } = require('./services/settingsService');
const qrService = require('./services/qrService');
const { initSocket } = require('./sockets/io');

async function start() {
  await connectDB();
  await ensureDefaultSettings();
  await qrService.getOrCreateDefaultQr();

  initScheduler();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`ISAZI Visitor Portal API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
