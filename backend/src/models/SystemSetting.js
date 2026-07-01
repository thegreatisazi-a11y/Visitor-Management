const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    settingKey: { type: String, required: true, unique: true, trim: true },
    settingValue: { type: mongoose.Schema.Types.Mixed, default: null },
    settingType: { type: String, enum: ['text', 'number', 'boolean', 'json', 'file'], default: 'text' },
    description: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'system_settings' }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
