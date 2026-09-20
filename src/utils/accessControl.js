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

/** @deprecated Legacy role; referring powers now live on sellers with referralCode */
export const isAmbassadorRole = (roleValue) =>
  normalizeRole(roleValue) === "ambassador";

export const isAdminRole = (roleValue) => {
  const role = normalizeRole(roleValue);
  return role === "admin" || role === "superadmin";
};

const pickUserRecord = (profileData) =>
  pickFirst(
    profileData?.user,
    profileData?.data?.user,
    profileData?.data?.seller,
    profileData?.seller,
    profileData?.data,
    profileData,
  );

/** Lister (or legacy ambassador) with an active referral code */
export const hasReferralPowers = (profileData) => {
  const user = pickUserRecord(profileData) || {};
  const code = pickFirst(
    user.referralCode,
    profileData?.user?.referralCode,
    profileData?.data?.user?.referralCode,
    profileData?.referralCode,
  );
  if (!code) {
    const links = pickFirst(
      user.ambassadorLinks,
      user.referralLinks,
      profileData?.user?.ambassadorLinks,
      profileData?.user?.referralLinks,
      profileData?.ambassadorLinks,
      profileData?.referralLinks,
    );
    if (!links?.referralCode && !links?.shopperLink && !links?.shopper) {
      return false;
    }
  }
  const role = resolveUserRole(profileData);
  return isSellerRole(role) || isAmbassadorRole(role);
};

/** Default landing page after login/switch. */
export const getDefaultHomePath = (roleValue) => {
  if (isSellerRole(roleValue) || isAmbassadorRole(roleValue)) return "/inventory";
  return "/dashboard";
};

/** Roles allowed to use this admin/seller dashboard app. */
export const canAccessAdminApp = (roleValue) =>
  isAdminRole(roleValue) ||
  isSellerRole(roleValue) ||
  isAmbassadorRole(roleValue);

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
