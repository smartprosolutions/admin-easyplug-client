import axiosClient from "../api/axiosClient";

export async function login({ email, password }) {
  // Adjust endpoint path if your backend uses a different route
  const resp = await axiosClient.post("/auth/login", { email, password });
  return resp.data;
}

export async function register(formData) {
  // Adjust endpoint path if your backend uses a different route
  const resp = await axiosClient.post("/auth/register", formData);
  return resp.data;
}

export async function registerSeller(formData, onProgress) {
  // New seller registration endpoint (supports FormData with files)
  const resp = await axiosClient.post("/auth/register/seller", formData, {
    headers:
      formData instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : {},
    onUploadProgress: (evt) => {
      try {
        if (!evt || !evt.total) return;
        const pct = Math.round((evt.loaded * 100) / evt.total);
        if (typeof onProgress === "function") onProgress(pct, evt);
      } catch {
        /* no-op */
      }
    }
  });
  return resp.data;
}

export async function sendVerificationCode({ email }) {
  // Adjust endpoint path as needed
  const resp = await axiosClient.post("/auth/send-code", { email });
  return resp.data;
}

export async function requestPasswordReset({ email }) {
  const resp = await axiosClient.post("/auth/forgot-password", { email });
  return resp.data;
}

export async function resetPassword({ token, password, email }) {
  const payload = { token, password };
  if (email) payload.email = email;
  const resp = await axiosClient.post("/auth/reset-password", payload);
  return resp.data;
}

export async function me() {
  // Calls the backend to verify the current token and return user info
  const resp = await axiosClient.get("/auth/me");
  return resp.data;
}

// Preferred name for fetching the full user profile (user + seller)
export async function getUserProfileInfo() {
  const resp = await axiosClient.get("/auth/me/full");
  return resp.data;
}

// Update user by id
export async function updateUser(id, payload) {
  const resp = await axiosClient.put(`/users/${id}`, payload);
  return resp.data;
}

// Upload current user's profile picture
export async function uploadProfilePicture(file) {
  const form = new FormData();
  // Backend expects field name 'profilePicture'
  form.append("profilePicture", file, file?.name || "profile.jpg");
  const resp = await axiosClient.post("/users/me/profile-picture", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return resp.data;
}
