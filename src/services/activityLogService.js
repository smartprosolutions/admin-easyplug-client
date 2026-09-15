import axiosClient from "../api/axiosClient";

export async function getActivityLogs(params = {}) {
  const resp = await axiosClient.get("/activity-logs", { params });
  return resp.data;
}

export async function getActivityLogActions() {
  const resp = await axiosClient.get("/activity-logs/actions");
  return resp.data;
}

export async function getActivityLogEntityTypes() {
  const resp = await axiosClient.get("/activity-logs/entity-types");
  return resp.data;
}
