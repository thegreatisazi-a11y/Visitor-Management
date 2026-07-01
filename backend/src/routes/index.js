const express = require('express');

const publicVisitorRoutes = require('./publicVisitorRoutes');
const publicSettingsRoutes = require('./publicSettingsRoutes');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const visitorRoutes = require('./visitorRoutes');
const currentlyInsideRoutes = require('./currentlyInsideRoutes');
const outSessionRoutes = require('./outSessionRoutes');
const qrRoutes = require('./qrRoutes');
const reportRoutes = require('./reportRoutes');
const auditRoutes = require('./auditRoutes');
const savedFilterRoutes = require('./savedFilterRoutes');
const settingsRoutes = require('./settingsRoutes');
const adminUserRoutes = require('./adminUserRoutes');

const router = express.Router();

router.use('/public/visitor', publicVisitorRoutes);
router.use('/public/settings', publicSettingsRoutes);

router.use('/admin/auth', authRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/admin/visitors', visitorRoutes);
router.use('/admin/currently-inside', currentlyInsideRoutes);
router.use('/admin/out-sessions', outSessionRoutes);
router.use('/admin/qr', qrRoutes);
router.use('/admin/reports', reportRoutes);
router.use('/admin/audit-logs', auditRoutes);
router.use('/admin/saved-filters', savedFilterRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/admin/users', adminUserRoutes);

module.exports = router;
