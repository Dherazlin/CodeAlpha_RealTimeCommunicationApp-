import { io } from 'socket.io-client';

/**
 * Socket.io Client Utility for Korus Phase 3
 * Manages real-time meeting room connections, presence, and chat
 */

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');

/**
 * Create a new authenticated Socket.io client instance
 * @param {string} token - JWT authentication token
 * @returns {import('socket.io-client').Socket}
 */
export function createMeetingSocket(token) {
  return io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });
}
