/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
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
  Alert
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
import { gradientPrimary } from "../theme/theme";

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
      reviews: 127
    },
    lastMessage: "Is this still available?",
    time: "2 min ago",
    unread: 2,
    listing: {
      title: "iPhone 13 Pro Max",
      price: "R 12,999",
      image:
        "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=100"
    }
  },
  {
    id: 2,
    user: {
      name: "Sarah Williams",
      avatar: "https://i.pravatar.cc/150?img=5",
      verified: true,
      online: false,
      rating: 4.9,
      reviews: 89
    },
    lastMessage: "Thank you for your interest! Yes, it's available.",
    time: "1 hour ago",
    unread: 0,
    listing: {
      title: "MacBook Pro M2",
      price: "R 28,999",
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100"
    }
  },
  {
    id: 3,
    user: {
      name: "Mike Johnson",
      avatar: "https://i.pravatar.cc/150?img=8",
      verified: false,
      online: true,
      rating: 4.2,
      reviews: 34
    },
    lastMessage: "Can you do R10,000?",
    time: "3 hours ago",
    unread: 1,
    listing: {
      title: "Samsung Galaxy S23",
      price: "R 11,999",
      image:
        "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=100"
    }
  },
  {
    id: 4,
    user: {
      name: "Emma Davis",
      avatar: "https://i.pravatar.cc/150?img=9",
      verified: true,
      online: false,
      rating: 5.0,
      reviews: 156
    },
    lastMessage: "Great, I'll take it. When can we meet?",
    time: "Yesterday",
    unread: 0,
    listing: {
      title: "Sony WH-1000XM5",
      price: "R 6,999",
      image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100"
    }
  },
  {
    id: 5,
    user: {
      name: "David Brown",
      avatar: "https://i.pravatar.cc/150?img=11",
      verified: false,
      online: false,
      rating: 3.8,
      reviews: 12
    },
    lastMessage: "Is the price negotiable?",
    time: "2 days ago",
    unread: 0,
    listing: {
      title: "Gaming Laptop RTX 4060",
      price: "R 22,500",
      image:
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100"
    }
  }
];

// Dummy messages for selected conversation
const dummyMessages = [
  {
    id: 1,
    senderId: "other",
    text: "Hi! I saw your listing for the iPhone 13 Pro Max. Is it still available?",
    time: "10:30 AM",
    read: true
  },
  {
    id: 2,
    senderId: "me",
    text: "Yes, it's still available! Are you interested?",
    time: "10:32 AM",
    read: true
  },
  {
    id: 3,
    senderId: "other",
    text: "Yes! What's the condition like? Any scratches or damage?",
    time: "10:35 AM",
    read: true
  },
  {
    id: 4,
    senderId: "me",
    text: "It's in excellent condition. No scratches on the screen, and the body is pristine. Battery health is at 95%.",
    time: "10:38 AM",
    read: true
  },
  {
    id: 5,
    senderId: "other",
    text: "That sounds great! Does it come with original accessories?",
    time: "10:40 AM",
    read: true
  },
  {
    id: 6,
    senderId: "me",
    text: "Yes, it comes with the original box, charger, cable, and earphones. Everything is included.",
    time: "10:42 AM",
    read: true
  },
  {
    id: 7,
    senderId: "other",
    text: "Is this still available?",
    time: "2 min ago",
    read: false
  }
];

