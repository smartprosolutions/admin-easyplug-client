import axiosClient from "../api/axiosClient";

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
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return resp.data;
}
