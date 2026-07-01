const { z } = require('zod');

const createQrSchema = z.object({
  qrName: z.string().trim().min(2, 'QR name is required'),
  locationName: z.string().trim().min(2).optional().default('Reception'),
});

const updateQrSchema = z.object({
  qrName: z.string().trim().min(2).optional(),
  locationName: z.string().trim().min(2).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

module.exports = { createQrSchema, updateQrSchema };
