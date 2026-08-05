import axiosClient from "../api/axiosClient";

export async function getAdminSupportTickets(params) {
  const resp = await axiosClient.get("/support-tickets/admin", { params });
  return resp.data;
}

export async function getAdminSupportTicket(ticketId) {
  const resp = await axiosClient.get(`/support-tickets/admin/${ticketId}`);
  return resp.data;
}

export async function replyAdminSupportTicket(ticketId, payload) {
  const resp = await axiosClient.post(
    `/support-tickets/admin/${ticketId}/messages`,
    payload,
  );
  return resp.data;
}

export async function updateAdminSupportTicketStatus(ticketId, status) {
  const resp = await axiosClient.patch(
    `/support-tickets/admin/${ticketId}/status`,
    { status },
  );
  return resp.data;
}
