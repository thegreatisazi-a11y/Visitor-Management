const { z } = require('zod');

const updateProfileSchema = z.object({
  visitorName: z.string().trim().min(2, 'Visitor name must be at least 2 characters').optional(),
  companyName: z.string().trim().min(2).optional(),
  address: z.string().trim().min(5).optional(),
  mobileNo: z.string().trim().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits').optional(),
  emailId: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/, 'Enter a valid email address ending with .com')
    .optional(),
});

const reregisterFaceSchema = z.object({
  imageBase64: z
    .string()
    .min(100, 'Captured image is required')
    .regex(/^data:image\/(jpeg|jpg|png);base64,/, 'Image must be a JPEG or PNG data URL'),
});

module.exports = { updateProfileSchema, reregisterFaceSchema };
