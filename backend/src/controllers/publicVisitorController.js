const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const visitorService = require('../services/visitorService');
const qrService = require('../services/qrService');
const { writeAuditLog } = require('../services/auditService');
const { mobileSchema } = require('../validators/publicVisitorValidators');
const { formatDateDDMMYYYY, formatTimeHHMM } = require('../utils/dateHelpers');

function serializeEntry(entry) {
  return {
    id: entry._id,
    visitorId: entry.visitorId,
    visitDate: formatDateDDMMYYYY(entry.visitDate),
    visitorName: entry.visitorName,
    companyName: entry.companyName,
    address: entry.address,
    mobileNo: entry.mobileNo,
    emailId: entry.emailId,
    purposeOfVisit: entry.purposeOfVisit,
    personToMeet: entry.personToMeet,
    inTime: formatTimeHHMM(entry.inTime),
    outTime: entry.outTime ? formatTimeHHMM(entry.outTime) : null,
    visitDurationMinutes: entry.visitDurationMinutes,
    status: entry.status,
  };
}

const checkMobile = catchAsync(async (req, res) => {
  const { mobileNo } = req.body;
  const result = await visitorService.checkMobile(mobileNo);

  if (result.action === 'checkout') {
    return sendSuccess(res, {
      message: 'Active visit found',
      data: { action: 'checkout', entry: serializeEntry(result.entry) },
    });
  }

  sendSuccess(res, { message: 'No active visit found', data: { action: 'checkin' } });
});

const checkin = catchAsync(async (req, res) => {
  const qr = await qrService.getOrCreateDefaultQr();
  const entry = await visitorService.createCheckin(
    { ...req.body, qrCodeId: qr._id },
    { ipAddress: req.clientIp, deviceInfo: req.deviceInfo }
  );
  await qrService.incrementUsage(qr._id);

  sendSuccess(res, { statusCode: 201, message: 'Check-In Successful', data: serializeEntry(entry) });
});

const getCheckoutDetails = catchAsync(async (req, res, next) => {
  const entry = await visitorService.getEntryById(req.params.visitorEntryId);
  if (entry.status !== 'inside_premises') {
    return next(new AppError('This visit has already been completed', 400));
  }
  sendSuccess(res, { data: serializeEntry(entry) });
});

const checkout = catchAsync(async (req, res, next) => {
  const { mobileNo, visitorEntryId } = req.body;
  if (!mobileNo && !visitorEntryId) {
    return next(new AppError('mobileNo or visitorEntryId is required', 422));
  }

  const result = await visitorService.completeCheckout(
    { mobileNo, visitorEntryId },
    { ipAddress: req.clientIp, deviceInfo: req.deviceInfo }
  );

  if (!result.found) {
    return sendSuccess(res, {
      statusCode: 200,
      message: 'No active visit found for this mobile number.',
      data: { found: false },
    });
  }

  sendSuccess(res, { message: 'Check-Out Successful', data: { found: true, entry: serializeEntry(result.entry) } });
});

// Autofill support: looks up the visitor's own most recent past visit by mobile number
// so the IN form can pre-populate name/company/email/etc. Does not create or expose
// any separate visitor profile/master record - it only reads the latest visitor_entries row.
const getPreviousByMobile = catchAsync(async (req, res, next) => {
  const parsed = mobileSchema.safeParse(req.params.mobileNo);
  if (!parsed.success) {
    return next(new AppError('Mobile number must be exactly 10 digits', 422));
  }
  const mobileNo = parsed.data;

  const entry = await visitorService.findLatestByMobile(mobileNo);
  if (!entry) {
    return sendSuccess(res, { message: 'No previous visitor found', data: null });
  }

  await writeAuditLog({
    visitorEntryId: entry._id,
    visitorId: entry.visitorId,
    moduleName: 'visitor_entries',
    action: 'autofill_used',
    newValue: { mobileNo, sourceEntryId: entry._id },
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });

  sendSuccess(res, {
    message: 'Previous visitor details found',
    data: {
      visitorName: entry.visitorName,
      companyName: entry.companyName,
      address: entry.address,
      emailId: entry.emailId,
      purposeOfVisit: entry.purposeOfVisit,
      personToMeet: entry.personToMeet,
    },
  });
});

module.exports = { checkMobile, checkin, getCheckoutDetails, checkout, getPreviousByMobile };
