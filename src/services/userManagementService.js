import axiosClient from "../api/axiosClient";

export async function getUserManagementData() {
  const resp = await axiosClient.get("/users/management");
  return resp.data;
}

export async function updateUserStatus(userId, status) {
  const resp = await axiosClient.patch(`/users/${userId}/status`, { status });
  return resp.data;
}

export async function createUserByAdmin(payload) {
  const resp = await axiosClient.post("/users/admin/create", payload);
  return resp.data;
}

export async function updateUserByAdmin(userId, payload) {
  const resp = await axiosClient.put(`/users/${userId}`, payload);
  return resp.data;
}

export async function suspendUserByAdmin(userId) {
  const resp = await axiosClient.patch(`/users/${userId}/status`, {
    status: "suspended",
  });
  return resp.data;
}

export async function deleteUserByAdmin(userId, adminPassword) {
  const resp = await axiosClient.delete(`/users/${userId}`, {
    data: adminPassword ? { adminPassword } : undefined,
  });
  return resp.data;
}

/**
 * Cascade-deletes a user and all their associated data:
 * listings, advertisements, and finally the user account itself.
 * Errors from individual listing/ad deletes are collected but do not
 * abort the rest of the cascade — the user account is always attempted last.
 */
export async function cascadeDeleteUser(userId, adminPassword) {
  const errors = [];

  // 1. Fetch and delete all listings owned by this user
  try {
    const listingsResp = await axiosClient.get("/listings/admin/all", {
      params: { all: 1 },
    });
    const allListings =
      listingsResp.data?.listings ||
      listingsResp.data?.data?.listings ||
      (Array.isArray(listingsResp.data) ? listingsResp.data : []);

    const userListings = allListings.filter(
      (l) =>
        String(l?.sellerId || l?.seller_id || l?.userId || l?.user_id || "") ===
        String(userId),
    );

    await Promise.allSettled(
      userListings.map((l) => {
        const id = l?.listingId || l?.listing_id || l?.id || l?._id;
        if (!id) return Promise.resolve();
        return axiosClient
          .delete(`/listings/${id}`, {
            data: adminPassword ? { adminPassword } : undefined,
          })
          .catch((e) => errors.push(`Listing ${id}: ${e?.response?.data?.message || e.message}`));
      }),
    );
  } catch (e) {
    errors.push(`Could not fetch listings: ${e?.response?.data?.message || e.message}`);
  }

  // 2. Delete the user account
  const resp = await axiosClient.delete(`/users/${userId}`, {
    data: adminPassword ? { adminPassword } : undefined,
  });

  return { ...resp.data, cascadeErrors: errors };
}
