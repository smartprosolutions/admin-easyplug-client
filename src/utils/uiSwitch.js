import { issueUiSwitchTicket } from "../services/authService";

export const CLIENT_APP_URL = String(
  import.meta.env.VITE_CLIENT_URL || "http://localhost:5173",
).replace(/\/$/, "");

export function persistUiSwitchSession(response) {
  const token =
    response?.accessToken || response?.token || response?.user?.token;
  if (!token) {
    throw new Error(response?.message || "Could not continue signed-in session.");
  }
  localStorage.setItem("access_token", token);
  return token;
}

export async function switchToMarketplace() {
  const data = await issueUiSwitchTicket();
  const ticket = data?.ticket;
  if (!ticket) {
    throw new Error(data?.message || "Could not start shopping mode.");
  }
  window.location.assign(
    `${CLIENT_APP_URL}/switch?ticket=${encodeURIComponent(ticket)}`,
  );
}
