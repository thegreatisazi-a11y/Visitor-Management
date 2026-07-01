const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AuditLog = require('../models/AuditLog');
const { getPagination, buildMeta } = require('../utils/pagination');

const listAuditLogs = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const query = {};

  if (req.query.action) query.action = req.query.action;
  if (req.query.moduleName) query.moduleName = req.query.moduleName;
  if (req.query.visitorId) query.visitorId = req.query.visitorId;
  if (req.query.dateFrom || req.query.dateTo) {
    query.actionAt = {};
    if (req.query.dateFrom) query.actionAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) query.actionAt.$lte = new Date(req.query.dateTo);
  }

  const [data, total] = await Promise.all([
    AuditLog.find(query).sort({ actionAt: -1 }).skip(skip).limit(limit).populate('adminUserId', 'fullName email'),
    AuditLog.countDocuments(query),
  ]);

  sendSuccess(res, { data, meta: buildMeta({ page, limit, total }) });
});

module.exports = { listAuditLogs };
