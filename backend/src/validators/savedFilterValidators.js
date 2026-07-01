const { z } = require('zod');

const createSavedFilterSchema = z.object({
  moduleName: z.string().trim().min(2, 'Module name is required'),
  filterName: z.string().trim().min(2, 'Filter name is required'),
  filterConfig: z.any(),
  isDefault: z.boolean().optional().default(false),
});

const updateSavedFilterSchema = z.object({
  filterName: z.string().trim().min(2).optional(),
  filterConfig: z.any().optional(),
  isDefault: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

module.exports = { createSavedFilterSchema, updateSavedFilterSchema };
