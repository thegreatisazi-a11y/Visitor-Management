const express = require('express');
const adminUserController = require('../controllers/adminUserController');
const { protectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createAdminUserSchema,
  updateAdminUserSchema,
  resetPasswordSchema,
} = require('../validators/adminUserValidators');

const router = express.Router();

router.use(protectAdmin);

router.get('/', adminUserController.listAdminUsers);
router.post('/', validate(createAdminUserSchema), adminUserController.createAdminUser);
router.put('/:id', validate(updateAdminUserSchema), adminUserController.updateAdminUser);
router.post('/:id/deactivate', adminUserController.deactivateAdminUser);
router.post('/:id/reset-password', validate(resetPasswordSchema), adminUserController.resetPassword);

module.exports = router;
