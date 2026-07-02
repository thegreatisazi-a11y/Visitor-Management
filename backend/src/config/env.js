const dotenv = require('dotenv');

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5001,
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5001',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/isazi_visitor_portal',

  JWT_SECRET: process.env.JWT_SECRET || 'dev_only_change_this_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  JWT_COOKIE_EXPIRES_DAYS: parseInt(process.env.JWT_COOKIE_EXPIRES_DAYS, 10) || 1,

  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || 'Super Admin',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
  SEED_ADMIN_MOBILE: process.env.SEED_ADMIN_MOBILE || '9999999999',

  RATE_LIMIT_WINDOW_MINUTES: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 300,
  PUBLIC_RATE_LIMIT_WINDOW_MINUTES: parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MINUTES, 10) || 15,
  PUBLIC_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.PUBLIC_RATE_LIMIT_MAX_REQUESTS, 10) || 60,

  VISITOR_PORTAL_PUBLIC_URL: process.env.VISITOR_PORTAL_PUBLIC_URL || 'http://localhost:5173/visitor',
  QR_DEFAULT_LOCATION: process.env.QR_DEFAULT_LOCATION || 'Reception',

  COMPANY_NAME: process.env.COMPANY_NAME || 'ISAZI Pharma and Techno Consultancy Pvt. Ltd.',
  COMPANY_ADDRESS:
    process.env.COMPANY_ADDRESS ||
    '604, Dream Rise, Science City Road, Near Hetarth Party Plot, Sola, Ahmedabad - 380060, Gujarat, India.',
  COMPANY_EMAIL: process.env.COMPANY_EMAIL || 'contact@isazi.biz',
  COMPANY_WEBSITE: process.env.COMPANY_WEBSITE || 'www.isazi.biz',
  COMPANY_PHONE: process.env.COMPANY_PHONE || '+91 95742 75666',

  VISITOR_ID_PREFIX: process.env.VISITOR_ID_PREFIX || 'VIS',
  VISITOR_ID_YEAR_IN_ID: (process.env.VISITOR_ID_YEAR_IN_ID || 'true') === 'true',

  AUTO_CLOSE_CRON_EXPRESSION: process.env.AUTO_CLOSE_CRON_EXPRESSION || '0 0 * * *',

  AI_SERVICE_BASE_URL: process.env.AI_SERVICE_BASE_URL || 'http://localhost:8001',
  AI_SERVICE_TIMEOUT_MS: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 8000,
  FACE_RECOGNITION_THRESHOLD: parseFloat(process.env.FACE_RECOGNITION_THRESHOLD) || 0.85,
  FACE_PHOTO_MAX_SIZE_MB: parseInt(process.env.FACE_PHOTO_MAX_SIZE_MB, 10) || 4,

  UPLOAD_DIR: process.env.UPLOAD_DIR || 'src/uploads',
  MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 5,

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

module.exports = env;
