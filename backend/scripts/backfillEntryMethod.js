// One-off migration: explicitly set entryMethod:'manual' on visitor_entries rows
// created before the face-recognition feature. Mongoose schema defaults apply on
// document instantiation, not inside query filters, so without this backfill the
// admin grid's Entry Method filter would silently miss all pre-existing rows.
//
// Run manually once:  node scripts/backfillEntryMethod.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const VisitorEntry = require('../src/models/VisitorEntry');
const logger = require('../src/utils/logger');

async function run() {
  await connectDB();

  const result = await VisitorEntry.updateMany(
    { entryMethod: { $exists: false } },
    { $set: { entryMethod: 'manual' } }
  );

  logger.info(`Backfill complete: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  logger.error(`Backfill failed: ${err.message}`);
  process.exit(1);
});
