const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const AdminUser = require('../models/AdminUser');

const protectAdmin = catchAsync(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to continue.', 401));
  }

  const decoded = jwt.verify(token, env.JWT_SECRET);

  const admin = await AdminUser.findById(decoded.id);
  if (!admin) {
    return next(new AppError('The admin user for this token no longer exists.', 401));
  }
  if (admin.status !== 'active') {
    return next(new AppError('Your account is not active. Contact the system administrator.', 403));
  }

  req.admin = admin;
  next();
});

function signToken(adminId) {
  return jwt.sign({ id: adminId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

module.exports = { protectAdmin, signToken };
