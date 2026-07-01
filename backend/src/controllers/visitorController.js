const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const visitorService = require('../services/visitorService');

const listEntries = catchAsync(async (req, res) => {
  const { data, meta } = await visitorService.listEntries(req.query);
  sendSuccess(res, { data, meta });
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

module.exports = { listEntries, getEntry, updateEntry, cancelEntry, adminCloseEntry, listCurrentlyInside, listOutSessions };
