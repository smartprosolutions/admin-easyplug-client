import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/login/google",
  "/auth/register",
  "/auth/register/seller",
  "/auth/check-seller-registration",
  "/auth/send-code",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-code",
  "/auth/ui-switch-consume",
];

const shouldAttachAuthHeader = (url = "") =>
  !PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.startsWith(endpoint));

const axiosClient = axios.create({
  baseURL: API_URL,
});

// Attach token if present in localStorage
axiosClient.interceptors.request.use((config) => {
  if (!shouldAttachAuthHeader(config?.url)) {
    return config;
  }

  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error?.response && error?.message === "Network Error") {
      const isUpload =
        typeof FormData !== "undefined" &&
        error?.config?.data instanceof FormData;
      const enhancedError = new Error(
        isUpload
          ? `Could not complete the upload to ${API_URL}. The server closed the connection (often a proxy size limit). Try again, or ask an admin to raise nginx client_max_body_size to 15m.`
          : `Unable to reach API at ${API_URL}. Check backend availability and CORS settings.`,
      );
      enhancedError.name = "ApiNetworkError";
      return Promise.reject(enhancedError);
    }

    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const isAuthEndpoint = PUBLIC_AUTH_ENDPOINTS.some((endpoint) =>
      requestUrl.includes(endpoint),
    );

    if (status === 401 && !isAuthEndpoint) {
      try {
        localStorage.removeItem("access_token");
      } catch {
        // ignore
      }
      if (typeof window !== "undefined") {
        const path = window.location.pathname || "";
        // Don't kick users off registration when a stale token fails /auth/me
        if (
          !path.startsWith("/login") &&
          !path.startsWith("/register")
        ) {
          window.location.assign("/login");
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
