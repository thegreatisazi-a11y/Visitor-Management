const mongoose = require('mongoose');

const visitorOutSessionSchema = new mongoose.Schema(
  {
    visitorEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorEntry', required: true },
    visitorId: { type: String, required: true },
    qrCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorQrCode', default: null },
    mobileEntered: { type: String, required: true },
    ipAddress: { type: String, default: null },
    deviceInfo: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, required: true },
    status: { type: String, enum: ['completed'], default: 'completed' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false }, collection: 'visitor_out_sessions' }
);

visitorOutSessionSchema.index({ visitorEntryId: 1 });
visitorOutSessionSchema.index({ visitorId: 1 });
visitorOutSessionSchema.index({ mobileEntered: 1 });
visitorOutSessionSchema.index({ completedAt: 1 });

module.exports = mongoose.model('VisitorOutSession', visitorOutSessionSchema);
