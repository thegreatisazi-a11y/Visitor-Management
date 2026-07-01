const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

const createAdminUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  mobile: z.string().trim().optional().default(''),
  password: passwordSchema,
  status: z.enum(['active', 'inactive', 'blocked']).optional().default('active'),
});

const updateAdminUserSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  mobile: z.string().trim().optional(),
  status: z.enum(['active', 'inactive', 'blocked']).optional(),
});

const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

module.exports = { createAdminUserSchema, updateAdminUserSchema, resetPasswordSchema };
