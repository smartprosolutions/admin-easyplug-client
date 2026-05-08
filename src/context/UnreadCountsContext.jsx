/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { useUserProfileQuery } from "../services/queries";
import { getUnreadCount } from "../services/notificationService";
import { getUnreadMessageCount } from "../services/messageService";
import { connectSocket, getSocket } from "../socket/socketClient";

const UnreadCountsContext = createContext(null);

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const toSafeCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const parseUnreadCount = (payload) =>
  toSafeCount(
    pickFirst(
      payload?.unreadCount,
      payload?.count,
      payload?.unread,
      payload?.unreadMessages,
      payload?.data?.unreadCount,
      payload?.data?.count,
      payload?.data?.unread,
      0,
    ),
  );

const resolveUserId = (profileData) =>
  pickFirst(
    profileData?.user?.userId,
    profileData?.user?.id,
    profileData?.userId,
    profileData?.id,
    profileData?.data?.user?.userId,
    profileData?.data?.user?.id,
    profileData?.data?.userId,
  );

const isMessageForUser = (message, currentUserId) => {
  if (!message || !currentUserId) return false;

  const senderId = pickFirst(
    message?.senderId,
    message?.sender?.userId,
    message?.sender?.id,
    message?.sender,
    message?.fromUserId,
  );

  const receiverId = pickFirst(
    message?.receiverId,
    message?.receiver?.userId,
    message?.receiver?.id,
    message?.receiver,
    message?.recipientId,
    message?.toUserId,
  );

  const isFromMe =
    senderId !== undefined &&
    senderId !== null &&
    String(senderId) === String(currentUserId);

  const isToMe =
    receiverId !== undefined &&
    receiverId !== null &&
    String(receiverId) === String(currentUserId);

  const isBroadcast =
    receiverId === undefined || receiverId === null || receiverId === "";

  return !isFromMe && (isToMe || isBroadcast);
};

export function UnreadCountsProvider({ children }) {
  const location = useLocation();
  const { data: profileData } = useUserProfileQuery({ retry: false });
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);

  const currentUserId = useMemo(
    () => resolveUserId(profileData),
    [profileData],
  );
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const refetchUnreadMessages = useCallback(async () => {
    try {
      const response = await getUnreadMessageCount();
      setMessagesUnreadCount(parseUnreadCount(response));
    } catch {
      // keep existing badge value if request fails
    }
  }, []);

  const refetchUnreadNotifications = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      setNotificationsUnreadCount(parseUnreadCount(response));
    } catch {
      // keep existing badge value if request fails
    }
  }, []);

  const incrementUnreadMessages = useCallback((step = 1) => {
    const amount = toSafeCount(step) || 1;
    setMessagesUnreadCount((value) => value + amount);
  }, []);

  const decrementUnreadMessages = useCallback((step = 1) => {
    const amount = toSafeCount(step) || 1;
    setMessagesUnreadCount((value) => Math.max(0, value - amount));
  }, []);

  const incrementUnreadNotifications = useCallback((step = 1) => {
    const amount = toSafeCount(step) || 1;
    setNotificationsUnreadCount((value) => value + amount);
  }, []);

  const decrementUnreadNotifications = useCallback((step = 1) => {
    const amount = toSafeCount(step) || 1;
    setNotificationsUnreadCount((value) => Math.max(0, value - amount));
  }, []);

  useEffect(() => {
    refetchUnreadMessages();
    refetchUnreadNotifications();
  }, [refetchUnreadMessages, refetchUnreadNotifications]);

  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = ({ message }) => {
      if (isMessageForUser(message, currentUserIdRef.current)) {
        incrementUnreadMessages(1);
      }
    };

    const handleNewNotification = ({ notification }) => {
      if (location.pathname.startsWith("/notifications")) {
        return;
      }

      if (!notification?.isRead) {
        incrementUnreadNotifications(1);
      }
    };

    const handleSocketReconnect = () => {
      refetchUnreadMessages();
      refetchUnreadNotifications();
    };

    socket.on("new_message", handleNewMessage);
    socket.on("new_notification", handleNewNotification);
    socket.on("connect", handleSocketReconnect);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_notification", handleNewNotification);
      socket.off("connect", handleSocketReconnect);
    };
  }, [
    incrementUnreadMessages,
    incrementUnreadNotifications,
    refetchUnreadMessages,
    refetchUnreadNotifications,
    location.pathname,
  ]);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState !== "visible") return;
      refetchUnreadMessages();
      refetchUnreadNotifications();
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [refetchUnreadMessages, refetchUnreadNotifications]);

  useEffect(() => {
    if (location.pathname.startsWith("/messages")) {
      refetchUnreadMessages();
    }
    if (location.pathname.startsWith("/notifications")) {
      refetchUnreadNotifications();
    }
  }, [location.pathname, refetchUnreadMessages, refetchUnreadNotifications]);

  const value = useMemo(
    () => ({
      messagesUnreadCount,
      notificationsUnreadCount,
      setMessagesUnreadCount,
      setNotificationsUnreadCount,
      incrementUnreadMessages,
      decrementUnreadMessages,
      incrementUnreadNotifications,
      decrementUnreadNotifications,
      refetchUnreadMessages,
      refetchUnreadNotifications,
    }),
    [
      messagesUnreadCount,
      notificationsUnreadCount,
      incrementUnreadMessages,
      decrementUnreadMessages,
      incrementUnreadNotifications,
      decrementUnreadNotifications,
      refetchUnreadMessages,
      refetchUnreadNotifications,
    ],
  );

  return (
    <UnreadCountsContext.Provider value={value}>
      {children}
    </UnreadCountsContext.Provider>
  );
}

export function useUnreadCounts() {
  const context = useContext(UnreadCountsContext);
  if (!context) {
    throw new Error("useUnreadCounts must be used within UnreadCountsProvider");
  }
  return context;
}
