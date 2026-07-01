const express = require('express');
const publicVisitorController = require('../controllers/publicVisitorController');
const validate = require('../middleware/validate');
const { checkMobileSchema, checkinSchema, checkoutSchema } = require('../validators/publicVisitorValidators');
const { publicVisitorLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(publicVisitorLimiter);

router.post('/check-mobile', validate(checkMobileSchema), publicVisitorController.checkMobile);
router.get('/previous/:mobileNo', publicVisitorController.getPreviousByMobile);
router.post('/checkin', validate(checkinSchema), publicVisitorController.checkin);
router.get('/checkout/:visitorEntryId', publicVisitorController.getCheckoutDetails);
router.post('/checkout', validate(checkoutSchema), publicVisitorController.checkout);

module.exports = router;
