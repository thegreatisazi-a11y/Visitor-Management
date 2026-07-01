const path = require('path');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const reportService = require('../services/reportService');
const ReportExport = require('../models/ReportExport');
const { writeAuditLog } = require('../services/auditService');
const { getPagination, buildMeta } = require('../utils/pagination');

const getReportData = catchAsync(async (req, res) => {
  const { reportType, dateFrom, dateTo, filters, search } = req.query;
  const rows = await reportService.getReportRows({ reportType, dateFrom, dateTo, filters, search });
  sendSuccess(res, { data: rows, meta: { total: rows.length } });
});

const listExportHistory = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [data, total] = await Promise.all([
    ReportExport.find().sort({ exportedAt: -1 }).skip(skip).limit(limit).populate('exportedBy', 'fullName email'),
    ReportExport.countDocuments(),
  ]);
  sendSuccess(res, { data, meta: buildMeta({ page, limit, total }) });
});

const exportReport = catchAsync(async (req, res) => {
  const { reportType, fileFormat, dateFrom, dateTo, filters, search } = req.body;

  const { filePath, fileName } = await reportService.exportReport({
    reportType,
    fileFormat,
    dateFrom,
    dateTo,
    filters,
    search,
    exportedBy: req.admin._id,
  });

  await writeAuditLog({
    adminUserId: req.admin._id,
    moduleName: 'reports',
    action: 'exported',
    newValue: { reportType, fileFormat, fileName },
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });

  res.download(path.resolve(filePath), fileName);
});

module.exports = { getReportData, listExportHistory, exportReport };
