const mongoose = require('mongoose');

const visitorEntrySchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, unique: true },
    visitDate: { type: Date, required: true },
    visitorName: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    mobileNo: { type: String, required: true, trim: true },
    emailId: { type: String, required: true, trim: true, lowercase: true },
    purposeOfVisit: { type: String, required: true, trim: true },
    personToMeet: { type: String, required: true, trim: true },
    remarks: { type: String, default: '', trim: true },

    inTime: { type: Date, required: true },
    outTime: { type: Date, default: null },

    status: {
      type: String,
      enum: ['inside_premises', 'completed', 'auto_closed', 'cancelled'],
      default: 'inside_premises',
    },
    checkoutMethod: {
      type: String,
      enum: ['mobile_self_out', 'auto_midnight', 'admin_close', null],
      default: null,
    },
    visitDurationMinutes: { type: Number, default: null },

    qrCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorQrCode', default: null },
    entrySessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorEntrySession', default: null },

    notes: { type: String, default: '' },

    autoClosedAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'visitor_entries' }
);

visitorEntrySchema.index({ visitDate: 1 });
visitorEntrySchema.index({ visitorName: 1 });
visitorEntrySchema.index({ companyName: 1 });
visitorEntrySchema.index({ mobileNo: 1 });
visitorEntrySchema.index({ emailId: 1 });
visitorEntrySchema.index({ purposeOfVisit: 1 });
visitorEntrySchema.index({ personToMeet: 1 });
visitorEntrySchema.index({ inTime: 1 });
visitorEntrySchema.index({ outTime: 1 });
visitorEntrySchema.index({ status: 1 });
visitorEntrySchema.index({ checkoutMethod: 1 });
visitorEntrySchema.index({ createdAt: 1 });
visitorEntrySchema.index({ mobileNo: 1, status: 1 });

module.exports = mongoose.model('VisitorEntry', visitorEntrySchema);
