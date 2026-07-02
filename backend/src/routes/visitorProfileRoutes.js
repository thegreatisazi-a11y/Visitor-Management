const express = require('express');
const visitorProfileController = require('../controllers/visitorProfileController');
const { protectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfileSchema, reregisterFaceSchema } = require('../validators/visitorProfileValidators');

const router = express.Router();

router.use(protectAdmin);

router.get('/', visitorProfileController.listProfiles);
router.get('/:id', visitorProfileController.getProfile);
router.get('/:id/photo', visitorProfileController.getProfilePhoto);
router.put('/:id', validate(updateProfileSchema), visitorProfileController.updateProfile);
router.post('/:id/reregister-face', validate(reregisterFaceSchema), visitorProfileController.reregisterFace);
router.post('/:id/face-checkout', visitorProfileController.faceCheckout);

module.exports = router;
