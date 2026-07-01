const express = require('express');
const savedFilterController = require('../controllers/savedFilterController');
const { protectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createSavedFilterSchema, updateSavedFilterSchema } = require('../validators/savedFilterValidators');

const router = express.Router();

router.use(protectAdmin);

router.get('/', savedFilterController.listSavedFilters);
router.post('/', validate(createSavedFilterSchema), savedFilterController.createSavedFilter);
router.put('/:id', validate(updateSavedFilterSchema), savedFilterController.updateSavedFilter);
router.delete('/:id', savedFilterController.deleteSavedFilter);

module.exports = router;
