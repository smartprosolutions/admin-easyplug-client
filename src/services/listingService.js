import axiosClient from "../api/axiosClient";

export function extractListings(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const nested = payload.data;
  const candidates = [
    payload.listings,
    payload.adverts,
    payload.items,
    payload.results,
    nested,
    nested?.listings,
    nested?.adverts,
    nested?.items,
    nested?.results,
    nested?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

export function resolveListingId(item) {
  return (
    item?.listingId ??
    item?.listing_id ??
    item?.id ??
    item?._id ??
    ""
  );
}

export async function invalidateListingQueries(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["adminListings"] }),
    queryClient.invalidateQueries({ queryKey: ["sellerListings"] }),
    queryClient.invalidateQueries({ queryKey: ["inventory"] }),
    queryClient.invalidateQueries({ queryKey: ["inventoryItem"] }),
    queryClient.invalidateQueries({ queryKey: ["myInventoryForFeature"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-insights"] }),
  ]);
}

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
  const resp = await axiosClient.get(`/listings/admin/all`, {
    params: { all: 1, ...params },
  });
  return resp.data;
}

export async function getMyListings(params) {
  const resp = await axiosClient.get(`/listings/me`, {
    params: { all: 1, ...params },
  });
  return resp.data;
}

export async function deleteListing(id, { adminPassword } = {}) {
  const resp = await axiosClient.delete(`/listings/${id}`, {
    data: adminPassword ? { adminPassword } : undefined,
  });
  return resp.data;
}
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

export async function getMyListings(params) {
  const resp = await axiosClient.get(`/listings/me`, { params });
  return resp.data;
}

export async function deleteListing(id, { adminPassword } = {}) {
  const resp = await axiosClient.delete(`/listings/${id}`, {
    data: adminPassword ? { adminPassword } : undefined,
  });
  return resp.data;
}
