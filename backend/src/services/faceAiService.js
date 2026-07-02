const axios = require('axios');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// The ONLY module allowed to talk to the Python AI service. React never calls it
// directly; embeddings only ever travel Node <-> Python <-> Node.
const aiClient = axios.create({
  baseURL: env.AI_SERVICE_BASE_URL,
  timeout: env.AI_SERVICE_TIMEOUT_MS,
});

function toServiceUnavailable(err) {
  logger.error(`AI service call failed: ${err.message}`);
  return new AppError('Face recognition service is currently unavailable. Please try again shortly.', 502);
}

async function registerFace(visitorId, imageBase64) {
  try {
    const response = await aiClient.post('/ai/register-face', { visitorId, imageBase64 });
    return response.data;
  } catch (err) {
    throw toServiceUnavailable(err);
  }
}

async function recognizeFace(imageBase64, candidateEmbeddings) {
  try {
    const response = await aiClient.post('/ai/recognize-face', { imageBase64, candidateEmbeddings });
    return response.data;
  } catch (err) {
    throw toServiceUnavailable(err);
  }
}

async function healthCheck() {
  try {
    const response = await aiClient.get('/health');
    return response.data;
  } catch {
    return { status: 'unreachable', modelLoaded: false };
  }
}

module.exports = { registerFace, recognizeFace, healthCheck };
