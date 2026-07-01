const mongoose = require('mongoose');

const visitorEntrySessionSchema = new mongoose.Schema(
  {
    qrCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorQrCode', default: null },
    sessionToken: { type: String, required: true, unique: true },
    mobileEntered: { type: String, required: true, trim: true },
    ipAddress: { type: String, default: null },
    deviceInfo: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    status: { type: String, enum: ['started', 'submitted', 'expired'], default: 'started' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false }, collection: 'visitor_entry_sessions' }
);

module.exports = mongoose.model('VisitorEntrySession', visitorEntrySessionSchema);
