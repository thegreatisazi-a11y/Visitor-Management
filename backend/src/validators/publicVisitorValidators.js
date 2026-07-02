const { z } = require('zod');

const mobileSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/, 'Enter a valid email address ending with .com');

const checkMobileSchema = z.object({
  mobileNo: mobileSchema,
});

const checkinSchema = z.object({
  mobileNo: mobileSchema,
  visitorName: z
    .string()
    .trim()
    .min(2, 'Visitor name must be at least 2 characters')
    .regex(/^[A-Za-z. ]+$/, 'Visitor name can only contain letters, spaces and dot'),
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters'),
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  emailId: emailSchema,
  purposeOfVisit: z.string().trim().min(2, 'Purpose of visit must be at least 2 characters'),
  personToMeet: z.string().trim().min(2, 'Person to meet must be at least 2 characters'),
  remarks: z.string().trim().max(1000).optional().default(''),
  policyAgreed: z.literal(true, { errorMap: () => ({ message: 'You must agree to the visitor policy' }) }),
});

const checkoutSchema = z.object({
  mobileNo: mobileSchema.optional(),
  visitorEntryId: z.string().trim().optional(),
});

const imageBase64Schema = z
  .string()
  .min(100, 'Captured image is required')
  .regex(/^data:image\/(jpeg|jpg|png);base64,/, 'Image must be a JPEG or PNG data URL');

const registerWithFaceSchema = z.object({
  visitorName: z
    .string()
    .trim()
    .min(2, 'Visitor name must be at least 2 characters')
    .regex(/^[A-Za-z. ]+$/, 'Visitor name can only contain letters, spaces and dot'),
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters'),
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  mobileNo: mobileSchema,
  emailId: emailSchema,
  purposeOfVisit: z.string().trim().min(2, 'Purpose of visit must be at least 2 characters'),
  personToMeet: z.string().trim().min(2, 'Person to meet must be at least 2 characters'),
  remarks: z.string().trim().max(1000).optional().default(''),
  imageBase64: imageBase64Schema,
  policyAgreed: z.literal(true, { errorMap: () => ({ message: 'You must agree to the visitor policy' }) }),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to the use of your photo for visitor identification' }),
  }),
});

const recognizeFaceSchema = z.object({
  imageBase64: imageBase64Schema,
});

const confirmFaceCheckinSchema = z.object({
  visitorProfileId: z.string().trim().min(1, 'Visitor profile is required'),
  purposeOfVisit: z.string().trim().min(2, 'Purpose of visit must be at least 2 characters'),
  personToMeet: z.string().trim().min(2, 'Person to meet must be at least 2 characters'),
  remarks: z.string().trim().max(1000).optional().default(''),
  confidenceScore: z.number().min(0).max(1),
});

module.exports = {
  checkMobileSchema,
  checkinSchema,
  checkoutSchema,
  mobileSchema,
  emailSchema,
  registerWithFaceSchema,
  recognizeFaceSchema,
  confirmFaceCheckinSchema,
};
