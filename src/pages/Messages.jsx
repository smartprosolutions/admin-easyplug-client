/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Stack,
  IconButton,
  TextField,
  InputAdornment,
  Badge,
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";
import VerifiedIcon from "@mui/icons-material/Verified";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import StarIcon from "@mui/icons-material/Star";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import DescriptionIcon from "@mui/icons-material/Description";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ContactsIcon from "@mui/icons-material/Contacts";
import PhoneIcon from "@mui/icons-material/Phone";
import VideocamIcon from "@mui/icons-material/Videocam";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import ReportIcon from "@mui/icons-material/Report";
import BlockIcon from "@mui/icons-material/Block";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import ReplyIcon from "@mui/icons-material/Reply";
import { useNavigate } from "react-router-dom";
import { gradientPrimary } from "../theme/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getConversationMessages,
  sendConversationMessage,
  markChatMessagesAsRead,
  sendConversationAttachment,
} from "../services/messageService";
import { resolveListingImagePath } from "../utils/listingImages";
import { useUserProfileQuery } from "../services/queries";
import { connectSocket, getSocket } from "../socket/socketClient";
import { useUnreadCounts } from "../context/UnreadCountsContext";

// Dummy conversations data
const conversations = [
  {
    id: 1,
    user: {
      name: "John Mensah",
      avatar: "https://i.pravatar.cc/150?img=12",
      verified: true,
      online: true,
      rating: 4.8,
      reviews: 127,
    },
    lastMessage: "Is this still available?",
    time: "2 min ago",
    unread: 2,
    listing: {
      title: "iPhone 13 Pro Max",
      price: "R 12,999",
      image:
        "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=100",
    },
  },
  {
    id: 2,
    user: {
      name: "Sarah Williams",
      avatar: "https://i.pravatar.cc/150?img=5",
      verified: true,
      online: false,
      rating: 4.9,
      reviews: 89,
    },
    lastMessage: "Thank you for your interest! Yes, it's available.",
    time: "1 hour ago",
    unread: 0,
    listing: {
      title: "MacBook Pro M2",
      price: "R 28,999",
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100",
    },
  },
  {
    id: 3,
    user: {
      name: "Mike Johnson",
      avatar: "https://i.pravatar.cc/150?img=8",
      verified: false,
      online: true,
      rating: 4.2,
      reviews: 34,
    },
    lastMessage: "Can you do R10,000?",
    time: "3 hours ago",
    unread: 1,
    listing: {
      title: "Samsung Galaxy S23",
      price: "R 11,999",
      image:
        "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100",
    },
  },
  {
    id: 4,
    user: {
      name: "Emma Davis",
      avatar: "https://i.pravatar.cc/150?img=9",
      verified: true,
      online: false,
      rating: 5.0,
      reviews: 156,
    },
    lastMessage: "Great, I'll take it. When can we meet?",
    time: "Yesterday",
    unread: 0,
    listing: {
      title: "Sony WH-1000XM5",
      price: "R 6,999",
      image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100",
    },
  },
  {
    id: 5,
    user: {
      name: "David Brown",
      avatar: "https://i.pravatar.cc/150?img=11",
      verified: false,
      online: false,
      rating: 3.8,
      reviews: 12,
    },
    lastMessage: "Is the price negotiable?",
    time: "2 days ago",
    unread: 0,
    listing: {
      title: "Gaming Laptop RTX 4060",
      price: "R 22,500",
      image:
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100",
    },
  },
];

// Dummy messages for selected conversation
const dummyMessages = [
  {
    id: 1,
    senderId: "other",
    text: "Hi! I saw your listing for the iPhone 13 Pro Max. Is it still available?",
    time: "10:30 AM",
    read: true,
  },
  {
    id: 2,
    senderId: "me",
    text: "Yes, it's still available! Are you interested?",
    time: "10:32 AM",
    read: true,
  },
  {
    id: 3,
    senderId: "other",
    text: "Yes! What's the condition like? Any scratches or damage?",
    time: "10:35 AM",
    read: true,
  },
  {
    id: 4,
    senderId: "me",
    text: "It's in excellent condition. No scratches on the screen, and the body is pristine. Battery health is at 95%.",
    time: "10:38 AM",
    read: true,
  },
  {
    id: 5,
    senderId: "other",
    text: "That sounds great! Does it come with original accessories?",
    time: "10:40 AM",
    read: true,
  },
  {
    id: 6,
    senderId: "me",
    text: "Yes, it comes with the original box, charger, cable, and earphones. Everything is included.",
    time: "10:42 AM",
    read: true,
  },
  {
    id: 7,
    senderId: "other",
    text: "Is this still available?",
    time: "2 min ago",
    read: false,
  },
];

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=1";
const FALLBACK_LISTING_IMAGE = "https://via.placeholder.com/100";

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const getUserIdFromAccessToken = () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const payload = JSON.parse(atob(padded));
    return (
      payload?.userId ||
      payload?.id ||
      payload?.sub ||
      payload?.user?.userId ||
      null
    );
  } catch {
    return null;
  }
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") return `R ${value.toLocaleString()}`;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? `R ${parsed.toLocaleString()}`
    : String(value);
};

const formatFileSize = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatMessageTime = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const resolveAssetUrl = (raw) => {
  if (!raw || typeof raw !== "string") return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const apiBase =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const base = apiBase.replace(/\/api\/v1\/?$/, "");
  if (!base) return raw;

  if (raw.startsWith("/")) return `${base}${raw}`;
  return `${base}/${raw}`;
};

const resolveChatStoragePath = (file, typeLabel = "") => {
  const mime = String(file?.type || "").toLowerCase();
  const label = String(typeLabel || "").toLowerCase();
  const extension = String(file?.name || "")
    .split(".")
    .pop()
    ?.toLowerCase();
  const imageLike =
    mime.startsWith("image/") ||
    label.includes("photo") ||
    label.includes("camera") ||
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"].includes(
      extension || "",
    );
  return imageLike ? "uploads/chats_pictures" : "uploads/chats_documents";
};

const resolveProfilePictureUrl = (raw, ownerEmail) => {
  if (!raw || typeof raw !== "string") return "";

  const cleaned = raw.trim();
  if (!cleaned) return "";
  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  if (cleaned.includes("uploads/pictures/")) {
    return resolveAssetUrl(cleaned.startsWith("/") ? cleaned : `/${cleaned}`);
  }

  if (cleaned.includes("/")) {
    return resolveAssetUrl(cleaned);
  }

  if (ownerEmail) {
    const encodedEmail = encodeURIComponent(ownerEmail);
    const encodedFile = encodeURIComponent(cleaned);
    return resolveAssetUrl(`/uploads/pictures/${encodedEmail}/${encodedFile}`);
  }

  return resolveAssetUrl(cleaned);
};

const normalizeConversationsResponse = (payload, { currentUserId } = {}) => {
  const source =
    payload?.chats ||
    payload?.conversations ||
    payload?.items ||
    payload?.results ||
    payload?.data ||
    payload;
  const rows = Array.isArray(source) ? source : [];

  return rows.map((item, idx) => {
    // Determine the "other" participant based on who is logged in
    const buyerId = pickFirst(
      item?.buyerId,
      item?.buyer?.userId,
      item?.buyer?.id,
    );
    const sellerId = pickFirst(
      item?.sellerId,
      item?.seller?.userId,
      item?.seller?.id,
    );
    const user = (() => {
      if (currentUserId) {
        if (String(currentUserId) === String(sellerId))
          return item?.buyer || {};
        if (String(currentUserId) === String(buyerId))
          return item?.seller || {};
      }
      return (
        item?.user ||
        item?.otherUser ||
        item?.participant ||
        item?.seller ||
        item?.buyer ||
        {}
      );
    })();
    const listing =
      item?.listing || item?.item || item?.product || item?.advert || {};
    const lastMessageObj = item?.lastMessage || item?.latestMessage || {};

    const combinedName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const listingImageRaw =
      pickFirst(
        listing?.image,
        listing?.thumbnail,
        listing?.coverImage,
        Array.isArray(listing?.images)
          ? listing.images[0]?.url || listing.images[0]
          : null,
        FALLBACK_LISTING_IMAGE,
      ) || FALLBACK_LISTING_IMAGE;
    const listingSellerEmail =
      item?.seller?.email ||
      item?.sellerEmail ||
      listing?.seller?.email ||
      user?.email ||
      "";
    const userEmail =
      user?.email ||
      item?.seller?.email ||
      item?.buyer?.email ||
      item?.sellerEmail ||
      item?.buyerEmail ||
      "";

    const unreadRaw =
      pickFirst(item?.unread, item?.unreadCount, item?.unreadMessages, 0) || 0;
    const unread = Number(unreadRaw) || 0;
    const lastMessageSenderId = pickFirst(
      item?.lastMessageSenderId,
      lastMessageObj?.senderId,
      lastMessageObj?.sender?.userId,
      lastMessageObj?.sender?.id,
      lastMessageObj?.sender,
    );
    const lastMessageRead = Boolean(
      pickFirst(
        lastMessageObj?.isRead,
        lastMessageObj?.read,
        item?.lastMessageRead,
        false,
      ),
    );
    const lastMessageIsMine = Boolean(
      (currentUserId &&
        lastMessageSenderId &&
        String(lastMessageSenderId) === String(currentUserId)) ||
      (sellerId &&
        lastMessageSenderId &&
        String(lastMessageSenderId) === String(sellerId)) ||
      lastMessageObj?.isMine === true ||
      item?.lastMessageIsMine === true,
    );

    return {
      id: pickFirst(
        item?.id,
        item?._id,
        item?.conversationId,
        item?.chatId,
        idx + 1,
      ),
      sellerId,
      buyerId,
      user: {
        id: pickFirst(
          user?.userId,
          user?.id,
          item?.otherUserId,
          item?.participantId,
          String(currentUserId) === String(sellerId) ? buyerId : sellerId,
        ),
        name: pickFirst(
          user?.name,
          user?.fullName,
          combinedName,
          user?.username,
          user?.email,
          "Unknown user",
        ),
        avatar:
          resolveProfilePictureUrl(
            pickFirst(
              user?.avatar,
              user?.avatarUrl,
              user?.photo,
              user?.photoUrl,
              user?.profilePicture,
              user?.profile_picture,
              user?.profilePhoto,
              user?.profileImage,
              user?.picture,
              user?.image,
              user?.imageUrl,
            ),
            userEmail,
          ) ||
          resolveAssetUrl(
          pickFirst(
            FALLBACK_AVATAR,
          ),
        ),
        verified: Boolean(user?.verified || user?.isVerified),
        online: Boolean(user?.online || user?.isOnline),
        rating: Number(pickFirst(user?.rating, 0)) || 0,
        reviews: Number(pickFirst(user?.reviews, user?.reviewCount, 0)) || 0,
      },
      lastMessage:
        pickFirst(
          item?.lastMessageText,
          lastMessageObj?.text,
          lastMessageObj?.message,
          lastMessageObj?.content,
          item?.message,
          item?.preview,
          "",
        ) || "",
      lastMessageSenderId,
      lastMessageRead,
      lastMessageIsMine,
      time: formatMessageTime(
        pickFirst(
          item?.updatedAt,
          item?.lastMessageAt,
          lastMessageObj?.createdAt,
          item?.createdAt,
        ),
      ),
      unread,
      type: pickFirst(item?.type, unread > 0 ? "buying" : "selling", "buying"),
      listing: {
        id: pickFirst(
          listing?.listingId,
          listing?.listing_id,
          listing?.id,
          item?.listingId,
          item?.listing_id,
          item?.advertId,
          item?.advert_id,
          item?.productId,
          item?.product_id,
        ),
        title: pickFirst(listing?.title, listing?.name, "Listing"),
        price: formatCurrency(pickFirst(listing?.price, listing?.amount, "")),
        image: resolveListingImagePath(listingImageRaw, {
          sellerEmail: listingSellerEmail,
          isAdvertisement: Boolean(
            listing?.isAdvertisement ?? listing?.is_advertisement,
          ),
        }),
        isAdvertisement: Boolean(
          listing?.isAdvertisement ??
            listing?.is_advertisement ??
            item?.isAdvertisement ??
            item?.is_advertisement,
        ),
      },
    };
  });
};

