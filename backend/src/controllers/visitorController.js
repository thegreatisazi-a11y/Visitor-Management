const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const visitorService = require('../services/visitorService');
const { writeAuditLog } = require('../services/auditService');

const listEntries = catchAsync(async (req, res) => {
  const { data, meta } = await visitorService.listEntries(req.query);
  sendSuccess(res, { data, meta });
});

const getDistinctValues = catchAsync(async (req, res) => {
  const values = await visitorService.getDistinctValues(req.params.field, req.query);
  sendSuccess(res, { data: values });
});

const getEntry = catchAsync(async (req, res) => {
  const entry = await visitorService.getEntryById(req.params.id);
  sendSuccess(res, { data: entry });
});

const updateEntry = catchAsync(async (req, res) => {
  const entry = await visitorService.updateEntry(req.params.id, req.body, req.admin._id, {
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { message: 'Visitor entry updated', data: entry });
});

const cancelEntry = catchAsync(async (req, res) => {
  const entry = await visitorService.cancelEntry(req.params.id, req.body.cancellationReason, req.admin._id, {
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { message: 'Visitor entry cancelled', data: entry });
});

const adminCloseEntry = catchAsync(async (req, res) => {
  const entry = await visitorService.adminCloseEntry(req.params.id, req.admin._id, {
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { message: 'Visitor entry closed', data: entry });
});

const listCurrentlyInside = catchAsync(async (req, res) => {
  const { data, meta } = await visitorService.listCurrentlyInside(req.query);
  sendSuccess(res, { data, meta });
});

const listOutSessions = catchAsync(async (req, res) => {
  const { data, meta } = await visitorService.listOutSessions(req.query);
  sendSuccess(res, { data, meta });
});

const logPrint = catchAsync(async (req, res) => {
  await writeAuditLog({
    adminUserId: req.admin._id,
    moduleName: 'visitor_entries',
    action: 'printed',
    newValue: { search: req.body.search, quickFilter: req.body.quickFilter, filters: req.body.filters },
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { message: 'Print logged' });
});

module.exports = {
  listEntries,
  getDistinctValues,
  getEntry,
  updateEntry,
  cancelEntry,
  adminCloseEntry,
  listCurrentlyInside,
  listOutSessions,
  logPrint,
};
