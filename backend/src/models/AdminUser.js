const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'admin_users' }
);

adminUserSchema.index({ mobile: 1 });
adminUserSchema.index({ status: 1 });

module.exports = mongoose.model('AdminUser', adminUserSchema);
