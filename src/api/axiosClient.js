import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/login/google",
  "/auth/register",
  "/auth/register/seller",
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
          ? `Upload to ${API_URL} failed before the server responded. Check your connection, or try again.`
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
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
