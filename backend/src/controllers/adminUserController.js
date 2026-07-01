const bcrypt = require('bcrypt');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const AdminUser = require('../models/AdminUser');
const { getPagination, buildMeta } = require('../utils/pagination');

const listAdminUsers = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [data, total] = await Promise.all([
    AdminUser.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    AdminUser.countDocuments(),
  ]);
  sendSuccess(res, { data, meta: buildMeta({ page, limit, total }) });
});

const createAdminUser = catchAsync(async (req, res) => {
  const { fullName, email, mobile, password, status } = req.body;

  const existing = await AdminUser.findOne({ email });
  if (existing) throw new AppError('An admin user with this email already exists', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await AdminUser.create({ fullName, email, mobile, passwordHash, status });

  sendSuccess(res, { statusCode: 201, message: 'Admin user created', data: admin });
});

const updateAdminUser = catchAsync(async (req, res, next) => {
  const admin = await AdminUser.findById(req.params.id);
  if (!admin) return next(new AppError('Admin user not found', 404));

  Object.assign(admin, req.body);
  await admin.save();

  sendSuccess(res, { message: 'Admin user updated', data: admin });
});

const deactivateAdminUser = catchAsync(async (req, res, next) => {
  const admin = await AdminUser.findById(req.params.id);
  if (!admin) return next(new AppError('Admin user not found', 404));

  admin.status = 'inactive';
  await admin.save();

  sendSuccess(res, { message: 'Admin user deactivated', data: admin });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const admin = await AdminUser.findById(req.params.id);
  if (!admin) return next(new AppError('Admin user not found', 404));

  admin.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await admin.save();

  sendSuccess(res, { message: 'Password reset successfully' });
});

module.exports = { listAdminUsers, createAdminUser, updateAdminUser, deactivateAdminUser, resetPassword };
