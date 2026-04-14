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

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
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
