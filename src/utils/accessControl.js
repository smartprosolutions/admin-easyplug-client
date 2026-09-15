export const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

export const normalizeRole = (roleValue) =>
  String(roleValue || "")
    .trim()
    .toLowerCase();

export const resolveUserId = (profileData) =>
  pickFirst(
    profileData?.user?.userId,
    profileData?.user?.id,
    profileData?.data?.user?.userId,
    profileData?.data?.user?.id,
    profileData?.data?.admin?.userId,
    profileData?.data?.admin?.id,
    profileData?.data?.seller?.userId,
    profileData?.data?.seller?.id,
    profileData?.seller?.userId,
    profileData?.seller?.id,
    profileData?.userId,
    profileData?.id,
    profileData?.data?.userId,
    profileData?.data?.id,
  );

export const resolveUserRole = (profileData) =>
  normalizeRole(
    pickFirst(
      profileData?.user?.userType,
      profileData?.user?.role,
      profileData?.data?.user?.userType,
      profileData?.data?.user?.role,
      profileData?.data?.admin?.userType,
      profileData?.data?.admin?.role,
      profileData?.data?.seller?.userType,
      profileData?.data?.seller?.role,
      profileData?.userType,
      profileData?.role,
      profileData?.data?.role,
    ),
  );

export const isSellerRole = (roleValue) => normalizeRole(roleValue) === "seller";

export const isAdminRole = (roleValue) => {
  const role = normalizeRole(roleValue);
  return role === "admin" || role === "superadmin";
};

/** Default landing page after login/switch. Sellers go to listings while dashboard is unfinished. */
export const getDefaultHomePath = (roleValue) =>
  isSellerRole(roleValue) ? "/inventory" : "/dashboard";

/** Roles allowed to use this admin/seller dashboard app. */
export const canAccessAdminApp = (roleValue) =>
  isAdminRole(roleValue) || isSellerRole(roleValue);

export const resolveOwnerUserId = (record) =>
  pickFirst(
    record?.sellerId,
    record?.seller_id,
    record?.userId,
    record?.user_id,
    record?.ownerId,
    record?.owner_id,
    record?.seller?.userId,
    record?.seller?.id,
    record?.user?.userId,
    record?.user?.id,
  );

export const isOwnedByUser = (record, userId) => {
  if (!userId) return false;
  const ownerId = resolveOwnerUserId(record);
  if (ownerId === undefined || ownerId === null || ownerId === "") return false;
  return String(ownerId) === String(userId);
};

/** Owner or admin/superadmin may manage (admin override still needs password server-side). */
export const canManageRecord = (record, userId, roleValue) => {
  if (isOwnedByUser(record, userId)) return true;
  return isAdminRole(roleValue);
};

export const needsAdminPasswordForRecord = (record, userId, roleValue) =>
  isAdminRole(roleValue) && !isOwnedByUser(record, userId);

export const hasAccessToken = () => {
  try {
    return Boolean(localStorage.getItem("access_token"));
  } catch {
    return false;
  }
};
