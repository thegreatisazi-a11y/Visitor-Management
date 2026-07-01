const VisitorEntry = require('../models/VisitorEntry');
const AutoCloseRun = require('../models/AutoCloseRun');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const { startOfDay, diffInMinutes } = require('../utils/dateHelpers');

async function runAutoClose() {
  const startedAt = new Date();
  const runDate = startOfDay(startedAt);
  const midnight = startOfDay(startedAt);

  let totalEntriesFound = 0;
  let totalEntriesClosed = 0;
  let status = 'success';
  let errorMessage = null;

  try {
    const staleEntries = await VisitorEntry.find({
      status: 'inside_premises',
      outTime: null,
      visitDate: { $lt: runDate },
    });

    totalEntriesFound = staleEntries.length;

    for (const entry of staleEntries) {
      try {
        const oldValue = entry.toObject();

        entry.status = 'auto_closed';
        entry.checkoutMethod = 'auto_midnight';
        entry.outTime = midnight;
        entry.autoClosedAt = startedAt;
        entry.visitDurationMinutes = diffInMinutes(entry.inTime, midnight);
        await entry.save();

        await AuditLog.create({
          visitorEntryId: entry._id,
          visitorId: entry.visitorId,
          moduleName: 'auto_close',
          action: 'auto_closed',
          oldValue,
          newValue: entry.toObject(),
          actionAt: new Date(),
        });

        totalEntriesClosed += 1;
      } catch (entryErr) {
        logger.error(`Auto-close failed for visitor entry ${entry._id}: ${entryErr.message}`);
      }
    }

    if (totalEntriesClosed < totalEntriesFound) {
      status = totalEntriesClosed === 0 ? 'failed' : 'partial';
    }
  } catch (err) {
    status = 'failed';
    errorMessage = err.message;
    logger.error(`Auto-close job failed: ${err.message}`);
  }

  const completedAt = new Date();

  await AutoCloseRun.create({
    runDate,
    scheduledTime: '00:00',
    startedAt,
    completedAt,
    totalEntriesFound,
    totalEntriesClosed,
    status,
    errorMessage,
  });

  logger.info(`Auto-close job finished: found=${totalEntriesFound}, closed=${totalEntriesClosed}, status=${status}`);

  return { totalEntriesFound, totalEntriesClosed, status, errorMessage };
}

module.exports = { runAutoClose };
