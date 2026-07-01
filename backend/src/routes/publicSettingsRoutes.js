const express = require('express');
const { getPublicSettings } = require('../controllers/publicSettingsController');

const router = express.Router();

router.get('/', getPublicSettings);

module.exports = router;
