const mongoose = require('mongoose');

const visitorQrCodeSchema = new mongoose.Schema(
  {
    qrName: { type: String, required: true, trim: true },
    qrType: { type: String, enum: ['visitor_portal'], default: 'visitor_portal' },
    qrToken: { type: String, required: true, unique: true },
    qrUrl: { type: String, required: true },
    locationName: { type: String, default: 'Reception', trim: true },
    usageCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'visitor_qr_codes' }
);

module.exports = mongoose.model('VisitorQrCode', visitorQrCodeSchema);
