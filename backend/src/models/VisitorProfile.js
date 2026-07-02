const mongoose = require('mongoose');

// Persistent visitor identity anchoring a face embedding for recognition-based
// check-ins. This deliberately (and narrowly) overrides the original "no visitor
// master table" rule: it exists ONLY so returning visitors can be identified by
// face. Reporting, exports, and history must keep reading visitor_entries, which
// still snapshot all visit details per entry.
const visitorProfileSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, unique: true },
    visitorName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true, default: '' },
    mobileNo: { type: String, trim: true, default: '' },
    emailId: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },

    photoUrl: { type: String, default: null },
    // select:false is the structural guarantee that an embedding can never leak
    // into an API response - it must be explicitly .select('+faceEmbedding')ed,
    // which only the internal recognition candidate fetch is allowed to do.
    faceEmbedding: { type: [Number], default: null, select: false },
    faceEmbeddingModel: { type: String, default: null },
    faceRegistered: { type: Boolean, default: false },
    faceRegisteredAt: { type: Date, default: null },

    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    consentGiven: { type: Boolean, default: false },
    consentGivenAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'visitor_profiles' }
);

visitorProfileSchema.index({ mobileNo: 1 });
visitorProfileSchema.index({ faceRegistered: 1 });

module.exports = mongoose.model('VisitorProfile', visitorProfileSchema);
