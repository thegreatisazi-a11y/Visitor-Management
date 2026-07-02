const express = require('express');
const publicVisitorController = require('../controllers/publicVisitorController');
const validate = require('../middleware/validate');
const {
  checkMobileSchema,
  checkinSchema,
  checkoutSchema,
  registerWithFaceSchema,
  recognizeFaceSchema,
  confirmFaceCheckinSchema,
} = require('../validators/publicVisitorValidators');
const { publicVisitorLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(publicVisitorLimiter);

// Existing mobile-number flow (kept as fallback, unchanged).
router.post('/check-mobile', validate(checkMobileSchema), publicVisitorController.checkMobile);
router.get('/previous/:mobileNo', publicVisitorController.getPreviousByMobile);
router.post('/checkin', validate(checkinSchema), publicVisitorController.checkin);
router.get('/checkout/:visitorEntryId', publicVisitorController.getCheckoutDetails);
router.post('/checkout', validate(checkoutSchema), publicVisitorController.checkout);

// Face-recognition flow.
router.post('/register-with-face', validate(registerWithFaceSchema), publicVisitorController.registerWithFace);
router.post('/recognize-face', validate(recognizeFaceSchema), publicVisitorController.recognizeFace);
router.post('/confirm-face-checkin', validate(confirmFaceCheckinSchema), publicVisitorController.confirmFaceCheckin);
router.get('/profile/:visitorId', publicVisitorController.getProfileByVisitorId);

module.exports = router;
