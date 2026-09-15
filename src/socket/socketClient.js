import { io } from "socket.io-client";

const SOCKET_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/api\/v\d+$/, "");

let socket = null;

export function connectSocket() {
  const rawToken = localStorage.getItem("access_token");
  if (!rawToken) return null;

  const token = String(rawToken)
    .replace(/^"|"$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  // Testing nginx rejects the websocket upgrade (HTTP 400). Polling works.
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["polling"],
    upgrade: false,
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
