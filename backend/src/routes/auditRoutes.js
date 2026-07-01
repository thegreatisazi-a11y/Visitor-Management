const express = require('express');
const auditController = require('../controllers/auditController');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(protectAdmin);
router.get('/', auditController.listAuditLogs);

module.exports = router;
