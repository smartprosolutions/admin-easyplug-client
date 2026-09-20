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

/** Build shareable shopper/lister URLs for a referral code. */
export const buildReferralShareLinks = (referralCode) => {
  const code = normalizeReferralCode(referralCode);
  if (!code) return null;
  const clientBase = String(import.meta.env.VITE_CLIENT_URL || "")
    .trim()
    .replace(/\/$/, "");
  const adminBase = String(
    import.meta.env.VITE_ADMIN_URL ||
      "https://admin.easyplugmarketplace.com",
  )
    .trim()
    .replace(/\/$/, "");
  return {
    referralCode: code,
    shopper: `${clientBase || "https://easyplugmarketplace.com"}/?ref=${encodeURIComponent(code)}`,
    lister: `${adminBase}/register?ref=${encodeURIComponent(code)}`,
  };
};
