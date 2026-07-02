const fs = require('fs');
const path = require('path');
const VisitorProfile = require('../models/VisitorProfile');
const VisitorEntry = require('../models/VisitorEntry');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const generateVisitorId = require('../utils/generateVisitorId');
const { startOfDay, diffInMinutes } = require('../utils/dateHelpers');
const { getPagination, buildMeta } = require('../utils/pagination');
const { writeAuditLog } = require('./auditService');
const faceAiService = require('./faceAiService');
const { emitEvent } = require('../sockets/io');

const PHOTOS_DIR = path.join(process.cwd(), env.UPLOAD_DIR, 'visitor-photos');

const AI_FAILURE_MESSAGES = {
  no_face: 'Face not detected. Please try again.',
  multiple_faces: 'Multiple faces detected. Please ensure only one visitor is in camera.',
  low_quality: 'Image too blurry or face too small. Please retake in better lighting.',
  invalid_image: 'The captured image could not be processed. Please try again.',
};

function ensurePhotosDir() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }
}

function decodeImagePayload(imageBase64) {
  const base64Data = imageBase64.replace(/^data:image\/(jpeg|jpg|png);base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > env.FACE_PHOTO_MAX_SIZE_MB * 1024 * 1024) {
    throw new AppError(`Photo exceeds the ${env.FACE_PHOTO_MAX_SIZE_MB}MB size limit`, 413);
  }
  return buffer;
}

function savePhoto(visitorId, imageBase64) {
  ensurePhotosDir();
  const buffer = decodeImagePayload(imageBase64);
  const fileName = `${visitorId}.jpg`;
  fs.writeFileSync(path.join(PHOTOS_DIR, fileName), buffer);
  return `visitor-photos/${fileName}`;
}

function photoAbsolutePath(photoUrl) {
  return path.join(process.cwd(), env.UPLOAD_DIR, photoUrl);
}

