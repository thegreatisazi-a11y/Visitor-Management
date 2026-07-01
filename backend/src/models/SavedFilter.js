const mongoose = require('mongoose');

const savedFilterSchema = new mongoose.Schema(
  {
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    moduleName: { type: String, required: true, trim: true },
    filterName: { type: String, required: true, trim: true },
    filterConfig: { type: mongoose.Schema.Types.Mixed, required: true },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'saved_filters' }
);

savedFilterSchema.index({ adminUserId: 1, moduleName: 1 });

module.exports = mongoose.model('SavedFilter', savedFilterSchema);
