const express = require('express');
const visitorController = require('../controllers/visitorController');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(protectAdmin);
router.get('/', visitorController.listOutSessions);

module.exports = router;
