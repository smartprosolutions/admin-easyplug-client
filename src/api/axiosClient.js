import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://easyplug-api.duckdns.org:8000/api/v1";

const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/login/google",
  "/auth/register",
  "/auth/register/seller",
  "/auth/send-code",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-code",
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
      const enhancedError = new Error(
        `Unable to reach API at ${API_URL}. Check backend availability and CORS settings.`,
      );
      enhancedError.name = "ApiNetworkError";
      return Promise.reject(enhancedError);
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
