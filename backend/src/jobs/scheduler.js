const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../utils/logger');
const { runAutoClose } = require('./autoCloseJob');

function initScheduler() {
  cron.schedule(env.AUTO_CLOSE_CRON_EXPRESSION, () => {
    logger.info('Running scheduled midnight auto-close job...');
    runAutoClose().catch((err) => logger.error(`Scheduled auto-close job crashed: ${err.message}`));
  });

  logger.info(`Auto-close cron scheduled with expression "${env.AUTO_CLOSE_CRON_EXPRESSION}"`);
}

module.exports = { initScheduler };
