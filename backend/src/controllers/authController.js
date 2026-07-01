const bcrypt = require('bcrypt');
const crypto = require('crypto');
const AdminUser = require('../models/AdminUser');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { signToken } = require('../middleware/auth');
const { writeAuditLog } = require('../services/auditService');
const env = require('../config/env');

function sanitizeAdmin(admin) {
  const obj = admin.toObject ? admin.toObject() : admin;
  delete obj.passwordHash;
  return obj;
}

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const admin = await AdminUser.findOne({ email }).select('+passwordHash');
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return next(new AppError('Invalid email or password', 401));
  }
  if (admin.status !== 'active') {
    return next(new AppError('Your account is not active. Contact the system administrator.', 403));
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: env.JWT_COOKIE_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  });

  await writeAuditLog({
    adminUserId: admin._id,
    moduleName: 'auth',
    action: 'login',
    ipAddress: req.clientIp,
    deviceInfo: req.deviceInfo,
  });

  sendSuccess(res, { message: 'Login successful', data: { token, admin: sanitizeAdmin(admin) } });
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie('token');
  sendSuccess(res, { message: 'Logged out successfully' });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const admin = await AdminUser.findOne({ email });

  const genericResponse = () =>
    sendSuccess(res, {
      message: 'If an account with that email exists, password reset instructions have been generated.',
    });

  if (!admin) return genericResponse();

  const tempPassword = crypto.randomBytes(6).toString('hex');
  admin.passwordHash = await bcrypt.hash(tempPassword, 12);
  await admin.save();

  genericResponse();

  if (env.NODE_ENV !== 'production') {
    // No email service is configured for this project. In development, the temporary
    // password is logged so the flow can be tested end-to-end.
    // eslint-disable-next-line no-console
    console.log(`[DEV] Temporary password for ${email}: ${tempPassword}`);
  }
});

const me = catchAsync(async (req, res) => {
  sendSuccess(res, { data: sanitizeAdmin(req.admin) });
});

module.exports = { login, logout, forgotPassword, me };
