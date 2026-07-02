import { io } from 'socket.io-client';

// Single shared connection to the API origin. VITE_API_BASE_URL includes the /api
// suffix; Socket.IO connects to the bare origin, so strip it.
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const origin = apiBase.replace(/\/api\/?$/, '');

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(origin, { withCredentials: true, transports: ['websocket', 'polling'] });
  }
  return socket;
}

// Subscribe to several events with one handler; returns an unsubscribe cleanup
// for use as a useEffect return value.
export function subscribe(events, handler) {
  const s = getSocket();
  events.forEach((e) => s.on(e, handler));
  return () => events.forEach((e) => s.off(e, handler));
}
