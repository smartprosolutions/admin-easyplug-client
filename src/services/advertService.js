import axiosClient from "../api/axiosClient";

export async function createAdvert(payload) {
  const resp = await axiosClient.post("/listings/advert", payload);
  return resp.data;
}

export async function updateAdvert(advertId, payload) {
  const resp = await axiosClient.put(`/listings/${advertId}`, payload);
  return resp.data;
}

export async function addListingToAdvert(advertId, payload) {
  const resp = await axiosClient.post(
    `/listings/advert/${advertId}/items`,
    payload,
  );
  return resp.data;
}

export async function getAdvert(id) {
  const resp = await axiosClient.get(`/listings/advert/${id}`);
  return resp.data;
}

export async function getCatalogue(params) {
  const resp = await axiosClient.get("/listings/catalogue", { params });
  return resp.data;
}

export async function getAds(params) {
  const resp = await axiosClient.get("/listings/ads", { params });
  return resp.data;
}
