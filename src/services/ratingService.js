import axiosClient from "../api/axiosClient";

export function extractRatings(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const nested = payload.data;
  const candidates = [
    payload.ratings,
    payload.reviews,
    nested,
    nested?.ratings,
    nested?.reviews,
    nested?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

export function resolveRatingId(item) {
  return item?.ratingId ?? item?.reviewId ?? item?.id ?? "";
}

export async function getListingRatings(listingId, params = {}) {
  const resp = await axiosClient.get(`/listings/${listingId}/ratings`, {
    params,
  });
  return resp.data;
}

export async function replyToListingReview(ratingId, reply) {
  const resp = await axiosClient.post(`/ratings/${ratingId}/reply`, { reply });
  return resp.data;
}
