const VisitorEntry = require('../models/VisitorEntry');
const VisitorOutSession = require('../models/VisitorOutSession');
const AppError = require('../utils/AppError');
const generateVisitorId = require('../utils/generateVisitorId');
const { startOfDay, diffInMinutes } = require('../utils/dateHelpers');
const { getPagination, buildMeta } = require('../utils/pagination');
const { buildFilterQuery, buildGlobalSearchQuery, buildQuickFilterQuery } = require('../utils/queryBuilder');
const { writeAuditLog } = require('./auditService');

const ACTIVE_ENTRY_QUERY = { status: 'inside_premises', outTime: null };

async function findActiveEntryByMobile(mobileNo) {
  return VisitorEntry.findOne({ mobileNo, ...ACTIVE_ENTRY_QUERY }).sort({ inTime: -1 });
}

async function checkMobile(mobileNo) {
  const activeEntry = await findActiveEntryByMobile(mobileNo);
  if (activeEntry) {
    return { action: 'checkout', entry: activeEntry };
  }
  return { action: 'checkin', entry: null };
}

async function createCheckin(payload, meta = {}) {
  const { mobileNo } = payload;

  const existingActive = await findActiveEntryByMobile(mobileNo);
  if (existingActive) {
    throw new AppError(
      'An active visit already exists for this mobile number. Please checkout first.',
      409
    );
  }

  const now = new Date();
  const visitorId = await generateVisitorId(now);

  const entry = await VisitorEntry.create({
    visitorId,
    visitDate: startOfDay(now),
    visitorName: payload.visitorName,
    companyName: payload.companyName,
    address: payload.address,
    mobileNo,
    emailId: payload.emailId,
    purposeOfVisit: payload.purposeOfVisit,
    personToMeet: payload.personToMeet,
    remarks: payload.remarks || '',
    inTime: now,
    outTime: null,
    status: 'inside_premises',
    checkoutMethod: null,
    visitDurationMinutes: null,
    qrCodeId: payload.qrCodeId || null,
    entrySessionId: payload.entrySessionId || null,
  });

  await writeAuditLog({
    visitorEntryId: entry._id,
    visitorId: entry.visitorId,
    moduleName: 'visitor_entries',
    action: 'in_submitted',
    newValue: entry.toObject(),
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  return entry;
}

async function completeCheckout({ mobileNo, visitorEntryId }, meta = {}) {
  const query = visitorEntryId ? { _id: visitorEntryId, ...ACTIVE_ENTRY_QUERY } : { mobileNo, ...ACTIVE_ENTRY_QUERY };

  const entry = await VisitorEntry.findOne(query).sort({ inTime: -1 });
  if (!entry) {
    return { found: false, entry: null };
  }

  const now = new Date();
  entry.status = 'completed';
  entry.outTime = now;
  entry.checkoutMethod = 'mobile_self_out';
  entry.visitDurationMinutes = diffInMinutes(entry.inTime, now);
  await entry.save();

  await VisitorOutSession.create({
    visitorEntryId: entry._id,
    visitorId: entry.visitorId,
    qrCodeId: entry.qrCodeId,
    mobileEntered: mobileNo || entry.mobileNo,
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
    startedAt: now,
    completedAt: now,
    status: 'completed',
  });

  await writeAuditLog({
    visitorEntryId: entry._id,
    visitorId: entry.visitorId,
    moduleName: 'visitor_entries',
    action: 'out_completed',
    newValue: { status: entry.status, outTime: entry.outTime, checkoutMethod: entry.checkoutMethod },
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  return { found: true, entry };
}

function buildListQuery({ search, quickFilter, filters, dateFrom, dateTo }) {
  const query = {
    ...buildQuickFilterQuery(quickFilter),
    ...buildFilterQuery(filters),
  };

  const searchQuery = buildGlobalSearchQuery(search);
  Object.assign(query, searchQuery);

  if (dateFrom || dateTo) {
    query.visitDate = query.visitDate || {};
    if (dateFrom) query.visitDate.$gte = startOfDay(dateFrom);
    if (dateTo) query.visitDate.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }

  return query;
}

async function listEntries(reqQuery) {
  const { page, limit, skip } = getPagination(reqQuery);
  const query = buildListQuery(reqQuery);
  const sortField = reqQuery.sortBy || 'inTime';
  const sortDir = reqQuery.sortDir === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
    VisitorEntry.find(query).sort({ [sortField]: sortDir }).skip(skip).limit(limit),
    VisitorEntry.countDocuments(query),
  ]);

  return { data, meta: buildMeta({ page, limit, total }) };
}

async function listCurrentlyInside(reqQuery) {
  const { page, limit, skip } = getPagination(reqQuery);
  const query = { ...buildListQuery(reqQuery), status: 'inside_premises', outTime: null };

  const [data, total] = await Promise.all([
    VisitorEntry.find(query).sort({ inTime: -1 }).skip(skip).limit(limit),
    VisitorEntry.countDocuments(query),
  ]);

  return { data, meta: buildMeta({ page, limit, total }) };
}

async function getEntryById(id) {
  const entry = await VisitorEntry.findById(id);
  if (!entry) throw new AppError('Visitor entry not found', 404);
  return entry;
}

async function updateEntry(id, updates, adminUserId, meta = {}) {
  const entry = await getEntryById(id);
  const oldValue = entry.toObject();

  Object.assign(entry, updates);
  await entry.save();

  await writeAuditLog({
    adminUserId,
    visitorEntryId: entry._id,
    visitorId: entry.visitorId,
    moduleName: 'visitor_entries',
    action: 'edited',
    oldValue,
    newValue: entry.toObject(),
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  return entry;
}

async function cancelEntry(id, cancellationReason, adminUserId, meta = {}) {
  const entry = await getEntryById(id);
  if (entry.status === 'cancelled') {
    throw new AppError('This entry is already cancelled', 400);
  }

  const oldValue = entry.toObject();
  entry.status = 'cancelled';
  entry.cancelledBy = adminUserId;
  entry.cancelledAt = new Date();
  entry.cancellationReason = cancellationReason;
  await entry.save();

  await writeAuditLog({
    adminUserId,
    visitorEntryId: entry._id,
    visitorId: entry.visitorId,
    moduleName: 'visitor_entries',
    action: 'cancelled',
    oldValue,
    newValue: entry.toObject(),
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  return entry;
}

async function adminCloseEntry(id, adminUserId, meta = {}) {
  const entry = await getEntryById(id);
  if (entry.status !== 'inside_premises') {
    throw new AppError('Only active (inside premises) entries can be closed', 400);
  }

  const oldValue = entry.toObject();
  const now = new Date();
  entry.status = 'completed';
  entry.checkoutMethod = 'admin_close';
  entry.outTime = now;
  entry.visitDurationMinutes = diffInMinutes(entry.inTime, now);
  await entry.save();

  await writeAuditLog({
    adminUserId,
    visitorEntryId: entry._id,
    visitorId: entry.visitorId,
    moduleName: 'visitor_entries',
    action: 'admin_closed',
    oldValue,
    newValue: entry.toObject(),
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  return entry;
}

async function listOutSessions(reqQuery) {
  const { page, limit, skip } = getPagination(reqQuery);
  const query = {};

  if (reqQuery.search) {
    query.$or = [
      { visitorId: { $regex: reqQuery.search, $options: 'i' } },
      { mobileEntered: { $regex: reqQuery.search, $options: 'i' } },
    ];
  }

  const [sessions, total] = await Promise.all([
    VisitorOutSession.find(query).sort({ completedAt: -1 }).skip(skip).limit(limit).populate('visitorEntryId', 'visitorName'),
    VisitorOutSession.countDocuments(query),
  ]);

  const data = sessions.map((s) => ({
    _id: s._id,
    visitorId: s.visitorId,
    visitorName: s.visitorEntryId ? s.visitorEntryId.visitorName : null,
    mobileEntered: s.mobileEntered,
    outTime: s.completedAt,
    ipAddress: s.ipAddress,
    deviceInfo: s.deviceInfo,
    status: s.status,
  }));

  return { data, meta: buildMeta({ page, limit, total }) };
}

module.exports = {
  ACTIVE_ENTRY_QUERY,
  findActiveEntryByMobile,
  checkMobile,
  createCheckin,
  completeCheckout,
  buildListQuery,
  listEntries,
  listCurrentlyInside,
  getEntryById,
  updateEntry,
  cancelEntry,
  adminCloseEntry,
  listOutSessions,
};
