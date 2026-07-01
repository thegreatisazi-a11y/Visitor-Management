const mongoose = require('mongoose');

const reportExportSchema = new mongoose.Schema(
  {
    exportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    reportName: { type: String, required: true },
    reportType: {
      type: String,
      enum: [
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'custom',
        'currently_inside',
        'completed',
        'auto_closed',
        'cancelled',
        'average_visit',
        'average_duration',
      ],
      required: true,
    },
    dateFrom: { type: Date, default: null },
    dateTo: { type: Date, default: null },
    filtersUsed: { type: mongoose.Schema.Types.Mixed, default: {} },
    fileFormat: { type: String, enum: ['excel', 'csv', 'pdf'], required: true },
    filePath: { type: String, default: null },
    exportedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['generated', 'failed'], default: 'generated' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false }, collection: 'report_exports' }
);

module.exports = mongoose.model('ReportExport', reportExportSchema);
