import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function authHeader() {
  const raw =
    localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  const token = String(raw).replace(/^"|"$/g, "").replace(/^Bearer\s+/i, "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createLocationShare(durationMinutes) {
  const { data } = await axios.post(
    `${API_URL}/location-shares`,
    { durationMinutes },
    { headers: authHeader() },
  );
  return data;
}

export async function getLocationShare(token) {
  const { data } = await axios.get(`${API_URL}/location-shares/${token}`);
  return data;
}

export async function stopLocationShare(token) {
  const { data } = await axios.delete(`${API_URL}/location-shares/${token}`, {
    headers: authHeader(),
  });
  return data;
}

export async function myActiveSessions() {
  const { data } = await axios.get(`${API_URL}/location-shares/my/active`, {
    headers: authHeader(),
  });
  return data;
}
