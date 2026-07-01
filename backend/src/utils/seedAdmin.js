require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const env = require('../config/env');
const connectDB = require('../config/db');
const logger = require('./logger');
const AdminUser = require('../models/AdminUser');
const { ensureDefaultSettings } = require('../services/settingsService');
const qrService = require('../services/qrService');

async function seed() {
  await connectDB();

  let admin = await AdminUser.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (admin) {
    logger.info(`Seed admin already exists: ${env.SEED_ADMIN_EMAIL}`);
  } else {
    const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);
    admin = await AdminUser.create({
      fullName: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      mobile: env.SEED_ADMIN_MOBILE,
      passwordHash,
      status: 'active',
    });
    logger.info(`Seed admin created: ${env.SEED_ADMIN_EMAIL} / ${env.SEED_ADMIN_PASSWORD}`);
  }

  await ensureDefaultSettings();
  logger.info('Default system settings ensured.');

  const qr = await qrService.getOrCreateDefaultQr(admin._id);
  logger.info(`Default visitor portal QR ready: ${qr.qrUrl}`);

  await mongoose.disconnect();
  logger.info('Seeding complete.');
}

seed().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`);
  process.exit(1);
});
