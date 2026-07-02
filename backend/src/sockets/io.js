const { Server } = require('socket.io');
const env = require('../config/env');
const logger = require('../utils/logger');

// Singleton so services can emit without circular-importing server.js.
// emitEvent is a safe no-op before initSocket runs (e.g. in scripts/tests).
let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
  });

  return io;
}

function emitEvent(event, payload) {
  if (!io) return;
  io.emit(event, payload);
}

module.exports = { initSocket, emitEvent };
