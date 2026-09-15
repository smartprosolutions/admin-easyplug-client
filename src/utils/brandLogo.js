import { pickFirst } from "./accessControl";
import fallbackLogo from "../assets/images/Sample Logo 1 (4).png";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
})();

export const DEFAULT_BRAND_LOGO = fallbackLogo;

export function resolvePictureUrl(value, ownerEmail) {
  if (!value) return "";
  if (typeof value !== "string") {
    try {
      return URL.createObjectURL(value);
    } catch {
      return "";
    }
  }

  const v = value.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("data:")) return v;
  if (v.startsWith("/")) return `${API_ORIGIN}${v}`;

  const emailSeg = ownerEmail ? `/${encodeURIComponent(ownerEmail)}` : "";
  return `${API_ORIGIN.replace(/\/$/, "")}/uploads/pictures${emailSeg}/${v.replace(/^\//, "")}`;
}

export function pickBrandLogoUrl(profileData) {
  const user =
    profileData?.user || profileData?.data?.user || profileData || {};
  const seller =
    profileData?.seller ||
    profileData?.data?.seller ||
    user?.seller ||
    profileData?.company ||
    {};

  const raw = pickFirst(
    seller?.businessPicture,
    seller?.logo,
    seller?.logoUrl,
    seller?.companyLogo,
    seller?.brandLogo,
    seller?.image,
    profileData?.logo,
    profileData?.logoUrl,
    profileData?.data?.logo,
    profileData?.branding?.logo,
    user?.logo,
    user?.logoUrl,
  );

  const email = pickFirst(
    seller?.businessEmail,
    seller?.email,
    user?.email,
    profileData?.email,
    profileData?.data?.email,
  );

  return resolvePictureUrl(raw, email);
}

export function applyDocumentBrandIcons(logoUrl) {
  if (!logoUrl || typeof document === "undefined") return;

  const iconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
  ];

  iconSelectors.forEach((selector) => {
    const link = document.querySelector(selector);
    if (link) link.setAttribute("href", logoUrl);
  });
}