function readPhotoAsThumbnail(photoUrl) {
  if (!photoUrl) return null;
  try {
    const buffer = fs.readFileSync(photoAbsolutePath(photoUrl));
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

async function findActiveEntryByProfileId(visitorProfileId) {
  return VisitorEntry.findOne({ visitorProfileId, status: 'inside_premises', outTime: null }).sort({ inTime: -1 });
}

async function createProfileWithFace(payload, meta = {}) {
  const visitorId = await generateVisitorId(new Date());

  const aiResult = await faceAiService.registerFace(visitorId, payload.imageBase64);
  if (!aiResult.success) {
    await writeAuditLog({
      moduleName: 'visitor_profiles',
      action: 'face_recognition_failed',
      newValue: { stage: 'registration', reason: aiResult.reason },
      ipAddress: meta.ipAddress,
      deviceInfo: meta.deviceInfo,
    });
    throw new AppError(AI_FAILURE_MESSAGES[aiResult.reason] || 'Face could not be processed. Please try again.', 422);
  }

  const photoUrl = savePhoto(visitorId, payload.imageBase64);
  const now = new Date();

  const profile = await VisitorProfile.create({
    visitorId,
    visitorName: payload.visitorName,
    companyName: payload.companyName,
    mobileNo: payload.mobileNo || '',
    emailId: payload.emailId || '',
    address: payload.address || '',
    photoUrl,
    faceEmbedding: aiResult.embedding,
    faceEmbeddingModel: aiResult.model,
    faceRegistered: true,
    faceRegisteredAt: now,
    consentGiven: true,
    consentGivenAt: now,
  });

  await writeAuditLog({
    visitorId: profile.visitorId,
    moduleName: 'visitor_profiles',
    action: 'face_registered',
    newValue: { visitorProfileId: profile._id, qualityScore: aiResult.qualityScore },
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  emitEvent('visitorFaceRegistered', { visitorId: profile.visitorId, visitorName: profile.visitorName });

  return profile;
}

async function createEntryForProfile(profile, entryPayload, { entryMethod, confidenceScore = null }, meta = {}) {
  const existingActive = await findActiveEntryByProfileId(profile._id);
  if (existingActive) {
    throw new AppError('This visitor is already checked in.', 409);
  }

  const now = new Date();
  const entryVisitorId = await generateVisitorId(now);

  const entry = await VisitorEntry.create({
    visitorId: entryVisitorId,
    visitDate: startOfDay(now),
    visitorName: profile.visitorName,
    companyName: profile.companyName || entryPayload.companyName || '-',
    address: profile.address || entryPayload.address || '-',
    mobileNo: profile.mobileNo || entryPayload.mobileNo || '0000000000',
    emailId: profile.emailId || entryPayload.emailId || 'not.provided@visitor.com',
    purposeOfVisit: entryPayload.purposeOfVisit,
    personToMeet: entryPayload.personToMeet,
    remarks: entryPayload.remarks || '',
    inTime: now,
    status: 'inside_premises',
    visitorProfileId: profile._id,
    entryMethod,
    confidenceScore,
  });

  const auditAction = entryMethod === 'face_recognition' ? 'face_checkin_confirmed' : 'in_submitted';
  await writeAuditLog({
    visitorEntryId: entry._id,
    visitorId: entry.visitorId,
    moduleName: 'visitor_entries',
    action: auditAction,
    newValue: { entryMethod, confidenceScore, visitorProfileId: profile._id },
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  emitEvent('visitorCheckedIn', {
    visitorId: entry.visitorId,
    visitorName: entry.visitorName,
    entryMethod,
    status: entry.status,
  });

  return entry;
}

async function recognizeVisitor(imageBase64, meta = {}) {
  const registeredProfiles = await VisitorProfile.find({ faceRegistered: true, status: 'active' })
    .select('+faceEmbedding visitorId')
    .lean();

  const candidates = registeredProfiles.map((p) => ({ visitorId: p.visitorId, embedding: p.faceEmbedding }));

  const aiResult = await faceAiService.recognizeFace(imageBase64, candidates);

  const failRecognition = async (reason, extra = {}) => {
    await writeAuditLog({
      moduleName: 'visitor_profiles',
      action: 'face_recognition_failed',
      newValue: { stage: 'recognition', reason, ...extra },
      ipAddress: meta.ipAddress,
      deviceInfo: meta.deviceInfo,
    });
    emitEvent('visitorRecognitionFailed', { reason });
  };

  if (!aiResult.success) {
    await failRecognition(aiResult.reason);
    return { outcome: aiResult.reason };
  }

  const best = aiResult.matches[0];
  if (!best || best.confidence < env.FACE_RECOGNITION_THRESHOLD) {
    await failRecognition('low_confidence', { bestConfidence: best ? best.confidence : null });
    return { outcome: 'low_confidence' };
  }

  const profile = await VisitorProfile.findOne({ visitorId: best.visitorId });
  if (!profile) {
    await failRecognition('profile_missing', { matchedVisitorId: best.visitorId });
    return { outcome: 'low_confidence' };
  }

  const activeEntry = await findActiveEntryByProfileId(profile._id);
  if (activeEntry) {
    return { outcome: 'already_checked_in', profile, confidence: best.confidence };
  }

  const lastEntry = await VisitorEntry.findOne({ visitorProfileId: profile._id }).sort({ inTime: -1 });

  return { outcome: 'matched', profile, confidence: best.confidence, lastEntry };
}

async function confirmFaceCheckin(visitorProfileId, entryPayload, confidence, meta = {}) {
  const profile = await VisitorProfile.findById(visitorProfileId);
  if (!profile) throw new AppError('Visitor profile not found', 404);

  return createEntryForProfile(profile, entryPayload, { entryMethod: 'face_recognition', confidenceScore: confidence }, meta);
}

async function getProfileByVisitorId(visitorId) {
  const profile = await VisitorProfile.findOne({ visitorId });
  if (!profile) throw new AppError('Visitor profile not found', 404);
  return profile;
}

async function listProfiles(reqQuery) {
  const { page, limit, skip } = getPagination(reqQuery);
  const query = {};
  if (reqQuery.search) {
    const regex = { $regex: reqQuery.search, $options: 'i' };
    query.$or = [{ visitorId: regex }, { visitorName: regex }, { mobileNo: regex }, { companyName: regex }];
  }
  if (reqQuery.faceRegistered === 'true') query.faceRegistered = true;
  else if (reqQuery.faceRegistered === 'false') query.faceRegistered = false;

  const [data, total] = await Promise.all([
    VisitorProfile.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    VisitorProfile.countDocuments(query),
  ]);

  return { data, meta: buildMeta({ page, limit, total }) };
}

async function getProfileById(id) {
  const profile = await VisitorProfile.findById(id);
  if (!profile) throw new AppError('Visitor profile not found', 404);
  return profile;
}

// Future auto-checkout readiness: closes a profile's active visit with the reserved
// face_auto method. Only reachable via the admin-protected route today; the camera
// loop that would call this automatically is deliberately not built yet.
async function faceCheckout(visitorProfileId, adminUserId, meta = {}) {
  const entry = await findActiveEntryByProfileId(visitorProfileId);
  if (!entry) throw new AppError('No active visit found for this visitor profile', 404);

  const now = new Date();
  entry.status = 'completed';
  entry.outTime = now;
  entry.checkoutMethod = 'face_auto';
  entry.visitDurationMinutes = diffInMinutes(entry.inTime, now);
  await entry.save();

  await writeAuditLog({
    adminUserId,
    visitorEntryId: entry._id,
    visitorId: entry.visitorId,
    moduleName: 'visitor_entries',
    action: 'out_completed',
    newValue: { checkoutMethod: 'face_auto', outTime: entry.outTime },
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  emitEvent('visitorCheckedOut', { visitorId: entry.visitorId, visitorName: entry.visitorName, status: entry.status });

  return entry;
}

// Admin edits a visitor's stored contact details (not the face). Auditable.
async function updateProfile(id, updates, adminUserId, meta = {}) {
  const profile = await getProfileById(id);
  const oldValue = {
    visitorName: profile.visitorName,
    companyName: profile.companyName,
    mobileNo: profile.mobileNo,
    emailId: profile.emailId,
    address: profile.address,
  };

  const allowed = ['visitorName', 'companyName', 'mobileNo', 'emailId', 'address'];
  allowed.forEach((f) => {
    if (updates[f] !== undefined) profile[f] = updates[f];
  });
  await profile.save();

  await writeAuditLog({
    adminUserId,
    visitorId: profile.visitorId,
    moduleName: 'visitor_profiles',
    action: 'profile_updated',
    oldValue,
    newValue: { visitorName: profile.visitorName, companyName: profile.companyName, mobileNo: profile.mobileNo, emailId: profile.emailId, address: profile.address },
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  return profile;
}

// Admin re-captures/replaces a visitor's registered face (the one exception to
// "selfie captured only once"). Re-runs the AI pipeline and overwrites the
// embedding + photo. Logged as a manual override of the biometric.
async function reregisterFace(id, imageBase64, adminUserId, meta = {}) {
  const profile = await getProfileById(id);

  const aiResult = await faceAiService.registerFace(profile.visitorId, imageBase64);
  if (!aiResult.success) {
    throw new AppError(AI_FAILURE_MESSAGES[aiResult.reason] || 'Face could not be processed. Please try again.', 422);
  }

  const photoUrl = savePhoto(profile.visitorId, imageBase64);
  profile.photoUrl = photoUrl;
  profile.faceEmbedding = aiResult.embedding;
  profile.faceEmbeddingModel = aiResult.model;
  profile.faceRegistered = true;
  profile.faceRegisteredAt = new Date();
  await profile.save();

  await writeAuditLog({
    adminUserId,
    visitorId: profile.visitorId,
    moduleName: 'visitor_profiles',
    action: 'face_manual_override',
    newValue: { visitorProfileId: profile._id, qualityScore: aiResult.qualityScore, reason: 're_registered' },
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
  });

  emitEvent('visitorFaceRegistered', { visitorId: profile.visitorId, visitorName: profile.visitorName });

  return profile;
}

module.exports = {
  createProfileWithFace,
  createEntryForProfile,
  recognizeVisitor,
  confirmFaceCheckin,
  getProfileByVisitorId,
  listProfiles,
  getProfileById,
  faceCheckout,
  updateProfile,
  reregisterFace,
  findActiveEntryByProfileId,
  readPhotoAsThumbnail,
  photoAbsolutePath,
};