const normalizeMessagesResponse = (
  payload,
  { currentUserId, sellerId, otherUserId } = {},
) => {
  const source =
    payload?.messages || payload?.items || payload?.data || payload;
  const rows = Array.isArray(source) ? source : [];

  return rows.map((item, idx) => {
    const senderIdentifier = pickFirst(
      item?.senderId,
      item?.sender?.userId,
      item?.sender?.id,
      item?.sender,
    );
    const receiverIdentifier = pickFirst(
      item?.receiverId,
      item?.receiver?.userId,
      item?.receiver?.id,
      item?.receiver,
    );
    const actorId = currentUserId || sellerId || null;
    const mineByActor =
      actorId &&
      senderIdentifier &&
      String(senderIdentifier) === String(actorId);
    const incomingByActor =
      actorId &&
      receiverIdentifier &&
      String(receiverIdentifier) === String(actorId);
    const mineByOtherParticipantFallback = Boolean(
      !mineByActor &&
        !incomingByActor &&
        otherUserId &&
        senderIdentifier &&
        String(senderIdentifier) !== String(otherUserId),
    );
    const mine =
      mineByActor ||
      mineByOtherParticipantFallback ||
      item?.senderId === "me" ||
      item?.sender === "me" ||
      item?.isMine === true ||
      item?.isFromMe === true;
    const location = item?.location
      ? item.location
      : item?.locationLat !== undefined &&
          item?.locationLat !== null &&
          item?.locationLat !== "" &&
          item?.locationLng !== undefined &&
          item?.locationLng !== null &&
          item?.locationLng !== ""
        ? {
            lat: item?.locationLat,
            lng: item?.locationLng,
            name: item?.locationName || "",
          }
        : null;
    const hasLocation =
      location &&
      location?.lat !== undefined &&
      location?.lat !== null &&
      location?.lat !== "" &&
      location?.lng !== undefined &&
      location?.lng !== null &&
      location?.lng !== "" &&
      Number.isFinite(Number(location?.lat)) &&
      Number.isFinite(Number(location?.lng));
    const attachmentRaw = item?.attachment || item?.file || null;
    const fileUrlRaw =
      item?.fileUrl ||
      item?.path ||
      item?.filePath ||
      item?.imaages?.[0] ||
      item?.images?.[0] ||
      attachmentRaw?.url ||
      attachmentRaw?.fileUrl ||
      attachmentRaw?.path ||
      attachmentRaw?.filePath ||
      "";
    const attachment = fileUrlRaw
      ? {
          type: item?.messageType || attachmentRaw?.type || "File",
          name:
            item?.fileName ||
            attachmentRaw?.name ||
            String(fileUrlRaw).split("/").pop() ||
            "Attachment",
          size: item?.fileSize || attachmentRaw?.size || 0,
          mimeType: item?.mimeType || attachmentRaw?.mimeType || "",
          url: resolveAssetUrl(fileUrlRaw),
        }
      : undefined;

    const replyRaw = pickFirst(
      item?.replyTo,
      item?.reply_to,
      item?.repliedTo,
      item?.replied_to,
      item?.quotedMessage,
      item?.quoted_message,
      item?.reply,
      item?.parentMessage,
      item?.parent_message,
      null,
    );
    const replyObject =
      replyRaw && typeof replyRaw === "object" ? replyRaw : null;
    const replyMessageId = replyObject
      ? pickFirst(
          replyObject?.messageId,
          replyObject?.message_id,
          replyObject?.id,
          replyObject?._id,
          replyObject?.parentId,
          replyObject?.parent_id,
          replyObject?.replyToId,
          replyObject?.reply_to_id,
          replyObject?.repliedToId,
          replyObject?.quotedMessageId,
          null,
        )
      : pickFirst(
          item?.replyToId,
          item?.reply_to_id,
          item?.repliedToId,
          item?.replied_to_id,
          item?.quotedMessageId,
          item?.quoted_message_id,
          item?.parentMessageId,
          item?.parent_message_id,
          replyRaw,
        );

    const replyText =
      pickFirst(
        replyObject?.text,
        replyObject?.message,
        replyObject?.content,
        replyObject?.body,
        item?.replyText,
        item?.reply_text,
        item?.replyMessage,
        item?.reply_message,
        item?.replyContent,
        item?.reply_content,
        item?.quotedText,
        item?.quoted_text,
        "",
      ) ||
      (() => {
        if (!replyMessageId) return "";
        const target = rows.find((row) =>
          [row?.id, row?._id, row?.messageId].some(
            (candidate) =>
              candidate !== undefined &&
              candidate !== null &&
              String(candidate) === String(replyMessageId),
          ),
        );
        return (
          pickFirst(target?.text, target?.message, target?.content, target?.body, "") ||
          ""
        );
      })();

    const replySenderIdentifier = pickFirst(
      replyObject?.senderId,
      replyObject?.sender_id,
      replyObject?.sender?.userId,
      replyObject?.sender?.id,
      replyObject?.sender,
      item?.replySenderId,
      item?.reply_sender_id,
      item?.replySender,
      item?.reply_sender,
      item?.quotedSenderId,
      item?.quoted_sender_id,
      null,
    );
    const replyMineByActor =
      actorId &&
      replySenderIdentifier &&
      String(replySenderIdentifier) === String(actorId);
    const normalizedReplySenderId =
      replySenderIdentifier === "me" || replyMineByActor ? "me" : "other";
    const replyTo = replyMessageId || replyText
      ? {
          messageId: replyMessageId,
          text: replyText,
          senderId: normalizedReplySenderId,
        }
      : undefined;

    return {
      id: pickFirst(item?.id, item?._id, item?.messageId, idx + 1),
      senderId: mine ? "me" : "other",
      text:
        pickFirst(item?.text, item?.message, item?.content, item?.body, "") ||
        "(empty)",
      time: formatMessageTime(
        pickFirst(item?.createdAt, item?.timestamp, item?.time),
      ),
      read: Boolean(pickFirst(item?.read, item?.isRead, mine)),
      attachment,
      location: hasLocation
        ? { lat: Number(location.lat), lng: Number(location.lng) }
        : undefined,
      replyTo,
    };
  });
};

const hydrateRepliesFromPrevious = (nextMessages, previousMessages = []) => {
  if (!Array.isArray(nextMessages) || nextMessages.length === 0) return [];
  if (!Array.isArray(previousMessages) || previousMessages.length === 0) {
    return nextMessages;
  }

  const replyCandidates = previousMessages.filter(
    (item) => (item?.replyTo?.messageId || item?.replyTo?.text) && item?.text,
  );

  if (replyCandidates.length === 0) return nextMessages;

  return nextMessages.map((msg) => {
    if (msg?.replyTo?.messageId || msg?.replyTo?.text) return msg;

    let candidateIndex = replyCandidates.findIndex(
      (candidate) =>
        String(candidate?.senderId) === String(msg?.senderId) &&
        String(candidate?.text || "").trim() ===
          String(msg?.text || "").trim() &&
        Boolean(candidate?.replyTo?.messageId || candidate?.replyTo?.text),
    );

    if (candidateIndex < 0) {
      candidateIndex = replyCandidates.findIndex(
        (candidate) =>
          String(candidate?.text || "").trim() ===
            String(msg?.text || "").trim() &&
          Boolean(candidate?.replyTo?.messageId || candidate?.replyTo?.text),
      );
    }

    if (candidateIndex < 0) return msg;

    const [candidate] = replyCandidates.splice(candidateIndex, 1);
    return {
      ...msg,
      replyTo: candidate.replyTo,
    };
  });
};

