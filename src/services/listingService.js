import axiosClient from "../api/axiosClient";

// Listings (inventory) service
// Mirrors the style used in subscriptionService.js and authService.js

export async function createListing(payload) {
  // payload may be FormData (for images) or plain object
  const headers =
    payload instanceof FormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined;

  const resp = await axiosClient.post("/listings", payload, headers);
  return resp.data;
}

export async function updateListing(id, payload) {
  const headers =
    payload instanceof FormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined;

  const resp = await axiosClient.put(`/listings/${id}`, payload, headers);
  return resp.data;
}

export async function getListing(id) {
  const resp = await axiosClient.get(`/listings/${id}`);
  return resp.data;
}

export async function getListings(params) {
  // params can include pagination, filters, etc. Sent as query params
  const resp = await axiosClient.get(`/listings`, { params });
  return resp.data;
}

export async function getAdminListings(params) {
  // Admin-only route that returns all listings
  const resp = await axiosClient.get(`/listings/admin/all`, { params });
  return resp.data;
}

export async function deleteListing(id) {
  const resp = await axiosClient.delete(`/listings/${id}`);
  return resp.data;
}
