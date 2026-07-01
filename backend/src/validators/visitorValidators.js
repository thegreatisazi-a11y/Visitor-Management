const { z } = require('zod');
const { emailSchema, mobileSchema } = require('./publicVisitorValidators');

const updateVisitorSchema = z.object({
  visitorName: z.string().trim().min(2).optional(),
  companyName: z.string().trim().min(2).optional(),
  address: z.string().trim().min(5).optional(),
  mobileNo: mobileSchema.optional(),
  emailId: emailSchema.optional(),
  purposeOfVisit: z.string().trim().min(2).optional(),
  personToMeet: z.string().trim().min(2).optional(),
  remarks: z.string().trim().max(1000).optional(),
});

const cancelVisitorSchema = z.object({
  cancellationReason: z.string().trim().min(3, 'Cancellation reason is required'),
});

module.exports = { updateVisitorSchema, cancelVisitorSchema };
