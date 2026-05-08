import axiosClient from "../api/axiosClient";

export async function getUserManagementData() {
  const resp = await axiosClient.get("/users/management");
  return resp.data;
}

export async function updateUserStatus(userId, status) {
  const resp = await axiosClient.patch(`/users/${userId}/status`, { status });
  return resp.data;
}
