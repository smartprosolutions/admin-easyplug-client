import axiosClient from "../api/axiosClient";

/**
 * @param {{ from?: string, to?: string, all?: boolean }} [params]
 */
export async function getReportsSummary(params = {}) {
  const query = {};
  if (params.all) {
    query.all = "1";
  } else {
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;
  }
  const resp = await axiosClient.get("/reports/summary", { params: query });
  return resp.data;
}
