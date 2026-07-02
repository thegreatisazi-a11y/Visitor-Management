const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const visitorProfileService = require('../services/visitorProfileService');

// Admin-facing profile shape: includes contact fields (admin is authenticated),
// still never the faceEmbedding (schema select:false guarantees it).
function serializeProfile(profile) {
  return {
    _id: profile._id,
    visitorId: profile.visitorId,
    visitorName: profile.visitorName,
    companyName: profile.companyName,
    mobileNo: profile.mobileNo,
    emailId: profile.emailId,
    address: profile.address,
    faceRegistered: profile.faceRegistered,
    faceRegisteredAt: profile.faceRegisteredAt,
    status: profile.status,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

const listProfiles = catchAsync(async (req, res) => {
  const { data, meta } = await visitorProfileService.listProfiles(req.query);
  sendSuccess(res, { data: data.map(serializeProfile), meta });
});

const getProfile = catchAsync(async (req, res) => {
  const profile = await visitorProfileService.getProfileById(req.params.id);
  sendSuccess(res, { data: serializeProfile(profile) });
});

// JWT-protected photo stream - admins view visitor photos only while authenticated.
const getProfilePhoto = catchAsync(async (req, res, next) => {
  const profile = await visitorProfileService.getProfileById(req.params.id);
  if (!profile.photoUrl) return next(new AppError('No photo on file for this visitor', 404));

  const absPath = visitorProfileService.photoAbsolutePath(profile.photoUrl);
  if (!fs.existsSync(absPath)) return next(new AppError('Photo file not found', 404));

  res.set('Content-Type', 'image/jpeg');
  fs.createReadStream(absPath).pipe(res);
});

const faceCheckout = catchAsync(async (req, res) => {
  const entry = await visitorProfileService.faceCheckout(req.params.id, req.admin._id, {
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { message: 'Visitor checked out', data: entry });
});

const updateProfile = catchAsync(async (req, res) => {
  const profile = await visitorProfileService.updateProfile(req.params.id, req.body, req.admin._id, {
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { message: 'Profile updated', data: serializeProfile(profile) });
});

const reregisterFace = catchAsync(async (req, res, next) => {
  if (!req.body.imageBase64) return next(new AppError('A captured image is required', 422));
  const profile = await visitorProfileService.reregisterFace(req.params.id, req.body.imageBase64, req.admin._id, {
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });
  sendSuccess(res, { message: 'Face re-registered successfully', data: serializeProfile(profile) });
});

module.exports = { listProfiles, getProfile, getProfilePhoto, faceCheckout, updateProfile, reregisterFace };