const parseUpdatedReadCount = (payload) => {
  const value = pickFirst(
    payload?.updatedCount,
    payload?.updated,
    payload?.count,
    payload?.data?.updatedCount,
    payload?.data?.updated,
    payload?.data?.count,
    0,
  );
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export default function Messages() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { decrementUnreadMessages, refetchUnreadMessages } = useUnreadCounts();
  const { data: profileData } = useUserProfileQuery({ retry: false });
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [attachmentMenuAnchor, setAttachmentMenuAnchor] = useState(null);
  const [chatMenuAnchor, setChatMenuAnchor] = useState(null);
  const [conversationsList, setConversationsList] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [clearChatDialogOpen, setClearChatDialogOpen] = useState(false);
  const [deleteChatDialogOpen, setDeleteChatDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [attachmentComposeOpen, setAttachmentComposeOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [attachmentCaption, setAttachmentCaption] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [mapViewOpen, setMapViewOpen] = useState(false);
  const [viewingLocation, setViewingLocation] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  // File input refs
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageEndRef = useRef(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const pendingAttachmentPreviewUrl = useMemo(() => {
    if (!pendingAttachment?.file) return "";
    return URL.createObjectURL(pendingAttachment.file);
  }, [pendingAttachment?.file]);

  useEffect(() => {
    return () => {
      if (pendingAttachmentPreviewUrl) {
        URL.revokeObjectURL(pendingAttachmentPreviewUrl);
      }
    };
  }, [pendingAttachmentPreviewUrl]);

  const scrollToLatestMessage = React.useCallback((behavior = "smooth") => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior, block: "end" });
      return;
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const currentUserId = useMemo(
    () => {
      const fromProfile = pickFirst(
        profileData?.user?.userId,
        profileData?.user?.id,
        profileData?.data?.user?.userId,
        profileData?.data?.user?.id,
        profileData?.data?.seller?.userId,
        profileData?.data?.seller?.id,
        profileData?.seller?.userId,
        profileData?.seller?.id,
        profileData?.userId,
        profileData?.id,
        profileData?.data?.userId,
      );
      return fromProfile || getUserIdFromAccessToken();
    },
    [profileData],
  );

  const markChatAsRead = React.useCallback(
    async (chatId) => {
      if (!chatId) return;
      try {
        const response = await markChatMessagesAsRead(chatId);
        const updatedCount = parseUpdatedReadCount(response);

        if (updatedCount > 0) {
          decrementUnreadMessages(updatedCount);
        } else {
          refetchUnreadMessages();
        }

        setConversationsList((prev) =>
          prev.map((conv) =>
            String(conv.id) === String(chatId) ? { ...conv, unread: 0 } : conv,
          ),
        );
      } catch {
        refetchUnreadMessages();
      }
    },
    [decrementUnreadMessages, refetchUnreadMessages],
  );

  const {
    data: conversationsResponse,
    isPending: isLoadingConversations,
    isError: isConversationsError,
  } = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: () => getConversations(),
    retry: false,
  });

  const normalizedConversations = useMemo(
    () =>
      normalizeConversationsResponse(conversationsResponse, { currentUserId }),
    [conversationsResponse, currentUserId],
  );

  useEffect(() => {
    setConversationsList(normalizedConversations);
  }, [normalizedConversations]);

  const selectedConversation = useMemo(
    () =>
      conversationsList.find(
        (conversation) =>
          String(conversation.id) === String(selectedConversationId),
      ) || null,
    [conversationsList, selectedConversationId],
  );

  const {
    data: messagesResponse,
    isPending: isLoadingMessages,
    isError: isMessagesError,
  } = useQuery({
    queryKey: ["messages", "conversation", selectedConversationId],
    queryFn: () => getConversationMessages(selectedConversationId),
    enabled: Boolean(selectedConversationId),
    retry: false,
  });

  useEffect(() => {
    if (!selectedConversationId || isLoadingMessages) return;
    const behavior = messages.length <= 1 ? "auto" : "smooth";
    const timer = setTimeout(() => scrollToLatestMessage(behavior), 0);
    return () => clearTimeout(timer);
  }, [
    messages.length,
    selectedConversationId,
    isLoadingMessages,
    scrollToLatestMessage,
  ]);

  const normalizedMessages = useMemo(
    () =>
      normalizeMessagesResponse(messagesResponse, {
        currentUserId,
        sellerId: selectedConversation?.sellerId,
        otherUserId: selectedConversation?.user?.id,
      }),
    [
      messagesResponse,
      currentUserId,
      selectedConversation?.sellerId,
      selectedConversation?.user?.id,
    ],
  );

  useEffect(() => {
    if (selectedConversationId) {
      setMessages((prev) => hydrateRepliesFromPrevious(normalizedMessages, prev));
      return;
    }
    setMessages([]);
  }, [selectedConversationId, normalizedMessages]);

  // Connect socket once on mount
  useEffect(() => {
    connectSocket();
  }, []);

  // Track which chat rooms we have already joined to avoid redundant emits
  const joinedRoomsRef = useRef(new Set());

  // Join a room for every conversation so the list updates in real time even when
  // no specific chat is open. New rooms are joined incrementally as new chats appear.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    conversationsList.forEach((conv) => {
      const chatId = String(conv.id ?? "");
      if (
        chatId &&
        chatId !== "undefined" &&
        !joinedRoomsRef.current.has(chatId)
      ) {
        socket.emit("join_chat", conv.id);
        joinedRoomsRef.current.add(chatId);
      }
    });
  }, [conversationsList]);

  // Single global new_message listener — updates the conversation list for any chat
  // and appends to the messages view only when the incoming chat is currently open.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = ({ message: incoming }) => {
      const incomingChatId = incoming?.chatId;
      const [normalized] = normalizeMessagesResponse(
        { messages: [incoming] },
        {
          currentUserId,
          sellerId: selectedConversation?.sellerId,
          otherUserId: selectedConversation?.user?.id,
        },
      );
      if (!normalized) return;
      const isMine = normalized.senderId === "me";

      // Append to active messages only if this chat is open and sent by the other party
      if (
        !isMine &&
        String(incomingChatId) === String(selectedConversationId)
      ) {
        setMessages((prev) => [...prev, normalized]);
        markChatAsRead(incomingChatId);
      }

      // Update conversation list in-place (last message preview + unread badge)
      setConversationsList((prev) =>
        prev.map((conv) =>
          String(conv.id) === String(incomingChatId)
            ? {
                ...conv,
                lastMessage: normalized.text,
                lastMessageIsMine: isMine,
                lastMessageRead: false,
                time: formatMessageTime(incoming?.createdAt),
                unread:
                  !isMine && String(conv.id) !== String(selectedConversationId)
                    ? (conv.unread || 0) + 1
                    : conv.unread,
              }
            : conv,
        ),
      );
    };

    socket.on("new_message", handleNewMessage);
    return () => socket.off("new_message", handleNewMessage);
  }, [
    currentUserId,
    selectedConversationId,
    selectedConversation?.sellerId,
    selectedConversation?.user?.id,
    markChatAsRead,
  ]);

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, text, receiverId, replyTo: replyData }) =>
      sendConversationMessage(conversationId, {
        text,
        message: text,
        content: text,
        receiverId,
        ...(replyData
          ? {
              replyTo: replyData,
              reply_to: replyData,
              repliedTo: replyData,
              quotedMessage: replyData,
              replyToId: replyData?.messageId,
              reply_to_id: replyData?.messageId,
              repliedToId: replyData?.messageId,
              quotedMessageId: replyData?.messageId,
              parentMessageId: replyData?.messageId,
              parent_message_id: replyData?.messageId,
              replyText: replyData?.text,
              reply_text: replyData?.text,
              replySenderId: replyData?.senderId,
              reply_sender_id: replyData?.senderId,
            }
          : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["messages", "conversation", selectedConversationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["messages", "conversations"],
      });
    },
    onError: (error) => {
      showSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to send message",
        "error",
      );
    },
  });

  const chatMenuOptions = [
    { id: "profile", label: "Profile", icon: PersonIcon, color: "#667eea" },
    { id: "close", label: "Close Chat", icon: CloseIcon, color: "#757575" },
    {
      id: "archive",
      label: "Archive Chat",
      icon: ArchiveIcon,
      color: "#607d8b",
    },
    { id: "report", label: "Report", icon: ReportIcon, color: "#ff9800" },
    { id: "block", label: "Block", icon: BlockIcon, color: "#f44336" },
    {
      id: "clear",
      label: "Clear Chat",
      icon: DeleteSweepIcon,
      color: "#9e9e9e",
      divider: true,
    },
    { id: "delete", label: "Delete Chat", icon: DeleteIcon, color: "#f44336" },
  ];

  const attachmentOptions = [
    { id: "camera", label: "Camera", icon: CameraAltIcon, color: "#e91e63" },
    {
      id: "photos",
      label: "Photos & Videos",
      icon: ImageIcon,
      color: "#9c27b0",
    },
    {
      id: "documents",
      label: "Documents",
      icon: DescriptionIcon,
      color: "#3f51b5",
    },
    {
      id: "location",
      label: "Location",
      icon: LocationOnIcon,
      color: "#4caf50",
    },
    { id: "contact", label: "Contact", icon: ContactsIcon, color: "#00bcd4" },
  ];

  const filterTags = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "buying", label: "Buying" },
    { id: "selling", label: "Selling" },
    { id: "archived", label: "Archived" },
  ];

  const handleSelectConversation = (conversation) => {
    setSelectedConversationId(conversation.id);
  };

  useEffect(() => {
    if (!selectedConversationId) return;
    markChatAsRead(selectedConversationId);
  }, [selectedConversationId, markChatAsRead]);

  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  const handleSendMessage = () => {
    const text = messageInput.trim();
    if (!text || !selectedConversationId || sendMessageMutation.isPending)
      return;
    const receiverId =
      selectedConversation?.user?.id ||
      (String(currentUserId) === String(selectedConversation?.sellerId)
        ? selectedConversation?.buyerId
        : selectedConversation?.sellerId) ||
      selectedConversation?.buyerId;
    const replyData = replyTo
      ? {
          messageId: replyTo.id,
          text: replyTo.text || "",
          senderId: replyTo.senderId,
        }
      : null;

    // Optimistically add message with reply data
    const optimisticMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: "me",
      text,
      time: "Just now",
      read: false,
      ...(replyData ? { replyTo: replyData } : {}),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput("");
    setReplyTo(null);

    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      text,
      receiverId,
      replyTo: replyData,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Chat menu action handlers
  const handleMenuAction = (actionId) => {
    setChatMenuAnchor(null);
    switch (actionId) {
      case "profile":
        setProfileDialogOpen(true);
        break;
      case "close":
        handleBackToList();
        break;
      case "archive":
        handleArchiveChat();
        break;
      case "report":
        setReportDialogOpen(true);
        break;
      case "block":
        setBlockDialogOpen(true);
        break;
      case "clear":
        setClearChatDialogOpen(true);
        break;
      case "delete":
        setDeleteChatDialogOpen(true);
        break;
      default:
        break;
    }
  };

  const handleArchiveChat = () => {
    if (selectedConversation) {
      setArchivedChats([...archivedChats, selectedConversation.id]);
      setConversationsList(
        conversationsList.filter((c) => c.id !== selectedConversation.id),
      );
      setSelectedConversationId(null);
      showSnackbar("Chat archived successfully");
    }
  };

  const handleBlockUser = () => {
    if (selectedConversation) {
      setBlockedUsers([...blockedUsers, selectedConversation.user.name]);
      setConversationsList(
        conversationsList.filter((c) => c.id !== selectedConversation.id),
      );
      setSelectedConversationId(null);
      setBlockDialogOpen(false);
      showSnackbar(
        `${selectedConversation.user.name} has been blocked`,
        "warning",
      );
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setClearChatDialogOpen(false);
    showSnackbar("Chat cleared successfully");
  };

  const handleDeleteChat = () => {
    if (selectedConversation) {
      setConversationsList(
        conversationsList.filter((c) => c.id !== selectedConversation.id),
      );
      setSelectedConversationId(null);
      setDeleteChatDialogOpen(false);
      showSnackbar("Chat deleted successfully");
    }
  };

  const handleSubmitReport = () => {
    if (reportReason) {
      // Here you would send the report to your backend
      console.log("Report submitted:", {
        user: selectedConversation?.user.name,
        reason: reportReason,
      });
      setReportDialogOpen(false);
      setReportReason("");
      showSnackbar("Report submitted successfully. We'll review it shortly.");
    }
  };

  // Attachment handlers
  const handleAttachmentAction = (actionId) => {
    setAttachmentMenuAnchor(null);
    switch (actionId) {
      case "camera":
        cameraInputRef.current?.click();
        break;
      case "photos":
        photoInputRef.current?.click();
        break;
      case "documents":
        documentInputRef.current?.click();
        break;
      case "location":
        handleGetLocation();
        break;
      case "contact":
        setContactDialogOpen(true);
        break;
      default:
        break;
    }
  };

  const handleSaveAttachment = async (attachment) => {
    const attachmentUrl = attachment?.url;
    if (!attachmentUrl) {
      showSnackbar("No attachment URL available", "error");
      return;
    }
    const fallbackName =
      attachment?.name ||
      String(attachmentUrl).split("?")[0].split("#")[0].split("/").pop() ||
      "attachment";
    try {
      const response = await fetch(attachmentUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fallbackName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      showSnackbar("File saved to your device");
    } catch (error) {
      const link = document.createElement("a");
      link.href = attachmentUrl;
      link.download = fallbackName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSnackbar("Save started");
    }
  };

  const handleOpenAttachment = (attachment) => {
    const attachmentUrl = attachment?.url;
    if (!attachmentUrl) return;
    window.open(attachmentUrl, "_blank", "noopener,noreferrer");
  };

  const resetAttachmentComposer = () => {
    setAttachmentComposeOpen(false);
    setPendingAttachment(null);
    setAttachmentCaption("");
  };

  const handleSendPendingAttachment = async () => {
    if (!pendingAttachment?.file || !pendingAttachment?.type) return;
    const { file, type } = pendingAttachment;
    const captionText = attachmentCaption.trim();
    try {
      const attachmentMessage = captionText || `📎 ${type} attachment`;
      const conversationId = selectedConversationId;
      const receiverId =
        selectedConversation?.buyerId || selectedConversation?.user?.id;
      if (!conversationId || !receiverId) {
        showSnackbar("Select a conversation first", "warning");
        resetAttachmentComposer();
        return;
      }
      const storagePath = resolveChatStoragePath(file, type);
      try {
        const response = await sendConversationAttachment(conversationId, {
          file,
          receiverId,
          message: attachmentMessage,
          storagePath,
        });
        const fileUrl = response?.fileUrl || "";
        const localPreviewUrl = URL.createObjectURL(file);
        const newMessage = {
          id: `${Date.now()}-${Math.random()}`,
          senderId: "me",
          text: attachmentMessage,
          time: "Just now",
          read: false,
          attachment: {
            type,
            name: file.name,
            size: file.size,
            mimeType: file.type || "",
            url: resolveAssetUrl(fileUrl) || localPreviewUrl,
          },
        };
        setMessages((prev) => [...prev, newMessage]);
        showSnackbar(`${type} attached successfully`);
        setMessageInput("");
        resetAttachmentComposer();
        await queryClient.invalidateQueries({
          queryKey: ["messages", "conversation", selectedConversationId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["messages", "conversations"],
        });
      } catch (error) {
        showSnackbar(
          error?.response?.data?.message ||
            error?.message ||
            `Failed to attach ${type.toLowerCase()}`,
          "error",
        );
      }
    } catch (error) {
      showSnackbar("Failed to send attachment", "error");
    }
  };

  const handleFileSelected = (event, type) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setPendingAttachment({ file, type });
      setAttachmentCaption(messageInput.trim());
      setAttachmentComposeOpen(true);
    }
    event.target.value = "";
  };

  const handleGetLocation = () => {
    setLocationLoading(true);
    setLocationDialogOpen(true);
    setLocationError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationLoading(false);

          let errorMessage = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location permission denied. Please allow location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage =
                "Location information is unavailable. Please try again.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage =
                "An unknown error occurred while getting location.";
              break;
          }
          setLocationError(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      setLocationLoading(false);
      setLocationError("Geolocation is not supported by your browser.");
    }
  };

  const handleSendLocation = async () => {
    if (!userLocation) return;
    const conversationId = selectedConversationId;
    const receiverId =
      selectedConversation?.user?.id ||
      (String(currentUserId) === String(selectedConversation?.sellerId)
        ? selectedConversation?.buyerId
        : selectedConversation?.sellerId) ||
      selectedConversation?.buyerId;
    if (!conversationId || !receiverId) {
      showSnackbar("Select a conversation first", "warning");
      return;
    }
    const locationText = selectedLocationName
      ? `📍 ${selectedLocationName}`
      : "📍 Location shared";
    try {
      await sendConversationMessage(conversationId, {
        text: locationText,
        message: locationText,
        content: locationText,
        receiverId,
        messageType: "location",
        location: { lat: userLocation.lat, lng: userLocation.lng, name: selectedLocationName || "" },
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        locationLat: userLocation.lat,
        locationLng: userLocation.lng,
        locationName: selectedLocationName || "",
      });
      const newMessage = {
        id: `${Date.now()}-${Math.random()}`,
        senderId: "me",
        text: locationText,
        time: "Just now",
        read: false,
        location: userLocation,
      };
      setMessages((prev) => [...prev, newMessage]);
      await queryClient.invalidateQueries({
        queryKey: ["messages", "conversation", selectedConversationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["messages", "conversations"],
      });
      setLocationDialogOpen(false);
      setUserLocation(null);
      setLocationSearch("");
      setLocationSearchResults([]);
      setSelectedLocationName("");
      showSnackbar("Location sent successfully");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to send location",
        "error",
      );
    }
  };

  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return;

    setLocationSearching(true);
    setLocationError(null);

    try {
      // Using OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=5`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setLocationSearchResults(
          data.map((item) => ({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type,
          })),
        );
      } else {
        setLocationSearchResults([]);
        showSnackbar("No locations found. Try a different search.", "info");
      }
    } catch (error) {
      console.error("Location search error:", error);
      showSnackbar("Error searching location. Please try again.", "error");
    } finally {
      setLocationSearching(false);
    }
  };

  const handleSelectSearchedLocation = (location) => {
    setUserLocation({ lat: location.lat, lng: location.lng });
    setSelectedLocationName(location.name.split(",")[0]);
    setLocationSearchResults([]);
    setLocationSearch("");
  };

  const handleSendContact = (contact) => {
    const newMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: "me",
      text: `👤 Contact: ${contact.name}`,
      time: "Just now",
      read: false,
      contact,
    };
    setMessages((prev) => [...prev, newMessage]);
    setContactDialogOpen(false);
    showSnackbar("Contact sent successfully");
  };

  const filteredConversations = conversationsList.filter((conv) => {
    // Search filter
    const matchesSearch =
      conv.listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Tag filter
    let matchesFilter = true;
    switch (activeFilter) {
      case "unread":
        matchesFilter = conv.unread > 0;
        break;
      case "buying":
        matchesFilter = conv.type === "buying";
        break;
      case "selling":
        matchesFilter = conv.type === "selling";
        break;
      case "archived":
        matchesFilter = archivedChats.includes(conv.id);
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  const selectedListingPath = useMemo(() => {
    const listingId = selectedConversation?.listing?.id;
    if (!listingId) return "";

    if (selectedConversation?.listing?.isAdvertisement) {
      return `/advertisements/${listingId}`;
    }

    return `/inventory/${listingId}/edit`;
  }, [selectedConversation]);

  // Render conversation list
  const renderConversationList = () => (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        bgcolor: "white",
        border: isMobile ? "none" : "1px solid #e0e0e0",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Messages
        </Typography>
        <TextField
          fullWidth
          placeholder="Search by product or person..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: alpha("#667eea", 0.05),
            },
          }}
        />
        {/* Filter Tags */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 2,
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {filterTags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.label}
              onClick={() => setActiveFilter(tag.id)}
              sx={{
                fontWeight: 600,
                fontSize: 12,
                px: 0.5,
                bgcolor:
                  activeFilter === tag.id ? "#667eea" : alpha("#667eea", 0.08),
                color: activeFilter === tag.id ? "white" : "text.primary",
                border: "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor:
                    activeFilter === tag.id
                      ? "#667eea"
                      : alpha("#667eea", 0.15),
                },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Conversation List */}
      <List sx={{
            flex: 1,
            overflow: "auto",
            p: 0,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-track": {
              bgcolor: alpha("#667eea", 0.05),
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: alpha("#667eea", 0.25),
              borderRadius: 3,
              "&:hover": { bgcolor: alpha("#667eea", 0.4) },
            },
            scrollbarWidth: "thin",
            scrollbarColor: `${alpha("#667eea", 0.25)} ${alpha("#667eea", 0.05)}`,
          }}>
        {isLoadingConversations ? (
          <Box sx={{ p: 3 }}>
            <Typography fontSize={13} color="text.secondary">
              Loading conversations...
            </Typography>
          </Box>
        ) : isConversationsError ? (
          <Box sx={{ p: 3 }}>
            <Typography fontSize={13} color="error.main">
              Unable to load conversations.
            </Typography>
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography fontSize={13} color="text.secondary">
              No conversations found.
            </Typography>
          </Box>
        ) : (
          filteredConversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation)}
              sx={{
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
                bgcolor:
                  selectedConversation?.id === conversation.id
                    ? alpha("#667eea", 0.08)
                    : "transparent",
                "&:hover": { bgcolor: alpha("#667eea", 0.05) },
                py: 1.5,
                px: 2,
              }}
            >
              {/* Product Image - Primary */}
              <ListItemAvatar>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid #e0e0e0",
                    position: "relative",
                  }}
                >
                  <img
                    src={conversation.listing.image}
                    alt={conversation.listing.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {/* User avatar overlay */}
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    badgeContent={
                      conversation.user.online ? (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#4caf50",
                            border: "1.5px solid white",
                          }}
                        />
                      ) : null
                    }
                    sx={{ position: "absolute", bottom: -4, right: -4 }}
                  >
                    <Avatar
                      src={conversation.user.avatar}
                      sx={{
                        width: 24,
                        height: 24,
                        border: "2px solid white",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </Badge>
                </Box>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Stack spacing={0.25}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography
                        component="span"
                        fontWeight={600}
                        fontSize={14}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 180,
                        }}
                      >
                        {conversation.listing.title} - {conversation.user.name}
                      </Typography>
                      {conversation.user.verified && (
                        <VerifiedIcon sx={{ fontSize: 14, color: "#667eea" }} />
                      )}
                    </Stack>
                    <Typography
                      component="span"
                      fontSize={13}
                      fontWeight={600}
                      sx={{ color: "#667eea", display: "block" }}
                    >
                      {conversation.listing.price}
                    </Typography>
                  </Stack>
                }
                primaryTypographyProps={{ component: "div" }}
                secondary={
                  <Stack
                    direction="row"
                    spacing={0.4}
                    alignItems="center"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 180,
                      display: "flex",
                    }}
                  >
                    {conversation.lastMessageIsMine && (
                      <DoneAllIcon
                        sx={{
                          fontSize: 14,
                          color: conversation.lastMessageRead
                            ? "#4caf50"
                            : "text.disabled",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography
                      component="span"
                      fontSize={12}
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                        fontWeight: conversation.unread > 0 ? 600 : 400,
                      }}
                    >
                      {conversation.lastMessageIsMine
                        ? `You: ${conversation.lastMessage}`
                        : conversation.lastMessage}
                    </Typography>
                  </Stack>
                }
                secondaryTypographyProps={{ component: "div" }}
                sx={{ ml: 1.5 }}
              />
              <Stack alignItems="flex-end" spacing={0.5}>
                <Typography fontSize={11} color="text.disabled">
                  {conversation.time}
                </Typography>
                {conversation.unread > 0 && (
                  <Box
                    sx={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: gradientPrimary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography fontSize={11} fontWeight={700} color="white">
                      {conversation.unread}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );

  // Render chat view
  const renderChatView = () => (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        bgcolor: "white",
        border: isMobile ? "none" : "1px solid #e0e0e0",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {selectedConversation ? (
        <>
          {/* Chat Header - Product focused */}
          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {isMobile && (
              <IconButton onClick={handleBackToList} sx={{ p: 0 }}>
                <ArrowBackIcon />
              </IconButton>
            )}
            {/* Product Image */}
            <Box
              onClick={() => {
                if (!selectedListingPath) return;
                navigate(selectedListingPath);
              }}
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                overflow: "hidden",
                border: "1px solid #e0e0e0",
                flexShrink: 0,
                cursor: selectedListingPath ? "pointer" : "default",
              }}
            >
              <img
                src={selectedConversation.listing.image}
                alt={selectedConversation.listing.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Stack
              flex={1}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1.5}
              minWidth={0}
            >
              <Stack spacing={0.25} minWidth={0}>
                <Typography
                  fontWeight={600}
                  fontSize={15}
                  onClick={() => {
                    if (!selectedListingPath) return;
                    navigate(selectedListingPath);
                  }}
                  sx={{
                    cursor: selectedListingPath ? "pointer" : "default",
                    width: "fit-content",
                    maxWidth: { xs: 140, md: 260 },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    "&:hover": selectedListingPath
                      ? { textDecoration: "underline" }
                      : undefined,
                  }}
                >
                  {selectedConversation.listing.title}
                </Typography>
                <Typography fontSize={14} fontWeight={600} color="#667eea">
                  {selectedConversation.listing.price}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ display: { xs: "none", sm: "flex" }, minWidth: 0 }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    selectedConversation.user.online ? (
                      <Box
                        sx={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          bgcolor: "#4caf50",
                          border: "2px solid white",
                        }}
                      />
                    ) : null
                  }
                >
                  <Avatar
                    src={selectedConversation.user.avatar}
                    sx={{ width: 32, height: 32 }}
                  />
                </Badge>
                <Stack spacing={0} minWidth={0}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography
                      fontWeight={500}
                      fontSize={13}
                      noWrap
                      sx={{ maxWidth: 160 }}
                    >
                      {selectedConversation.user.name}
                    </Typography>
                    {selectedConversation.user.verified && (
                      <VerifiedIcon sx={{ fontSize: 14, color: "#667eea" }} />
                    )}
                  </Stack>
                  <Typography fontSize={11} color="text.secondary" noWrap>
                    {selectedConversation.user.online ? "Online" : "Last seen recently"}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                sx={{
                  color: "#667eea",
                  bgcolor: alpha("#667eea", 0.1),
                  width: 34,
                  height: 34,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: alpha("#667eea", 0.2),
                    transform: "scale(1.05)",
                  },
                }}
              >
                <SearchIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                sx={{
                  color: "#667eea",
                  bgcolor: alpha("#667eea", 0.1),
                  width: 34,
                  height: 34,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: alpha("#667eea", 0.2),
                    transform: "scale(1.05)",
                  },
                }}
              >
                <PhoneIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                sx={{
                  color: "#667eea",
                  bgcolor: alpha("#667eea", 0.1),
                  width: 34,
                  height: 34,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: alpha("#667eea", 0.2),
                    transform: "scale(1.05)",
                  },
                }}
              >
                <VideocamIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                onClick={(e) => setChatMenuAnchor(e.currentTarget)}
                sx={{
                  color: "#666",
                  width: 34,
                  height: 34,
                  transition: "all 0.2s ease",
                  "&:hover": { bgcolor: alpha("#000", 0.05) },
                }}
              >
                <MoreVertIcon sx={{ fontSize: 18 }} />
              </IconButton>

              {/* Chat Options Menu */}
              <Menu
                anchorEl={chatMenuAnchor}
                open={Boolean(chatMenuAnchor)}
                onClose={() => setChatMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    minWidth: 200,
                    p: 1,
                  },
                }}
              >
                {chatMenuOptions.map((option) => (
                  <React.Fragment key={option.id}>
                    {option.divider && (
                      <Box
                        sx={{ height: "1px", bgcolor: "#e0e0e0", my: 1, mx: 1 }}
                      />
                    )}
                    <MenuItem
                      onClick={() => handleMenuAction(option.id)}
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        px: 2,
                        mb: 0.5,
                        transition: "all 0.2s ease",
                        "&:hover": { bgcolor: alpha(option.color, 0.1) },
                      }}
                    >
                      <ListItemIcon>
                        <option.icon
                          sx={{ fontSize: 20, color: option.color }}
                        />
                      </ListItemIcon>
                      <Typography
                        fontSize={14}
                        fontWeight={500}
                        sx={{
                          color:
                            option.id === "delete" || option.id === "block"
                              ? option.color
                              : "inherit",
                        }}
                      >
                        {option.label}
                      </Typography>
                    </MenuItem>
                  </React.Fragment>
                ))}
              </Menu>
            </Stack>
          </Box>

          {/* Messages */}
          <Box
            ref={messagesContainerRef}
            sx={{
              flex: 1,
              overflow: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              bgcolor: "#fafafa",
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-track": {
                bgcolor: alpha("#667eea", 0.05),
                borderRadius: 3,
              },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: alpha("#667eea", 0.2),
                borderRadius: 3,
                "&:hover": { bgcolor: alpha("#667eea", 0.35) },
              },
              scrollbarWidth: "thin",
              scrollbarColor: `${alpha("#667eea", 0.2)} ${alpha("#667eea", 0.05)}`,
            }}
          >
            {isLoadingMessages ? (
              <Typography fontSize={13} color="text.secondary">
                Loading messages...
              </Typography>
            ) : isMessagesError ? (
              <Typography fontSize={13} color="error.main">
                Unable to load messages for this conversation.
              </Typography>
            ) : messages.length === 0 ? (
              <Typography fontSize={13} color="text.secondary">
                No messages yet.
              </Typography>
            ) : (
              messages.map((message) => (
                <Box
                  key={message.id}
                  id={`msg-${message.id}`}
                  sx={{
                    display: "flex",
                    justifyContent:
                      message.senderId === "me" ? "flex-end" : "flex-start",
                    position: "relative",
                    "&:hover .reply-btn": { opacity: 1 },
                  }}
                >
                  {/* Reply Button */}
                  {message.senderId === "me" && (
                    <IconButton
                      className="reply-btn"
                      size="small"
                      onClick={() => setReplyTo(message)}
                      sx={{
                        opacity: 0,
                        transition: "opacity 0.2s ease",
                        alignSelf: "center",
                        mr: 0.5,
                        color: alpha("#667eea", 0.6),
                        "&:hover": { color: "#667eea", bgcolor: alpha("#667eea", 0.08) },
                      }}
                    >
                      <ReplyIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                  <Box
                    sx={{
                      maxWidth: { xs: "92%", md: "84%", lg: "80%" },
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                  {message.location ? (
                    // Location Message with Map Preview
                    <Box
                      onClick={() => {
                        setViewingLocation({
                          ...message.location,
                          name: message.text.replace("📍 ", ""),
                        });
                        setMapViewOpen(true);
                      }}
                      sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        cursor: "pointer",
                        boxShadow:
                          message.senderId === "me"
                            ? "0 2px 8px rgba(102, 126, 234, 0.3)"
                            : "0 1px 3px rgba(0,0,0,0.1)",
                        transition: "transform 0.2s ease",
                        "&:hover": { transform: "scale(1.02)" },
                      }}
                    >
                      {/* Map Preview */}
                      <Box
                        sx={{
                          width: 250,
                          height: 150,
                          bgcolor: alpha("#4caf50", 0.1),
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <iframe
                          title="Location Map"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          style={{ border: 0, pointerEvents: "none" }}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${message.location.lng - 0.01},${message.location.lat - 0.01},${message.location.lng + 0.01},${message.location.lat + 0.01}&layer=mapnik&marker=${message.location.lat},${message.location.lng}`}
                        />
                        {/* Tap to view overlay */}
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background:
                              "linear-gradient(transparent, rgba(0,0,0,0.5))",
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <LocationOnIcon
                            sx={{ fontSize: 16, color: "white" }}
                          />
                          <Typography fontSize={11} color="white">
                            Tap to view
                          </Typography>
                        </Box>
                      </Box>
                      {/* Location Info */}
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor:
                            message.senderId === "me" ? "#667eea" : "white",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor:
                                message.senderId === "me"
                                  ? "rgba(255,255,255,0.2)"
                                  : alpha("#4caf50", 0.1),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <LocationOnIcon
                              sx={{
                                fontSize: 18,
                                color:
                                  message.senderId === "me"
                                    ? "white"
                                    : "#4caf50",
                              }}
                            />
                          </Box>
                          <Box flex={1}>
                            <Typography
                              fontSize={13}
                              fontWeight={500}
                              color={
                                message.senderId === "me"
                                  ? "white"
                                  : "text.primary"
                              }
                              noWrap
                            >
                              {message.text.replace("📍 ", "")}
                            </Typography>
                            <Typography
                              fontSize={11}
                              color={
                                message.senderId === "me"
                                  ? "rgba(255,255,255,0.7)"
                                  : "text.secondary"
                              }
                            >
                              {message.location.lat.toFixed(4)},{" "}
                              {message.location.lng.toFixed(4)}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="flex-end"
                          spacing={0.5}
                          mt={0.5}
                        >
                          <Typography
                            fontSize={10}
                            color={
                              message.senderId === "me"
                                ? "rgba(255,255,255,0.7)"
                                : "text.disabled"
                            }
                          >
                            {message.time}
                          </Typography>
                          {message.senderId === "me" && (
                            <DoneAllIcon
                              sx={{
                                fontSize: 14,
                                color: message.read
                                  ? "#4caf50"
                                  : "rgba(255,255,255,0.5)",
                              }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  ) : message.attachment ? (
                    (() => {
                      const attachment = message.attachment;
                      const attachmentName = attachment?.name || "Attachment";
                      const attachmentUrl = attachment?.url || "";
                      const typeLabel = String(
                        attachment?.type || "",
                      ).toLowerCase();
                      const mime = String(attachment?.mimeType || "").toLowerCase();
                      const inferredExt =
                        String(attachmentName || attachmentUrl)
                          .split("?")[0]
                          .split("#")[0]
                          .split(".")
                          .pop()
                          ?.toLowerCase() || "";
                      const imageExtensions = [
                        "jpg",
                        "jpeg",
                        "png",
                        "gif",
                        "webp",
                        "bmp",
                        "svg",
                        "avif",
                      ];
                      const videoExtensions = [
                        "mp4",
                        "mov",
                        "avi",
                        "mkv",
                        "webm",
                        "m4v",
                        "3gp",
                      ];
                      const isImage =
                        mime.startsWith("image/") ||
                        typeLabel.includes("photo") ||
                        typeLabel.includes("image") ||
                        imageExtensions.includes(inferredExt);
                      const isVideo =
                        mime.startsWith("video/") ||
                        typeLabel.includes("video") ||
                        typeLabel.includes("media") ||
                        videoExtensions.includes(inferredExt);
                      const isPdf = mime.includes("pdf") || inferredExt === "pdf";
                      const sizeText = formatFileSize(attachment?.size);
                      const fileMeta = `${isPdf ? "PDF" : inferredExt.toUpperCase() || "FILE"}${
                        sizeText ? ` • ${sizeText}` : ""
                      }`;
                      const caption = String(message?.text || "").trim();
                      const showCaption =
                        Boolean(caption) && !caption.startsWith("📎 ");

                      return (
                        <Box
                          onClick={() => handleOpenAttachment(attachment)}
                          sx={{
                            width: "min(300px, 70vw)",
                            borderRadius: 3,
                            overflow: "hidden",
                            bgcolor: message.senderId === "me" ? "#1a1f2d" : "#12161f",
                            color: "white",
                            cursor: attachmentUrl ? "pointer" : "default",
                            boxShadow:
                              message.senderId === "me"
                                ? "0 6px 18px rgba(15, 23, 42, 0.45)"
                                : "0 4px 14px rgba(0,0,0,0.2)",
                          }}
                        >
                          {isImage && attachmentUrl ? (
                            <Box sx={{ position: "relative" }}>
                              <Box
                                component="img"
                                src={attachmentUrl}
                                alt={attachmentName}
                                sx={{
                                  width: "100%",
                                  maxHeight: 210,
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 10,
                                  left: 10,
                                  px: 1,
                                  py: 0.3,
                                  borderRadius: 1,
                                  bgcolor: "rgba(0,0,0,0.6)",
                                  color: "white",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: 0.4,
                                  lineHeight: 1.2,
                                }}
                              >
                                IMAGE
                              </Box>
                            </Box>
                          ) : isVideo && attachmentUrl ? (
                            <Box
                              sx={{
                                height: 160,
                                bgcolor: "#0f172a",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                component="video"
                                src={attachmentUrl}
                                preload="metadata"
                                muted
                                playsInline
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  opacity: 0.85,
                                  pointerEvents: "none",
                                }}
                              />
                              <Box
                                sx={{
                                  position: "absolute",
                                  inset: 0,
                                  background:
                                    "linear-gradient(transparent 40%, rgba(0,0,0,0.55))",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(0,0,0,0.48)",
                                    border: "1px solid rgba(255,255,255,0.25)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <VideocamIcon sx={{ color: "white", fontSize: 28 }} />
                                </Box>
                              </Box>
                            </Box>
                          ) : isPdf && attachmentUrl ? (
                            <Box
                              sx={{
                                height: 140,
                                bgcolor: "#eceff1",
                                overflow: "hidden",
                                position: "relative",
                              }}
                            >
                              <Box
                                component="iframe"
                                title="Document Preview"
                                src={`${attachmentUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                scrolling="no"
                                sx={{
                                  position: "absolute",
                                  top: -18,
                                  left: -18,
                                  width: "calc(100% + 36px)",
                                  height: "calc(100% + 36px)",
                                  border: 0,
                                  overflow: "hidden",
                                  pointerEvents: "none",
                                }}
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                height: 120,
                                bgcolor: "#e8eaed",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <DescriptionIcon sx={{ fontSize: 40, color: "#64748b" }} />
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 10,
                                  left: 10,
                                  px: 1,
                                  py: 0.3,
                                  borderRadius: 1,
                                  bgcolor: "rgba(0,0,0,0.6)",
                                  color: "white",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: 0.4,
                                  lineHeight: 1.2,
                                }}
                              >
                                DOC
                              </Box>
                            </Box>
                          )}

                          {!isImage && !isVideo && (
                            <Box sx={{ px: 1.2, py: 1, bgcolor: "rgba(0,0,0,0.2)" }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1,
                                    bgcolor: "#e53935",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Typography fontSize={9} fontWeight={800} color="white">
                                    {isPdf ? "PDF" : "DOC"}
                                  </Typography>
                                </Box>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography
                                    fontSize={14}
                                    fontWeight={600}
                                    noWrap
                                    color="rgba(255,255,255,0.95)"
                                  >
                                    {attachmentName}
                                  </Typography>
                                  <Typography fontSize={11} color="rgba(255,255,255,0.72)">
                                    {fileMeta}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          )}

                          {showCaption && (
                            <Box sx={{ px: 1.2, py: 0.9, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                              <Typography fontSize={13} color="rgba(255,255,255,0.92)">
                                {caption}
                              </Typography>
                            </Box>
                          )}


                          <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={1}
                              sx={{ px: 1.2, py: 0.7 }}
                            >
                              <Stack direction="row" spacing={0.5}>
                                {attachmentUrl && (
                                  <>
                                    <Button
                                      size="small"
                                      component="a"
                                      href={attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      sx={{
                                        textTransform: "none",
                                        color: "#25D366",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        minWidth: "auto",
                                      }}
                                    >
                                      Open
                                    </Button>
                                    <Button
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveAttachment(attachment);
                                      }}
                                      sx={{
                                        textTransform: "none",
                                        color: "#25D366",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        minWidth: "auto",
                                      }}
                                    >
                                      Save as...
                                    </Button>
                                  </>
                                )}
                              </Stack>
                              <Stack direction="row" alignItems="center" spacing={0.4}>
                                <Typography fontSize={10} color="rgba(255,255,255,0.65)">
                                  {message.time}
                                </Typography>
                                {message.senderId === "me" && (
                                  <DoneAllIcon
                                    sx={{
                                      fontSize: 14,
                                      color: message.read ? "#4caf50" : "rgba(255,255,255,0.6)",
                                    }}
                                  />
                                )}
                              </Stack>
                            </Stack>
                          </Box>
                        </Box>
                      );
                    })()
                  ) : (
                    // Regular Message
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor:
                          message.senderId === "me" ? "#667eea" : "white",
                        color:
                          message.senderId === "me" ? "white" : "text.primary",
                        boxShadow:
                          message.senderId === "me"
                            ? "0 2px 8px rgba(102, 126, 234, 0.3)"
                            : "0 1px 3px rgba(0,0,0,0.1)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Reply Quote Inside Bubble */}
                      {message.replyTo?.text && (
                        <Box
                          onClick={() => {
                            if (!message.replyTo?.messageId) return;
                            const el = document.getElementById(`msg-${message.replyTo.messageId}`);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "center" });
                              el.style.transition = "background-color 0.3s ease";
                              el.style.backgroundColor = message.senderId === "me"
                                ? "rgba(102, 126, 234, 0.15)"
                                : "rgba(102, 126, 234, 0.1)";
                              setTimeout(() => { el.style.backgroundColor = ""; }, 1500);
                            }
                          }}
                          sx={{
                            mb: 1,
                            px: 1.2,
                            py: 0.6,
                            borderRadius: 1,
                            borderLeft: "3px solid",
                            borderColor: message.senderId === "me"
                              ? "rgba(255,255,255,0.5)"
                              : "#667eea",
                            bgcolor: message.senderId === "me"
                              ? "rgba(255,255,255,0.15)"
                              : alpha("#667eea", 0.08),
                            cursor: message.replyTo?.messageId ? "pointer" : "default",
                            transition: "background-color 0.2s ease",
                            "&:hover": {
                              bgcolor: message.senderId === "me"
                                ? "rgba(255,255,255,0.22)"
                                : alpha("#667eea", 0.14),
                            },
                          }}
                        >
                          <Typography
                            fontSize={11}
                            fontWeight={600}
                            color={message.senderId === "me" ? "rgba(255,255,255,0.85)" : "#667eea"}
                          >
                            {message.replyTo.senderId === "me" ? "You" : selectedConversation?.user?.name || "User"}
                          </Typography>
                          <Typography
                            fontSize={12}
                            noWrap
                            color={message.senderId === "me" ? "rgba(255,255,255,0.6)" : "text.secondary"}
                          >
                            {message.replyTo.text || "Attachment"}
                          </Typography>
                        </Box>
                      )}
                      <Box
                        sx={{
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          whiteSpace: "pre-wrap",
                          minWidth: 0,
                        }}
                      >
                        <Typography fontSize={14}>
                          {message.text}
                        </Typography>
                      </Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="flex-end"
                        spacing={0.5}
                        mt={0.5}
                      >
                        <Typography
                          fontSize={10}
                          color={
                            message.senderId === "me"
                              ? "rgba(255,255,255,0.7)"
                              : "text.disabled"
                          }
                        >
                          {message.time}
                        </Typography>
                        {message.senderId === "me" && (
                          <DoneAllIcon
                            sx={{
                              fontSize: 14,
                              color: message.read
                                ? "#4caf50"
                                : "rgba(255,255,255,0.5)",
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  )}
                  </Box>
                  {/* Reply Button for received messages */}
                  {message.senderId !== "me" && (
                    <IconButton
                      className="reply-btn"
                      size="small"
                      onClick={() => setReplyTo(message)}
                      sx={{
                        opacity: 0,
                        transition: "opacity 0.2s ease",
                        alignSelf: "center",
                        ml: 0.5,
                        color: alpha("#667eea", 0.6),
                        "&:hover": { color: "#667eea", bgcolor: alpha("#667eea", 0.08) },
                      }}
                    >
                      <ReplyIcon sx={{ fontSize: 18, transform: "scaleX(-1)" }} />
                    </IconButton>
                  )}
                </Box>
              ))
            )}
            <Box ref={messageEndRef} sx={{ height: 1 }} />
          </Box>

          {/* Message Input */}
          <Box sx={{ px: 1.5, py: 1, bgcolor: "white", borderTop: "1px solid #e0e0e0" }}>
            {/* Reply Preview Banner */}
            {replyTo && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1.5,
                  p: 1,
                  pl: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha("#667eea", 0.06),
                  borderLeft: "3px solid #667eea",
                }}
              >
                <ReplyIcon sx={{ fontSize: 18, color: "#667eea", mr: 1, transform: "scaleX(-1)" }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontSize={12} fontWeight={600} color="#667eea">
                    Replying to {replyTo.senderId === "me" ? "yourself" : selectedConversation?.user?.name || "User"}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary" noWrap>
                    {replyTo.text || (replyTo.attachment ? "Attachment" : replyTo.location ? "Location" : "Message")}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ color: "text.secondary" }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )}
            {/* Quick Actions */}
            <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
              {[
                "Yes, it's available.",
                "The price is fixed, but it's in excellent condition.",
                "Sure, when would you like to collect?",
              ].map((quickMsg) => (
                <Chip
                  key={quickMsg}
                  label={quickMsg}
                  size="small"
                  onClick={() => setMessageInput(quickMsg)}
                  sx={{
                    fontSize: 10,
                    fontWeight: 500,
                    bgcolor: alpha("#667eea", 0.08),
                    color: "#667eea",
                    border: "1px solid",
                    borderColor: alpha("#667eea", 0.2),
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: alpha("#667eea", 0.15),
                      borderColor: "#667eea",
                    },
                  }}
                />
              ))}
            </Stack>

            {/* Input Area */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 1,
                bgcolor: alpha("#667eea", 0.04),
                borderRadius: 3,
                p: 1,
                border: "1px solid",
                borderColor: alpha("#667eea", 0.1),
                transition: "all 0.2s ease",
                "&:focus-within": {
                  borderColor: alpha("#667eea", 0.3),
                  bgcolor: alpha("#667eea", 0.06),
                  boxShadow: `0 0 0 3px ${alpha("#667eea", 0.1)}`,
                },
              }}
            >
              {/* Attachment Icons */}
              <IconButton
                size="small"
                onClick={(e) => setAttachmentMenuAnchor(e.currentTarget)}
                sx={{
                  color: "white",
                  background: gradientPrimary,
                  width: 36,
                  height: 36,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: gradientPrimary,
                    transform: "scale(1.05) rotate(90deg)",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                  },
                }}
              >
                <AddIcon sx={{ fontSize: 20 }} />
              </IconButton>

              {/* Attachment Menu */}
              <Menu
                anchorEl={attachmentMenuAnchor}
                open={Boolean(attachmentMenuAnchor)}
                onClose={() => setAttachmentMenuAnchor(null)}
                anchorOrigin={{ vertical: "top", horizontal: "left" }}
                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    minWidth: 200,
                    p: 1,
                  },
                }}
              >
                {attachmentOptions.map((option) => (
                  <MenuItem
                    key={option.id}
                    onClick={() => handleAttachmentAction(option.id)}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 2,
                      mb: 0.5,
                      mr: 2,
                      transition: "all 0.2s ease",
                      "&:hover": { bgcolor: alpha(option.color, 0.1) },
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          bgcolor: alpha(option.color, 0.15),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <option.icon
                          sx={{ fontSize: 20, color: option.color }}
                        />
                      </Box>
                    </ListItemIcon>
                    <Typography fontSize={14} fontWeight={500} sx={{ ml: 1 }}>
                      {option.label}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>

              {/* Text Input */}
              <TextField
                fullWidth
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                size="small"
                multiline
                maxRows={4}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& .MuiInputBase-root": { fontSize: 14, px: 1 },
                  "& .MuiInputBase-input": { py: 1 },
                }}
              />

              {/* Send Button */}
              <IconButton
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                sx={{
                  width: 38,
                  height: 38,
                  background: messageInput.trim()
                    ? gradientPrimary
                    : alpha("#667eea", 0.1),
                  color: messageInput.trim() ? "white" : alpha("#667eea", 0.4),
                  borderRadius: 2.5,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: messageInput.trim()
                      ? gradientPrimary
                      : alpha("#667eea", 0.15),
                    transform: messageInput.trim() ? "scale(1.05)" : "none",
                    boxShadow: messageInput.trim()
                      ? "0 4px 15px rgba(102, 126, 234, 0.4)"
                      : "none",
                  },
                  "&:disabled": {
                    background: alpha("#667eea", 0.1),
                    color: alpha("#667eea", 0.4),
                  },
                }}
              >
                <SendIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        </>
      ) : (
        // No conversation selected state (desktop only)
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              bgcolor: alpha("#667eea", 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <SendIcon sx={{ fontSize: 40, color: "#667eea" }} />
          </Box>
          <Typography variant="h6" fontWeight={600} mb={1}>
            Your Messages
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Select a conversation to start chatting
          </Typography>
        </Box>
      )}
    </Paper>
  );

  return (
    <Box
      sx={{
        bgcolor: "#fafafa",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        m: { xs: -2, md: -3 },
        p: { xs: 1, md: 2 },
        width: { xs: "calc(100% + 32px)", md: "calc(100% + 48px)" },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          flex: 1,
          overflow: "hidden",
          px: isMobile ? 0 : undefined,
        }}
      >
        {isMobile ? (
          selectedConversation ? (
            renderChatView()
          ) : (
            renderConversationList()
          )
        ) : (
          <Box sx={{ display: "flex", gap: 2, height: "100%" }}>
            <Box sx={{ width: 380, flexShrink: 0 }}>
              {renderConversationList()}
            </Box>
            <Box sx={{ flex: 1 }}>{renderChatView()}</Box>
          </Box>
        )}
      </Container>

      {/* Location Dialog */}
      <Dialog
        open={locationDialogOpen}
        onClose={() => {
          setLocationDialogOpen(false);
          setUserLocation(null);
          setLocationError(null);
          setLocationSearch("");
          setLocationSearchResults([]);
          setSelectedLocationName("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocationOnIcon sx={{ color: "#4caf50" }} />
            <Typography fontWeight={600}>Share Location</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {/* Location Search */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search for a location..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLocationSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#9e9e9e", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: locationSearch && (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={handleLocationSearch}
                      disabled={locationSearching}
                      sx={{
                        minWidth: "auto",
                        px: 1.5,
                        borderRadius: 2,
                        bgcolor: "#4caf50",
                        color: "white",
                        "&:hover": { bgcolor: "#43a047" },
                      }}
                    >
                      {locationSearching ? "..." : "Search"}
                    </Button>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  bgcolor: alpha("#4caf50", 0.05),
                  "& fieldset": { borderColor: alpha("#4caf50", 0.2) },
                  "&:hover fieldset": { borderColor: "#4caf50" },
                  "&.Mui-focused fieldset": { borderColor: "#4caf50" },
                },
              }}
            />
          </Box>

          {/* Search Results */}
          {locationSearchResults.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography fontSize={12} color="text.secondary" mb={1}>
                Search Results
              </Typography>
              <List sx={{
                  maxHeight: 200,
                  overflow: "auto",
                  p: 0,
                  "&::-webkit-scrollbar": { width: 5 },
                  "&::-webkit-scrollbar-track": {
                    bgcolor: alpha("#667eea", 0.05),
                    borderRadius: 3,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: alpha("#667eea", 0.25),
                    borderRadius: 3,
                    "&:hover": { bgcolor: alpha("#667eea", 0.4) },
                  },
                  scrollbarWidth: "thin",
                  scrollbarColor: `${alpha("#667eea", 0.25)} ${alpha("#667eea", 0.05)}`,
                }}>
                {locationSearchResults.map((location, index) => (
                  <ListItem
                    key={index}
                    button
                    onClick={() => handleSelectSearchedLocation(location)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      border: "1px solid #e0e0e0",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: alpha("#4caf50", 0.1),
                        borderColor: "#4caf50",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <LocationOnIcon sx={{ color: "#4caf50" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={location.name.split(",")[0]}
                      secondary={location.name.split(",").slice(1, 3).join(",")}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                      secondaryTypographyProps={{ fontSize: 12 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Divider with OR */}
          {!userLocation && !locationLoading && !locationError && (
            <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
              <Box sx={{ flex: 1, height: "1px", bgcolor: "#e0e0e0" }} />
              <Typography sx={{ px: 2, color: "text.secondary", fontSize: 12 }}>
                OR
              </Typography>
              <Box sx={{ flex: 1, height: "1px", bgcolor: "#e0e0e0" }} />
            </Box>
          )}

          {/* Current Location Button */}
          {!userLocation && !locationLoading && !locationError && (
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGetLocation}
              startIcon={<LocationOnIcon />}
              sx={{
                borderRadius: 2,
                borderColor: "#4caf50",
                color: "#4caf50",
                py: 1.5,
                mb: 2,
                "&:hover": {
                  borderColor: "#43a047",
                  bgcolor: alpha("#4caf50", 0.05),
                },
              }}
            >
              Use Current Location
            </Button>
          )}

          {locationLoading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  border: "3px solid #e0e0e0",
                  borderTopColor: "#4caf50",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  mx: "auto",
                  mb: 2,
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Typography color="text.secondary">
                Getting your location...
              </Typography>
            </Box>
          ) : locationError ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: alpha("#f44336", 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <LocationOnIcon sx={{ fontSize: 32, color: "#f44336" }} />
              </Box>
              <Typography fontWeight={500} mb={1}>
                Location Access Required
              </Typography>
              <Typography fontSize={14} color="text.secondary" mb={3}>
                {locationError}
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setLocationError(null);
                    handleGetLocation();
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#4caf50",
                    "&:hover": { bgcolor: "#43a047" },
                  }}
                >
                  Try Again
                </Button>
                <Typography fontSize={12} color="text.secondary">
                  Make sure location is enabled in your browser settings
                </Typography>
              </Stack>
            </Box>
          ) : userLocation ? (
            <Box>
              <Box
                sx={{
                  width: "100%",
                  height: 200,
                  borderRadius: 2,
                  overflow: "hidden",
                  mb: 2,
                  bgcolor: "#e8f5e9",
                }}
              >
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${userLocation.lat},${userLocation.lng}&zoom=15&size=600x200&markers=color:green%7C${userLocation.lat},${userLocation.lng}&key=YOUR_API_KEY`}
                  alt="Location preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <Box
                  sx={{
                    display: "none",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    bgcolor: alpha("#4caf50", 0.1),
                  }}
                >
                  <Stack alignItems="center" spacing={1}>
                    <LocationOnIcon sx={{ fontSize: 48, color: "#4caf50" }} />
                    <Typography fontSize={14} color="text.secondary">
                      Location ready to share
                    </Typography>
                  </Stack>
                </Box>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: alpha("#4caf50", 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LocationOnIcon sx={{ color: "#4caf50" }} />
                </Box>
                <Box>
                  <Typography fontSize={14} fontWeight={500}>
                    Current Location
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ) : (
            <Typography color="text.secondary">
              Unable to get location
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => {
              setLocationDialogOpen(false);
              setUserLocation(null);
              setLocationError(null);
              setLocationSearch("");
              setLocationSearchResults([]);
              setSelectedLocationName("");
            }}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!userLocation || locationLoading}
            onClick={handleSendLocation}
            startIcon={<SendIcon />}
            sx={{
              borderRadius: 2,
              bgcolor: "#4caf50",
              "&:hover": { bgcolor: "#43a047" },
            }}
          >
            Send Location
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={selectedConversation?.user.avatar}
              sx={{ width: 56, height: 56 }}
            />
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography fontWeight={600} fontSize={18}>
                  {selectedConversation?.user.name}
                </Typography>
                {selectedConversation?.user.verified && (
                  <VerifiedIcon sx={{ fontSize: 18, color: "#667eea" }} />
                )}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <StarIcon sx={{ fontSize: 16, color: "#ffc107" }} />
                <Typography fontSize={14} color="text.secondary">
                  {selectedConversation?.user.rating} (
                  {selectedConversation?.user.reviews} reviews)
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Box>
              <Typography fontSize={12} color="text.secondary" mb={0.5}>
                Status
              </Typography>
              <Chip
                size="small"
                label={selectedConversation?.user.online ? "Online" : "Offline"}
                sx={{
                  bgcolor: selectedConversation?.user.online
                    ? alpha("#4caf50", 0.1)
                    : alpha("#9e9e9e", 0.1),
                  color: selectedConversation?.user.online
                    ? "#4caf50"
                    : "#9e9e9e",
                }}
              />
            </Box>
            <Box>
              <Typography fontSize={12} color="text.secondary" mb={0.5}>
                Current Listing
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 1.5,
                    overflow: "hidden",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <img
                    src={selectedConversation?.listing.image}
                    alt={selectedConversation?.listing.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
                <Box>
                  <Typography fontSize={14} fontWeight={500}>
                    {selectedConversation?.listing.title}
                  </Typography>
                  <Typography fontSize={14} fontWeight={600} color="#667eea">
                    {selectedConversation?.listing.price}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setProfileDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            sx={{
              borderRadius: 2,
              background: gradientPrimary,
              "&:hover": { background: gradientPrimary, opacity: 0.9 },
            }}
          >
            View Full Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ReportIcon sx={{ color: "#ff9800" }} />
            <Typography fontWeight={600}>Report User</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Why are you reporting {selectedConversation?.user.name}?
          </DialogContentText>
          <RadioGroup
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            <FormControlLabel
              value="spam"
              control={<Radio sx={{ "&.Mui-checked": { color: "#667eea" } }} />}
              label="Spam or misleading"
            />
            <FormControlLabel
              value="scam"
              control={<Radio sx={{ "&.Mui-checked": { color: "#667eea" } }} />}
              label="Suspected scam or fraud"
            />
            <FormControlLabel
              value="harassment"
              control={<Radio sx={{ "&.Mui-checked": { color: "#667eea" } }} />}
              label="Harassment or hate speech"
            />
            <FormControlLabel
              value="inappropriate"
              control={<Radio sx={{ "&.Mui-checked": { color: "#667eea" } }} />}
              label="Inappropriate content"
            />
            <FormControlLabel
              value="fake"
              control={<Radio sx={{ "&.Mui-checked": { color: "#667eea" } }} />}
              label="Fake profile or listing"
            />
            <FormControlLabel
              value="other"
              control={<Radio sx={{ "&.Mui-checked": { color: "#667eea" } }} />}
              label="Other"
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => {
              setReportDialogOpen(false);
              setReportReason("");
            }}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!reportReason}
            onClick={handleSubmitReport}
            sx={{
              borderRadius: 2,
              bgcolor: "#ff9800",
              "&:hover": { bgcolor: "#f57c00" },
            }}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block User Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BlockIcon sx={{ color: "#f44336" }} />
            <Typography fontWeight={600}>Block User</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to block {selectedConversation?.user.name}?
            They won't be able to message you or see your listings.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setBlockDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBlockUser}
            sx={{
              borderRadius: 2,
              bgcolor: "#f44336",
              "&:hover": { bgcolor: "#d32f2f" },
            }}
          >
            Block User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Chat Dialog */}
      <Dialog
        open={clearChatDialogOpen}
        onClose={() => setClearChatDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DeleteSweepIcon sx={{ color: "#9e9e9e" }} />
            <Typography fontWeight={600}>Clear Chat</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all messages in this chat? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setClearChatDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleClearChat}
            sx={{
              borderRadius: 2,
              bgcolor: "#9e9e9e",
              "&:hover": { bgcolor: "#757575" },
            }}
          >
            Clear Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog
        open={deleteChatDialogOpen}
        onClose={() => setDeleteChatDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DeleteIcon sx={{ color: "#f44336" }} />
            <Typography fontWeight={600}>Delete Chat</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this entire conversation? This will
            remove the chat from your messages and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setDeleteChatDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteChat}
            sx={{
              borderRadius: 2,
              bgcolor: "#f44336",
              "&:hover": { bgcolor: "#d32f2f" },
            }}
          >
            Delete Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => handleFileSelected(e, "Photo")}
      />
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*,video/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFileSelected(e, "Media")}
      />
      <input
        type="file"
        ref={documentInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        style={{ display: "none" }}
        onChange={(e) => handleFileSelected(e, "Document")}
      />

      <Dialog
        open={attachmentComposeOpen}
        onClose={resetAttachmentComposer}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={600}>Add caption</Typography>
          <Typography fontSize={12} color="text.secondary" mt={0.5}>
            {pendingAttachment?.file?.name || "Attachment"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {pendingAttachmentPreviewUrl && (
            (() => {
              const fileType = String(pendingAttachment?.file?.type || "").toLowerCase();
              const ext =
                String(pendingAttachment?.file?.name || "")
                  .split(".")
                  .pop()
                  ?.toLowerCase() || "";
              const isPendingImage =
                fileType.startsWith("image/") ||
                ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"].includes(
                  ext,
                );
              const isPendingVideo =
                fileType.startsWith("video/") ||
                ["mp4", "mov", "avi", "mkv", "webm", "m4v", "3gp"].includes(ext);

              return (
            <Box
              sx={{
                mb: 2,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#f5f5f5",
                border: "1px solid #e0e0e0",
              }}
            >
              {isPendingImage ? (
                <Box
                  component="img"
                  src={pendingAttachmentPreviewUrl}
                  alt={pendingAttachment?.file?.name || "Attachment preview"}
                  sx={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
                />
              ) : isPendingVideo ? (
                <Box
                  component="video"
                  src={pendingAttachmentPreviewUrl}
                  controls
                  muted
                  sx={{ width: "100%", maxHeight: 220, display: "block", bgcolor: "black" }}
                />
              ) : (
                <Box
                  sx={{
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                  }}
                >
                  <DescriptionIcon sx={{ mr: 1 }} />
                  <Typography fontSize={13}>Document selected</Typography>
                </Box>
              )}
            </Box>
              );
            })()
          )}
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            autoFocus
            placeholder="Write a caption..."
            value={attachmentCaption}
            onChange={(e) => setAttachmentCaption(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={resetAttachmentComposer} sx={{ borderRadius: 2 }}>
            Discard
          </Button>
          <Button
            variant="contained"
            onClick={handleSendPendingAttachment}
            sx={{
              borderRadius: 2,
              background: gradientPrimary,
              "&:hover": { background: gradientPrimary, opacity: 0.9 },
            }}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map View Dialog */}
      <Dialog
        open={mapViewOpen}
        onClose={() => {
          setMapViewOpen(false);
          setViewingLocation(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha("#4caf50", 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocationOnIcon sx={{ color: "#4caf50" }} />
              </Box>
              <Box>
                <Typography fontWeight={600} fontSize={16}>
                  {viewingLocation?.name || "Location"}
                </Typography>
                {viewingLocation && (
                  <Typography fontSize={12} color="text.secondary">
                    {viewingLocation.lat.toFixed(6)},{" "}
                    {viewingLocation.lng.toFixed(6)}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton
              onClick={() => {
                setMapViewOpen(false);
                setViewingLocation(null);
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {viewingLocation && (
            <Box sx={{ width: "100%", height: 400, position: "relative" }}>
              <iframe
                title="Full Map View"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${viewingLocation.lng - 0.02},${viewingLocation.lat - 0.02},${viewingLocation.lng + 0.02},${viewingLocation.lat + 0.02}&layer=mapnik&marker=${viewingLocation.lat},${viewingLocation.lng}`}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                if (viewingLocation) {
                  navigator.clipboard.writeText(
                    `${viewingLocation.lat}, ${viewingLocation.lng}`,
                  );
                  showSnackbar("Coordinates copied to clipboard");
                }
              }}
              sx={{
                borderRadius: 2,
                borderColor: "#e0e0e0",
                color: "text.secondary",
                "&:hover": {
                  borderColor: "#4caf50",
                  bgcolor: alpha("#4caf50", 0.05),
                },
              }}
            >
              Copy Coordinates
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => {
                if (viewingLocation) {
                  window.open(
                    `https://www.google.com/maps?q=${viewingLocation.lat},${viewingLocation.lng}`,
                    "_blank",
                  );
                }
              }}
              sx={{
                borderRadius: 2,
                borderColor: "#4caf50",
                color: "#4caf50",
                "&:hover": {
                  borderColor: "#43a047",
                  bgcolor: alpha("#4caf50", 0.05),
                },
              }}
            >
              Open in Google Maps
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (viewingLocation) {
                  window.open(
                    `https://www.openstreetmap.org/?mlat=${viewingLocation.lat}&mlon=${viewingLocation.lng}#map=17/${viewingLocation.lat}/${viewingLocation.lng}`,
                    "_blank",
                  );
                }
              }}
              sx={{
                borderRadius: 2,
                bgcolor: "#4caf50",
                "&:hover": { bgcolor: "#43a047" },
              }}
            >
              Open in OpenStreetMap
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
