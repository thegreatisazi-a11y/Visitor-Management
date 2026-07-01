const mongoose = require('mongoose');

const autoCloseRunSchema = new mongoose.Schema(
  {
    runDate: { type: Date, required: true },
    scheduledTime: { type: String, default: '00:00' },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    totalEntriesFound: { type: Number, default: 0 },
    totalEntriesClosed: { type: Number, default: 0 },
    status: { type: String, enum: ['success', 'failed', 'partial'], default: 'success' },
    errorMessage: { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false }, collection: 'auto_close_runs' }
);

module.exports = mongoose.model('AutoCloseRun', autoCloseRunSchema);
