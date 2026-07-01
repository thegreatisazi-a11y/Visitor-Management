const crypto = require('crypto');
const QRCode = require('qrcode');
const VisitorQrCode = require('../models/VisitorQrCode');
const env = require('../config/env');
const AppError = require('../utils/AppError');

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

function buildUrl(token) {
  const base = env.VISITOR_PORTAL_PUBLIC_URL.split('?')[0];
  return `${base}?t=${token}`;
}

async function getOrCreateDefaultQr(createdBy = null) {
  let qr = await VisitorQrCode.findOne({ qrType: 'visitor_portal' }).sort({ createdAt: 1 });
  if (qr) return qr;

  const qrToken = generateToken();
  qr = await VisitorQrCode.create({
    qrName: 'Reception Visitor Portal QR',
    qrType: 'visitor_portal',
    qrToken,
    qrUrl: buildUrl(qrToken),
    locationName: env.QR_DEFAULT_LOCATION,
    status: 'active',
    createdBy,
  });
  return qr;
}

async function listQrCodes() {
  return VisitorQrCode.find().sort({ createdAt: -1 });
}

async function getQrById(id) {
  const qr = await VisitorQrCode.findById(id);
  if (!qr) throw new AppError('QR record not found', 404);
  return qr;
}

async function createQr({ qrName, locationName }, createdBy) {
  const qrToken = generateToken();
  return VisitorQrCode.create({
    qrName,
    qrType: 'visitor_portal',
    qrToken,
    qrUrl: buildUrl(qrToken),
    locationName: locationName || env.QR_DEFAULT_LOCATION,
    status: 'active',
    createdBy,
  });
}

async function updateQr(id, updates) {
  const qr = await getQrById(id);
  Object.assign(qr, updates);
  await qr.save();
  return qr;
}

async function regenerateToken(id) {
  const qr = await getQrById(id);
  qr.qrToken = generateToken();
  qr.qrUrl = buildUrl(qr.qrToken);
  await qr.save();
  return qr;
}

async function incrementUsage(id) {
  if (!id) return;
  await VisitorQrCode.findByIdAndUpdate(id, { $inc: { usageCount: 1 } });
}

async function getQrImageDataUrl(qrUrl) {
  return QRCode.toDataURL(qrUrl, { width: 400, margin: 2 });
}

async function getQrImageBuffer(qrUrl) {
  return QRCode.toBuffer(qrUrl, { width: 600, margin: 2 });
}

module.exports = {
  getOrCreateDefaultQr,
  listQrCodes,
  getQrById,
  createQr,
  updateQr,
  regenerateToken,
  incrementUsage,
  getQrImageDataUrl,
  getQrImageBuffer,
};
