import axiosClient from "../api/axiosClient";

async function requestWithFallback(buildRequestFns) {
  let lastError;

  for (const makeRequest of buildRequestFns) {
    try {
      const resp = await makeRequest();
      return resp.data;
    } catch (error) {
      const status = error?.response?.status;
      if (status && status !== 404 && status !== 405) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError || new Error("No seller address endpoint matched");
}

export async function updateSellerInfo(id, payload) {
  const resp = await axiosClient.put(`/seller-info/${id}`, payload);
  return resp.data;
}

// Update current user's seller info without needing the ID
export async function updateSellerInfoMe(payload) {
  const resp = await axiosClient.put(`/seller-info/me`, payload);
  return resp.data;
}

export async function uploadBusinessPicture(file) {
  const form = new FormData();
  // Backend expects field name 'businessPicture'
  form.append("businessPicture", file, file?.name || "business.jpg");
  const resp = await axiosClient.post(
    "/seller-info/me/business-picture",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return resp.data;
}

export async function getCompanyAddress(id) {
  return requestWithFallback([
    () => axiosClient.get("/seller-info/me/address"),
    () =>
      id ? axiosClient.get(`/seller-info/${id}/address`) : Promise.reject(),
    () => axiosClient.get("/company-address/me"),
  ]);
}

export async function createCompanyAddress(payload, id) {
  return requestWithFallback([
    () => axiosClient.post("/addresses", payload),
    () => axiosClient.post("/addresses/me", payload),
    () => axiosClient.post("/seller-info/me/address", payload),
    () =>
      id
        ? axiosClient.post(`/seller-info/${id}/address`, payload)
        : Promise.reject(),
    () => axiosClient.post("/company-address/me", payload),
  ]);
}

export async function updateCompanyAddress(addressId, payload, id) {
  return requestWithFallback([
    () =>
      addressId
        ? axiosClient.put(`/addresses/${addressId}`, payload)
        : Promise.reject(),
    () => axiosClient.put("/addresses", payload),
    () => axiosClient.put("/addresses/me", payload),
    () =>
      addressId
        ? axiosClient.put(`/seller-info/me/address/${addressId}`, payload)
        : Promise.reject(),
    () => axiosClient.put("/seller-info/me/address", payload),
    () =>
      id && addressId
        ? axiosClient.put(`/seller-info/${id}/address/${addressId}`, payload)
        : Promise.reject(),
    () =>
      id
        ? axiosClient.put(`/seller-info/${id}/address`, payload)
        : Promise.reject(),
  ]);
}



export async function deleteCompanyAddress(addressId, id) {
  return requestWithFallback([
    () =>
      addressId
        ? axiosClient.delete(`/seller-info/me/address/${addressId}`)
        : Promise.reject(),
    () => axiosClient.delete("/seller-info/me/address"),
    () =>
      id && addressId
        ? axiosClient.delete(`/seller-info/${id}/address/${addressId}`)
        : Promise.reject(),
    () =>
      id ? axiosClient.delete(`/seller-info/${id}/address`) : Promise.reject(),
    () =>
      addressId
        ? axiosClient.delete(`/company-address/${addressId}`)
        : Promise.reject(),
  ]);
}
