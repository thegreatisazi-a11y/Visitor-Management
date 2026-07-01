const express = require('express');
const settingsController = require('../controllers/settingsController');
const { protectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateSettingsSchema } = require('../validators/settingsValidators');

const router = express.Router();

router.use(protectAdmin);

router.get('/', settingsController.getSettings);
router.put('/', validate(updateSettingsSchema), settingsController.putSettings);

module.exports = router;
