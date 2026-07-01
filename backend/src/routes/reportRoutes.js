const express = require('express');
const reportController = require('../controllers/reportController');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(protectAdmin);

router.get('/', reportController.getReportData);
router.get('/exports', reportController.listExportHistory);
router.post('/export', reportController.exportReport);

module.exports = router;