export default function Messages() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(dummyMessages);
  const [activeFilter, setActiveFilter] = useState("all");
  const [attachmentMenuAnchor, setAttachmentMenuAnchor] = useState(null);
  const [chatMenuAnchor, setChatMenuAnchor] = useState(null);
  const [conversationsList, setConversationsList] = useState(conversations);
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

  // File input refs
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const chatMenuOptions = [
    { id: "profile", label: "Profile", icon: PersonIcon, color: "#667eea" },
    { id: "close", label: "Close Chat", icon: CloseIcon, color: "#757575" },
    {
      id: "archive",
      label: "Archive Chat",
      icon: ArchiveIcon,
      color: "#607d8b"
    },
    { id: "report", label: "Report", icon: ReportIcon, color: "#ff9800" },
    { id: "block", label: "Block", icon: BlockIcon, color: "#f44336" },
    {
      id: "clear",
      label: "Clear Chat",
      icon: DeleteSweepIcon,
      color: "#9e9e9e",
      divider: true
    },
    { id: "delete", label: "Delete Chat", icon: DeleteIcon, color: "#f44336" }
  ];

  const attachmentOptions = [
    { id: "camera", label: "Camera", icon: CameraAltIcon, color: "#e91e63" },
    {
      id: "photos",
      label: "Photos & Videos",
      icon: ImageIcon,
      color: "#9c27b0"
    },
    {
      id: "documents",
      label: "Documents",
      icon: DescriptionIcon,
      color: "#3f51b5"
    },
    {
      id: "location",
      label: "Location",
      icon: LocationOnIcon,
      color: "#4caf50"
    },
    { id: "contact", label: "Contact", icon: ContactsIcon, color: "#00bcd4" }
  ];

  const filterTags = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "buying", label: "Buying" },
    { id: "selling", label: "Selling" },
    { id: "archived", label: "Archived" }
  ];

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage = {
        id: messages.length + 1,
        senderId: "me",
        text: messageInput,
        time: "Just now",
        read: false
      };
      setMessages([...messages, newMessage]);
      setMessageInput("");
    }
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
        conversationsList.filter((c) => c.id !== selectedConversation.id)
      );
      setSelectedConversation(null);
      showSnackbar("Chat archived successfully");
    }
  };

  const handleBlockUser = () => {
    if (selectedConversation) {
      setBlockedUsers([...blockedUsers, selectedConversation.user.name]);
      setConversationsList(
        conversationsList.filter((c) => c.id !== selectedConversation.id)
      );
      setSelectedConversation(null);
      setBlockDialogOpen(false);
      showSnackbar(
        `${selectedConversation.user.name} has been blocked`,
        "warning"
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
        conversationsList.filter((c) => c.id !== selectedConversation.id)
      );
      setSelectedConversation(null);
      setDeleteChatDialogOpen(false);
      showSnackbar("Chat deleted successfully");
    }
  };

  const handleSubmitReport = () => {
    if (reportReason) {
      // Here you would send the report to your backend
      console.log("Report submitted:", {
        user: selectedConversation?.user.name,
        reason: reportReason
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

  const handleFileSelected = (event, type) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Create a message with the file
      const newMessage = {
        id: messages.length + 1,
        senderId: "me",
        text: `📎 ${type}: ${file.name}`,
        time: "Just now",
        read: false,
        attachment: {
          type: type,
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file)
        }
      };
      setMessages([...messages, newMessage]);
      showSnackbar(`${type} attached successfully`);
    }
    // Reset input
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
            lng: position.coords.longitude
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationLoading(false);
      setLocationError("Geolocation is not supported by your browser.");
    }
  };

  const handleSendLocation = () => {
    if (userLocation) {
      const newMessage = {
        id: messages.length + 1,
        senderId: "me",
        text: selectedLocationName
          ? `📍 ${selectedLocationName}`
          : `📍 Location shared`,
        time: "Just now",
        read: false,
        location: userLocation
      };
      setMessages([...messages, newMessage]);
      setLocationDialogOpen(false);
      setUserLocation(null);
      setLocationSearch("");
      setLocationSearchResults([]);
      setSelectedLocationName("");
      showSnackbar("Location sent successfully");
    }
  };

  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return;

    setLocationSearching(true);
    setLocationError(null);

    try {
      // Using OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=5`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setLocationSearchResults(
          data.map((item) => ({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type
          }))
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
      id: messages.length + 1,
      senderId: "me",
      text: `👤 Contact: ${contact.name}`,
      time: "Just now",
      read: false,
      contact
    };
    setMessages([...messages, newMessage]);
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
        matchesFilter = conv.id % 2 === 1;
        break;
      case "selling":
        matchesFilter = conv.id % 2 === 0;
        break;
      case "archived":
        matchesFilter = archivedChats.includes(conv.id);
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

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
        flexDirection: "column"
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
            )
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: alpha("#667eea", 0.05)
            }
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
            scrollbarWidth: "none"
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
                    activeFilter === tag.id ? "#667eea" : alpha("#667eea", 0.15)
                }
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Conversation List */}
      <List sx={{ flex: 1, overflow: "auto", p: 0 }}>
        {filteredConversations.map((conversation) => (
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
              px: 2
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
                  position: "relative"
                }}
              >
                <img
                  src={conversation.listing.image}
                  alt={conversation.listing.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                          border: "1.5px solid white"
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
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
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
                        maxWidth: 180
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
                <Typography
                  component="span"
                  fontSize={12}
                  color="text.secondary"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 180,
                    display: "block",
                    fontWeight: conversation.unread > 0 ? 600 : 400
                  }}
                >
                  {conversation.lastMessage}
                </Typography>
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
                    justifyContent: "center"
                  }}
                >
                  <Typography fontSize={11} fontWeight={700} color="white">
                    {conversation.unread}
                  </Typography>
                </Box>
              )}
            </Stack>
          </ListItem>
        ))}
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
        flexDirection: "column"
      }}
    >
      {selectedConversation ? (
        <>
          {/* Chat Header - Product focused */}
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              gap: 2
            }}
          >
            {isMobile && (
              <IconButton onClick={handleBackToList} sx={{ p: 0 }}>
                <ArrowBackIcon />
              </IconButton>
            )}
            {/* Product Image */}
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 1.5,
                overflow: "hidden",
                border: "1px solid #e0e0e0",
                flexShrink: 0
              }}
            >
              <img
                src={selectedConversation.listing.image}
                alt={selectedConversation.listing.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Stack flex={1} spacing={0.25}>
              {/* Product Title */}
              <Typography fontWeight={600} fontSize={15}>
                {selectedConversation.listing.title}
              </Typography>
              {/* Price */}
              <Typography fontSize={14} fontWeight={600} color="#667eea">
                {selectedConversation.listing.price}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                sx={{
                  color: "#667eea",
                  bgcolor: alpha("#667eea", 0.1),
                  width: 38,
                  height: 38,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: alpha("#667eea", 0.2),
                    transform: "scale(1.05)"
                  }
                }}
              >
                <SearchIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                sx={{
                  color: "#667eea",
                  bgcolor: alpha("#667eea", 0.1),
                  width: 38,
                  height: 38,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: alpha("#667eea", 0.2),
                    transform: "scale(1.05)"
                  }
                }}
              >
                <PhoneIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                sx={{
                  color: "#667eea",
                  bgcolor: alpha("#667eea", 0.1),
                  width: 38,
                  height: 38,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: alpha("#667eea", 0.2),
                    transform: "scale(1.05)"
                  }
                }}
              >
                <VideocamIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton
                onClick={(e) => setChatMenuAnchor(e.currentTarget)}
                sx={{
                  color: "#666",
                  width: 38,
                  height: 38,
                  transition: "all 0.2s ease",
                  "&:hover": { bgcolor: alpha("#000", 0.05) }
                }}
              >
                <MoreVertIcon sx={{ fontSize: 20 }} />
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
                    p: 1
                  }
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
                        "&:hover": { bgcolor: alpha(option.color, 0.1) }
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
                              : "inherit"
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

          {/* Seller/Buyer Info Bar */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: alpha("#667eea", 0.05),
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              gap: 1.5
            }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                selectedConversation.user.online ? (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#4caf50",
                      border: "2px solid white"
                    }}
                  />
                ) : null
              }
            >
              <Avatar
                src={selectedConversation.user.avatar}
                sx={{ width: 36, height: 36 }}
              />
            </Badge>
            <Stack flex={1}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography fontWeight={500} fontSize={13}>
                  {selectedConversation.user.name}
                </Typography>
                {selectedConversation.user.verified && (
                  <VerifiedIcon sx={{ fontSize: 14, color: "#667eea" }} />
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                    bgcolor: alpha("#ffc107", 0.15),
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    ml: 0.5
                  }}
                >
                  <StarIcon sx={{ fontSize: 14, color: "#ffc107" }} />
                  <Typography
                    fontSize={12}
                    fontWeight={600}
                    color="text.primary"
                  >
                    {selectedConversation.user.rating}
                  </Typography>
                  <Typography fontSize={11} color="text.secondary">
                    ({selectedConversation.user.reviews})
                  </Typography>
                </Box>
              </Stack>
              <Typography fontSize={11} color="text.secondary">
                {selectedConversation.user.online
                  ? "Online"
                  : "Last seen recently"}
              </Typography>
            </Stack>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              bgcolor: "#fafafa"
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: "flex",
                  justifyContent:
                    message.senderId === "me" ? "flex-end" : "flex-start"
                }}
              >
                {message.location ? (
                  // Location Message with Map Preview
                  <Box
                    onClick={() => {
                      setViewingLocation({
                        ...message.location,
                        name: message.text.replace("📍 ", "")
                      });
                      setMapViewOpen(true);
                    }}
                    sx={{
                      maxWidth: "70%",
                      borderRadius: 2,
                      overflow: "hidden",
                      cursor: "pointer",
                      boxShadow:
                        message.senderId === "me"
                          ? "0 2px 8px rgba(102, 126, 234, 0.3)"
                          : "0 1px 3px rgba(0,0,0,0.1)",
                      transition: "transform 0.2s ease",
                      "&:hover": { transform: "scale(1.02)" }
                    }}
                  >
                    {/* Map Preview */}
                    <Box
                      sx={{
                        width: 250,
                        height: 150,
                        bgcolor: alpha("#4caf50", 0.1),
                        position: "relative",
                        overflow: "hidden"
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
                          gap: 0.5
                        }}
                      >
                        <LocationOnIcon sx={{ fontSize: 16, color: "white" }} />
                        <Typography fontSize={11} color="white">
                          Tap to view
                        </Typography>
                      </Box>
                    </Box>
                    {/* Location Info */}
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: message.senderId === "me" ? "#667eea" : "white"
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
                            justifyContent: "center"
                          }}
                        >
                          <LocationOnIcon
                            sx={{
                              fontSize: 18,
                              color:
                                message.senderId === "me" ? "white" : "#4caf50"
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
                                : "rgba(255,255,255,0.5)"
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Box>
                ) : (
                  // Regular Message
                  <Box
                    sx={{
                      maxWidth: "70%",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: message.senderId === "me" ? "#667eea" : "white",
                      color:
                        message.senderId === "me" ? "white" : "text.primary",
                      boxShadow:
                        message.senderId === "me"
                          ? "0 2px 8px rgba(102, 126, 234, 0.3)"
                          : "0 1px 3px rgba(0,0,0,0.1)"
                    }}
                  >
                    <Typography fontSize={14}>{message.text}</Typography>
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
                              : "rgba(255,255,255,0.5)"
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                )}
              </Box>
            ))}
          </Box>

          {/* Message Input */}
          <Box sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #e0e0e0" }}>
            {/* Quick Actions */}
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              {["Is this available?", "What's the lowest?", "Can we meet?"].map(
                (quickMsg) => (
                  <Chip
                    key={quickMsg}
                    label={quickMsg}
                    size="small"
                    onClick={() => setMessageInput(quickMsg)}
                    sx={{
                      fontSize: 11,
                      fontWeight: 500,
                      bgcolor: alpha("#667eea", 0.08),
                      color: "#667eea",
                      border: "1px solid",
                      borderColor: alpha("#667eea", 0.2),
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: alpha("#667eea", 0.15),
                        borderColor: "#667eea"
                      }
                    }}
                  />
                )
              )}
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
                  boxShadow: `0 0 0 3px ${alpha("#667eea", 0.1)}`
                }
              }}
            >
              {/* Attachment Icons */}
              <IconButton
                size="small"
                onClick={(e) => setAttachmentMenuAnchor(e.currentTarget)}
                sx={{
                  color: "white",
                  background: gradientPrimary,
                  width: 40,
                  height: 40,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: gradientPrimary,
                    transform: "scale(1.05) rotate(90deg)",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
                  }
                }}
              >
                <AddIcon sx={{ fontSize: 24 }} />
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
                    p: 1
                  }
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
                      "&:hover": { bgcolor: alpha(option.color, 0.1) }
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
                          justifyContent: "center"
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
                  "& .MuiInputBase-input": { py: 1 }
                }}
              />

              {/* Send Button */}
              <IconButton
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                sx={{
                  width: 44,
                  height: 44,
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
                      : "none"
                  },
                  "&:disabled": {
                    background: alpha("#667eea", 0.1),
                    color: alpha("#667eea", 0.4)
                  }
                }}
              >
                <SendIcon sx={{ fontSize: 22 }} />
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
            color: "text.secondary"
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
              mb: 2
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
      sx={{ bgcolor: "#fafafa", minHeight: "100vh", pt: 2, pb: 2 }}
      // mt={isMobile ? 10 : 12.5}
    >
      <Container
        maxWidth="xl"
        sx={{ height: "calc(100vh - 180px)", px: isMobile ? 0 : undefined }}
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
                    : "#9e9e9e"
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
                    border: "1px solid #e0e0e0"
                  }}
                >
                  <img
                    src={selectedConversation?.listing.image}
                    alt={selectedConversation?.listing.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
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
              "&:hover": { background: gradientPrimary, opacity: 0.9 }
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
              "&:hover": { bgcolor: "#f57c00" }
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
              "&:hover": { bgcolor: "#d32f2f" }
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
              "&:hover": { bgcolor: "#757575" }
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
              "&:hover": { bgcolor: "#d32f2f" }
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
                  justifyContent: "center"
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
                    `${viewingLocation.lat}, ${viewingLocation.lng}`
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
                  bgcolor: alpha("#4caf50", 0.05)
                }
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
                    "_blank"
                  );
                }
              }}
              sx={{
                borderRadius: 2,
                borderColor: "#4caf50",
                color: "#4caf50",
                "&:hover": {
                  borderColor: "#43a047",
                  bgcolor: alpha("#4caf50", 0.05)
                }
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
                    "_blank"
                  );
                }
              }}
              sx={{
                borderRadius: 2,
                bgcolor: "#4caf50",
                "&:hover": { bgcolor: "#43a047" }
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
