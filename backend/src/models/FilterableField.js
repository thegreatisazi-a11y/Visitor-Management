const mongoose = require('mongoose');

const filterableFieldSchema = new mongoose.Schema(
  {
    moduleName: { type: String, required: true, trim: true },
    tableName: { type: String, required: true, trim: true },
    fieldName: { type: String, required: true, trim: true },
    displayLabel: { type: String, required: true, trim: true },
    fieldType: {
      type: String,
      enum: ['text', 'date', 'datetime', 'time', 'number', 'dropdown'],
      required: true,
    },
    filterOperators: { type: [String], default: [] },
    isFilterable: { type: Boolean, default: true },
    isDefaultFilter: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'filterable_fields' }
);

filterableFieldSchema.index({ moduleName: 1, sortOrder: 1 });

module.exports = mongoose.model('FilterableField', filterableFieldSchema);
