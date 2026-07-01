const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const qrService = require('../services/qrService');
const { writeAuditLog } = require('../services/auditService');

const listQr = catchAsync(async (req, res) => {
  const qrCodes = await qrService.listQrCodes();
  sendSuccess(res, { data: qrCodes });
});

const getQr = catchAsync(async (req, res) => {
  const qr = await qrService.getQrById(req.params.id);
  sendSuccess(res, { data: qr });
});

const createQr = catchAsync(async (req, res) => {
  const qr = await qrService.createQr(req.body, req.admin._id);
  await writeAuditLog({
    adminUserId: req.admin._id,
    moduleName: 'qr_management',
    action: 'qr_created',
    newValue: qr.toObject(),
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { statusCode: 201, message: 'QR created', data: qr });
});

const updateQr = catchAsync(async (req, res) => {
  const qr = await qrService.updateQr(req.params.id, req.body);
  await writeAuditLog({
    adminUserId: req.admin._id,
    moduleName: 'qr_management',
    action: 'qr_updated',
    newValue: qr.toObject(),
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { message: 'QR updated', data: qr });
});

const regenerateToken = catchAsync(async (req, res) => {
  const qr = await qrService.regenerateToken(req.params.id);
  await writeAuditLog({
    adminUserId: req.admin._id,
    moduleName: 'qr_management',
    action: 'qr_updated',
    newValue: { qrToken: qr.qrToken, qrUrl: qr.qrUrl },
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { message: 'QR token regenerated', data: qr });
});

const downloadQr = catchAsync(async (req, res) => {
  const qr = await qrService.getQrById(req.params.id);
  const buffer = await qrService.getQrImageBuffer(qr.qrUrl);
  const disposition = req.query.download ? 'attachment' : 'inline';
  res.set('Content-Type', 'image/png');
  res.set('Content-Disposition', `${disposition}; filename="${qr.qrName.replace(/\s+/g, '_')}.png"`);
  res.send(buffer);
});

module.exports = { listQr, getQr, createQr, updateQr, regenerateToken, downloadQr };
