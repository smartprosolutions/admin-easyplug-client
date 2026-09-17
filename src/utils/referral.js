const REFERRAL_STORAGE_KEY = "easyplug_referral_code";

export const normalizeReferralCode = (value) => {
  const code = String(value || "").trim().toUpperCase();
  return code || "";
};

export const getStoredReferralCode = () => {
  try {
    return normalizeReferralCode(sessionStorage.getItem(REFERRAL_STORAGE_KEY));
  } catch {
    return "";
  }
};

export const storeReferralCode = (value) => {
  const code = normalizeReferralCode(value);
  if (!code) return "";
  try {
    sessionStorage.setItem(REFERRAL_STORAGE_KEY, code);
  } catch {
    /* ignore quota / private mode */
  }
  return code;
};

export const captureReferralCodeFromUrl = (search = window.location.search) => {
  try {
    const params = new URLSearchParams(search);
    const fromQuery =
      params.get("ref") ||
      params.get("referralCode") ||
      params.get("referral_code");
    return storeReferralCode(fromQuery) || getStoredReferralCode();
  } catch {
    return getStoredReferralCode();
  }
};
