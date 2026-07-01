const { z } = require('zod');

const updateSettingsSchema = z.record(z.string(), z.any());

module.exports = { updateSettingsSchema };
