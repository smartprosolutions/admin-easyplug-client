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

  throw lastError || new Error("No message endpoint matched");
}

export async function getConversations(params) {
  return requestWithFallback([
    () => axiosClient.get("/chats", { params }),
    () => axiosClient.get("/messages/conversations", { params }),
    () => axiosClient.get("/messages", { params }),
    () => axiosClient.get("/chat/conversations", { params }),
  ]);
}

export async function getConversationMessages(conversationId, params) {
  return requestWithFallback([
    () => axiosClient.get(`/chat-messages/${conversationId}`, { params }),
    () =>
      axiosClient.get(`/messages/conversations/${conversationId}/messages`, {
        params,
      }),
    () => axiosClient.get(`/messages/${conversationId}`, { params }),
    () =>
      axiosClient.get(`/chat/conversations/${conversationId}/messages`, {
        params,
      }),
  ]);
}

export async function sendConversationMessage(conversationId, payload) {
  return requestWithFallback([
    () =>
      axiosClient.post(`/chat-messages`, {
        chatId: conversationId,
        ...payload,
      }),
    () =>
      axiosClient.post(
        `/messages/conversations/${conversationId}/messages`,
        payload,
      ),
    () => axiosClient.post(`/messages/${conversationId}`, payload),
    () =>
      axiosClient.post(
        `/chat/conversations/${conversationId}/messages`,
        payload,
      ),
  ]);
}

const extractAttachmentUrl = (payload) =>
  payload?.url ||
  payload?.fileUrl ||
  payload?.path ||
  payload?.filePath ||
  payload?.attachment?.url ||
  payload?.attachment?.fileUrl ||
  payload?.message?.url ||
  payload?.message?.fileUrl ||
  payload?.message?.attachment?.url ||
  payload?.message?.attachment?.fileUrl ||
  payload?.data?.url ||
  payload?.data?.fileUrl ||
  payload?.data?.path ||
  payload?.data?.filePath ||
  payload?.data?.message?.url ||
  payload?.data?.message?.fileUrl ||
  payload?.data?.message?.attachment?.url ||
  payload?.data?.message?.attachment?.fileUrl ||
  "";

export async function sendConversationAttachment(
  conversationId,
  { file, receiverId, message = "", storagePath = "" },
) {
  const fieldCandidates = ["attachment", "file", "document", "media", "image"];
  let lastError;

  for (const field of fieldCandidates) {
    const formData = new FormData();
    formData.append("chatId", String(conversationId));
    if (receiverId) formData.append("receiverId", String(receiverId));
    formData.append("message", message || file?.name || "Attachment");
    formData.append("messageType", "attachment");
    if (storagePath) {
      formData.append("storagePath", storagePath);
      formData.append("uploadPath", storagePath);
      formData.append("folder", storagePath);
    }
    formData.append(field, file);

    try {
      const data = await requestWithFallback([
        () => axiosClient.post("/chat-messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
        () =>
          axiosClient.post(
            `/messages/conversations/${conversationId}/messages`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          ),
      ]);
      const url = extractAttachmentUrl(data);
      return { data, fileUrl: url };
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status === 404 || status === 405 || status === 415 || status === 422) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("Unable to send attachment.");
}

export async function getUnreadMessageCount() {
  return requestWithFallback([
    () => axiosClient.get("/chat-messages/unread/count"),
    () => axiosClient.get("/messages/unread/count"),
    () => axiosClient.get("/chat/unread/count"),
  ]);
}

export async function markChatMessagesAsRead(chatId) {
  return requestWithFallback([
    () => axiosClient.post(`/chat-messages/chat/${chatId}/read`),
    () => axiosClient.post(`/messages/conversations/${chatId}/read`),
    () => axiosClient.post(`/chat/${chatId}/read`),
  ]);
}

export async function markMessageAsRead(messageId) {
  const resp = await axiosClient.post(`/chat-messages/${messageId}/read`);
  return resp.data;
}
