const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/api\/v1\/?$/, "");

const withBase = (rawPath) => {
  if (!rawPath || typeof rawPath !== "string") return "";
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  if (!API_BASE_URL) return rawPath;
  if (rawPath.startsWith("/")) return `${API_BASE_URL}${rawPath}`;
  return `${API_BASE_URL}/${rawPath}`;
};

const resolveFolder = ({ isAdvertisement = false, variant } = {}) => {
  if (variant === "catalogue") return "catalogue";
  return isAdvertisement ? "advert" : "standard";
};

export const resolveListingImagePath = (raw, options = {}) => {
  if (!raw || typeof raw !== "string") return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const cleaned = raw.trim();

  if (cleaned.includes("uploads/listings/")) {
    return withBase(cleaned.startsWith("/") ? cleaned : `/${cleaned}`);
  }

  if (cleaned.includes("/")) {
    return withBase(cleaned);
  }

  const sellerEmail = options?.sellerEmail;
  if (sellerEmail) {
    const folder = resolveFolder(options);
    const encodedEmail = encodeURIComponent(sellerEmail);
    const encodedFile = encodeURIComponent(cleaned);
    return `${API_BASE_URL}/uploads/listings/${encodedEmail}/images/${folder}/${encodedFile}`;
  }

  return withBase(cleaned);
};

export const resolveListingImages = (item, options = {}) => {
  const images = [];

  if (Array.isArray(item?.images)) {
    item.images.forEach((img) => {
      const raw = img?.url || img;
      const resolved = resolveListingImagePath(raw, options);
      if (resolved) images.push(resolved);
    });
  }

  if (Array.isArray(item?.media)) {
    item.media.forEach((img) => {
      const raw = img?.url || img;
      const resolved = resolveListingImagePath(raw, options);
      if (resolved) images.push(resolved);
    });
  }

  const fallback = resolveListingImagePath(
    item?.image || item?.thumbnail || item?.coverImage,
    options,
  );
  if (fallback) images.push(fallback);

  return images;
};
