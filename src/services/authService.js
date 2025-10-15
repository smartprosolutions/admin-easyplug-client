import axiosClient from "../api/axiosClient";

export async function login({ email, password }) {
  // Adjust endpoint path if your backend uses a different route
  const resp = await axiosClient.post("/auth/login", { email, password });
  return resp.data;
}

export async function googleLogin({ credential }) {
  // Adjust endpoint path if your backend uses a different route
  // The backend should accept the Google credential (JWT) and return a token/user
  const resp = await axiosClient.post("/auth/login/google", { credential });
  return resp.data;
}

export async function register(formData) {
  // Adjust endpoint path if your backend uses a different route
  const resp = await axiosClient.post("/auth/register", formData);
  return resp.data;
}

export async function registerSeller(formData) {
  // New seller registration endpoint (supports FormData with files)
  const resp = await axiosClient.post("/auth/register/seller", formData, {
    headers:
      formData instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : {}
  });
  return resp.data;
}

export async function sendVerificationCode({ email }) {
  // Adjust endpoint path as needed
  const resp = await axiosClient.post("/auth/send-code", { email });
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
