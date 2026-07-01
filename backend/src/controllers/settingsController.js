const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const { getAllSettings, updateSettings } = require('../services/settingsService');
const { writeAuditLog } = require('../services/auditService');

const getSettings = catchAsync(async (req, res) => {
  const settings = await getAllSettings();
  sendSuccess(res, { data: settings });
});

const putSettings = catchAsync(async (req, res) => {
  const oldSettings = await getAllSettings();
  const updated = await updateSettings(req.body, req.admin._id);

  await writeAuditLog({
    adminUserId: req.admin._id,
    moduleName: 'settings',
    action: 'settings_updated',
    oldValue: oldSettings,
    newValue: updated,
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });

  sendSuccess(res, { message: 'Settings updated', data: updated });
});

module.exports = { getSettings, putSettings };
