const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

const getSummary = catchAsync(async (req, res) => {
  const summary = await dashboardService.getSummary();
  sendSuccess(res, { data: summary });
});

const getAnalytics = catchAsync(async (req, res) => {
  const analytics = await dashboardService.getAnalytics();
  sendSuccess(res, { data: analytics });
});

const getCharts = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const charts = await dashboardService.getCharts({ days });
  sendSuccess(res, { data: charts });
});

module.exports = { getSummary, getAnalytics, getCharts };
