import axiosClient from "../api/axiosClient";

export async function getNotifications(params) {
  const resp = await axiosClient.get("/notifications", { params });
  return resp.data;
}

export async function getUnreadCount() {
  const resp = await axiosClient.get("/notifications/unread-count");
  return resp.data;
}

export async function markAsRead(notificationId) {
  const resp = await axiosClient.put(`/notifications/${notificationId}/read`);
  return resp.data;
}

export async function markAllAsRead() {
  const resp = await axiosClient.put("/notifications/read-all");
  return resp.data;
}

export async function deleteNotification(notificationId) {
  const resp = await axiosClient.delete(`/notifications/${notificationId}`);
  return resp.data;
}
