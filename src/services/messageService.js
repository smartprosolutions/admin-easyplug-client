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

export async function markMessageAsRead(messageId) {
  const resp = await axiosClient.post(`/chat-messages/${messageId}/read`);
  return resp.data;
}
