const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const { getAllSettings } = require('../services/settingsService');

const PUBLIC_KEYS = ['companyLogo', 'companyName', 'visitorPolicyText', 'emailMandatory'];

const getPublicSettings = catchAsync(async (req, res) => {
  const all = await getAllSettings();
  const publicSettings = {};
  PUBLIC_KEYS.forEach((key) => {
    publicSettings[key] = all[key];
  });
  sendSuccess(res, { data: publicSettings });
});

module.exports = { getPublicSettings };
