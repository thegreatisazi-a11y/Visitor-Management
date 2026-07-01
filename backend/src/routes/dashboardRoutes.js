const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(protectAdmin);
router.get('/summary', dashboardController.getSummary);
router.get('/charts', dashboardController.getCharts);
router.get('/analytics', dashboardController.getAnalytics);

module.exports = router;
