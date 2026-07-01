const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

async function writeAuditLog({
  adminUserId = null,
  visitorEntryId = null,
  visitorId = null,
  moduleName = null,
  action,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  deviceInfo = null,
}) {
  try {
    await AuditLog.create({
      adminUserId,
      visitorEntryId,
      visitorId,
      moduleName,
      action,
      oldValue,
      newValue,
      ipAddress,
      deviceInfo,
      actionAt: new Date(),
    });
  } catch (err) {
    logger.error(`Failed to write audit log for action "${action}": ${err.message}`);
  }
}

module.exports = { writeAuditLog };
