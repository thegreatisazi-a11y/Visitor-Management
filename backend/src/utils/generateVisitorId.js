const Counter = require('../models/Counter');
const env = require('../config/env');

async function generateVisitorId(date = new Date()) {
  const year = date.getFullYear();
  const counterKey = env.VISITOR_ID_YEAR_IN_ID ? `visitorId_${year}` : 'visitorId';

  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.seq).padStart(6, '0');

  return env.VISITOR_ID_YEAR_IN_ID
    ? `${env.VISITOR_ID_PREFIX}-${year}-${padded}`
    : `${env.VISITOR_ID_PREFIX}${padded}`;
}

module.exports = generateVisitorId;
