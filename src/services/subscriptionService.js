import axiosClient from "../api/axiosClient";

export async function createSubscription(payload) {
  const resp = await axiosClient.post("/subscriptions", payload);
  return resp.data;
}

export async function updateSubscription(id, payload) {
  const resp = await axiosClient.put(`/subscriptions/${id}`, payload);
  return resp.data;
}

export async function getSubscription(id) {
  const resp = await axiosClient.get(`/subscriptions/${id}`);
  return resp.data;
}

export async function getSubscriptions(params) {
  // params can include pagination, filters, etc. Sent as query params
  const resp = await axiosClient.get(`/subscriptions`, { params });
  return resp.data;
}
