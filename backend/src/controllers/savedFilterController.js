const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const SavedFilter = require('../models/SavedFilter');

const listSavedFilters = catchAsync(async (req, res) => {
  const query = { adminUserId: req.admin._id };
  if (req.query.moduleName) query.moduleName = req.query.moduleName;

  const filters = await SavedFilter.find(query).sort({ createdAt: -1 });
  sendSuccess(res, { data: filters });
});

const createSavedFilter = catchAsync(async (req, res) => {
  const { moduleName, filterName, filterConfig, isDefault } = req.body;

  if (isDefault) {
    await SavedFilter.updateMany({ adminUserId: req.admin._id, moduleName }, { isDefault: false });
  }

  const filter = await SavedFilter.create({
    adminUserId: req.admin._id,
    moduleName,
    filterName,
    filterConfig,
    isDefault: !!isDefault,
  });

  sendSuccess(res, { statusCode: 201, message: 'Filter saved', data: filter });
});

const updateSavedFilter = catchAsync(async (req, res, next) => {
  const filter = await SavedFilter.findOne({ _id: req.params.id, adminUserId: req.admin._id });
  if (!filter) return next(new AppError('Saved filter not found', 404));

  if (req.body.isDefault) {
    await SavedFilter.updateMany(
      { adminUserId: req.admin._id, moduleName: filter.moduleName, _id: { $ne: filter._id } },
      { isDefault: false }
    );
  }

  Object.assign(filter, req.body);
  await filter.save();

  sendSuccess(res, { message: 'Filter updated', data: filter });
});

const deleteSavedFilter = catchAsync(async (req, res, next) => {
  const filter = await SavedFilter.findOneAndDelete({ _id: req.params.id, adminUserId: req.admin._id });
  if (!filter) return next(new AppError('Saved filter not found', 404));
  sendSuccess(res, { message: 'Filter deleted' });
});

module.exports = { listSavedFilters, createSavedFilter, updateSavedFilter, deleteSavedFilter };
