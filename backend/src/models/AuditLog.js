const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    visitorEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorEntry', default: null },
    visitorId: { type: String, default: null },
    moduleName: { type: String, default: null },
    action: {
      type: String,
      enum: [
        'in_submitted',
        'out_completed',
        'auto_closed',
        'edited',
        'cancelled',
        'admin_closed',
        'exported',
        'qr_created',
        'qr_updated',
        'settings_updated',
        'login',
        'autofill_used',
        'printed',
        'face_registered',
        'face_checkin_confirmed',
        'face_recognition_failed',
        'face_manual_override',
        'profile_updated',
      ],
      required: true,
    },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    deviceInfo: { type: String, default: null },
    actionAt: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: 'audit_logs' }
);

auditLogSchema.index({ visitorEntryId: 1 });
auditLogSchema.index({ visitorId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ actionAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
