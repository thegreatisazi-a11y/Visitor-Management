const express = require('express');
const visitorController = require('../controllers/visitorController');
const { protectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateVisitorSchema, cancelVisitorSchema } = require('../validators/visitorValidators');

const router = express.Router();

router.use(protectAdmin);

router.get('/', visitorController.listEntries);
router.get('/distinct/:field', visitorController.getDistinctValues);
router.post('/print-log', visitorController.logPrint);
router.get('/:id', visitorController.getEntry);
router.put('/:id', validate(updateVisitorSchema), visitorController.updateEntry);
router.post('/:id/cancel', validate(cancelVisitorSchema), visitorController.cancelEntry);
router.post('/:id/admin-close', visitorController.adminCloseEntry);

module.exports = router;
