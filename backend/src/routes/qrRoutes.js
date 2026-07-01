const express = require('express');
const qrController = require('../controllers/qrController');
const { protectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createQrSchema, updateQrSchema } = require('../validators/qrValidators');

const router = express.Router();

router.use(protectAdmin);

router.get('/', qrController.listQr);
router.post('/', validate(createQrSchema), qrController.createQr);
router.get('/:id', qrController.getQr);
router.put('/:id', validate(updateQrSchema), qrController.updateQr);
router.post('/:id/regenerate-token', qrController.regenerateToken);
router.get('/:id/download', qrController.downloadQr);

module.exports = router;
