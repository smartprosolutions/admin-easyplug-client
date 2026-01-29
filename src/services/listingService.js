import axiosClient from "../api/axiosClient";

// Listings (inventory) service
// Mirrors the style used in subscriptionService.js and authService.js

export async function createListing(payload, onProgress) {
  // payload may be FormData (for images) or plain object
  const config = {};
  if (typeof onProgress === "function") {
    config.onUploadProgress = (evt) => {
      try {
        if (!evt || !evt.total) return;
        const pct = Math.round((evt.loaded * 100) / evt.total);
        onProgress(pct, evt);
      } catch {
        /* no-op */
      }
    };
  }

  const resp = await axiosClient.post("/listings", payload, config);
  return resp.data;
}

export async function updateListing(id, payload, onProgress) {
  const config = {};
  if (typeof onProgress === "function") {
    config.onUploadProgress = (evt) => {
      try {
        if (!evt || !evt.total) return;
        const pct = Math.round((evt.loaded * 100) / evt.total);
        onProgress(pct, evt);
      } catch {
        /* no-op */
      }
    };
  }

  const resp = await axiosClient.put(`/listings/${id}`, payload, config);
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
