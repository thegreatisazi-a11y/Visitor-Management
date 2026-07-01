function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

module.exports = { sendSuccess };
