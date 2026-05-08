import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Avatar from "@mui/material/Avatar";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import EmailIcon from "@mui/icons-material/Email";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationService";
import { connectSocket, getSocket } from "../socket/socketClient";
import { useUnreadCounts } from "../context/UnreadCountsContext";

const formatTimeAgo = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  const now = new Date();
  const diff = Math.max(0, now - date);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
};

export default function Notifications() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const queryClient = useQueryClient();
  const {
    decrementUnreadNotifications,
    refetchUnreadNotifications,
    setNotificationsUnreadCount,
  } = useUnreadCounts();
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);

  const { data: notificationsResponse } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => getNotifications(),
    retry: false,
  });

  useEffect(() => {
    const items = notificationsResponse?.notifications || [];
    setNotifications(
      items.map((n) => ({
        ...n,
        id: n.notificationId || n.id,
        body: n.message,
        time: formatTimeAgo(n.createdAt),
        isRead: Boolean(n.isRead),
      })),
    );
  }, [notificationsResponse]);

  // Opening notifications should clear unread badge and mark all backend records as read.
  useEffect(() => {
    const unreadItems = notifications.filter((n) => !n.isRead);
    if (unreadItems.length === 0) {
      setNotificationsUnreadCount(0);
      return;
    }

    let cancelled = false;

    const syncReadState = async () => {
      try {
        setNotificationsUnreadCount(0);
        await markAllAsRead();
        if (cancelled) return;

        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      } catch {
        if (!cancelled) {
          refetchUnreadNotifications();
        }
      }
    };

    syncReadState();

    return () => {
      cancelled = true;
    };
  }, [
    notifications,
    queryClient,
    refetchUnreadNotifications,
    setNotificationsUnreadCount,
  ]);

  // Connect socket and listen for incoming notifications
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = ({ notification: incoming }) => {
      const normalized = {
        ...incoming,
        id: incoming.notificationId || incoming.id,
        body: incoming.message,
        time: "Just now",
        isRead: false,
      };
      setNotifications((prev) => [normalized, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (id) => markAsRead(id),
    onSuccess: (_, id) => {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      if (target && !target.isRead) {
        decrementUnreadNotifications(1);
      }
    },
    onError: (err) => {
      refetchUnreadNotifications();
      console.error("Failed to mark as read:", err);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: (_, id) => {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        decrementUnreadNotifications(1);
      }
    },
    onError: (err) => {
      refetchUnreadNotifications();
      console.error("Failed to delete notification:", err);
    },
  });

  const filtered = useMemo(
    () =>
      notifications.filter((n) =>
        filter === "all" ? true : n.type === filter,
      ),
    [notifications, filter],
  );

  const typeChip = (t) => {
    switch (t) {
      case "system":
        return (
          <Chip
            size="small"
            icon={<NotificationsActiveIcon />}
            label="System"
            color="info"
          />
        );
      case "message":
        return (
          <Chip
            size="small"
            icon={<EmailIcon />}
            label="Message"
            color="primary"
            variant="outlined"
          />
        );
      case "warning":
        return (
          <Chip
            size="small"
            icon={<WarningAmberIcon />}
            label="Warning"
            color="warning"
          />
        );
      case "promo":
        return (
          <Chip
            size="small"
            icon={<LocalOfferIcon />}
            label="Promo"
            color="success"
            variant="outlined"
          />
        );
      default:
        return <Chip size="small" label={t} />;
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 2 },
        py: { xs: 1.25, sm: 2 },
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2 },
          mb: 1.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.25}
        >
          <Stack spacing={0.35}>
            <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: 22, sm: 28 } }}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay on top of buyer activity, system updates, and promos.
            </Typography>
          </Stack>

          <Chip
            icon={<NotificationsActiveIcon />}
            label={`${filtered.length} visible`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5, overflowX: "auto", pb: 0.25 }}
        >
          {[
            { id: "all", label: "All", icon: <FilterListIcon fontSize="small" /> },
            { id: "system", label: "System" },
            { id: "message", label: "Messages" },
            { id: "warning", label: "Warnings" },
            { id: "promo", label: "Promos" },
          ].map((item) => (
            <Chip
              key={item.id}
              icon={item.icon}
              label={item.label}
              clickable
              onClick={() => setFilter(item.id)}
              color={filter === item.id ? "primary" : "default"}
              variant={filter === item.id ? "filled" : "outlined"}
              sx={{ fontWeight: 600, flexShrink: 0 }}
            />
          ))}
        </Stack>
      </Paper>

      <List sx={{ p: 0, m: 0, display: "grid", gap: 1.1 }}>
        {filtered.map((n) => (
          <Paper
            key={n.id}
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: n.isRead ? "divider" : alpha(theme.palette.primary.main, 0.3),
              bgcolor: n.isRead
                ? "background.paper"
                : alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <ListItem
              sx={{
                opacity: n.isRead ? 0.72 : 1,
                alignItems: "flex-start",
                gap: 1,
                px: { xs: 2, sm: 1.5 },
                py: { xs: 1.2, sm: 1.35 },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 1.2, mt: 0.2 }}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    fontSize: 14,
                    bgcolor: n.isRead ? "action.disabledBackground" : "primary.main",
                    color: n.isRead ? "text.secondary" : "primary.contrastText",
                  }}
                >
                  {n.title?.charAt(0) || "N"}
                </Avatar>
              </ListItemIcon>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 0.25, sm: 0.8 }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Typography fontWeight={700} fontSize={14.5} noWrap>
                    {n.title}
                  </Typography>
                  <Typography fontSize={11} color="text.secondary" sx={{ flexShrink: 0 }}>
                    {n.time}
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.45, lineHeight: 1.45 }}
                >
                  {n.body}
                </Typography>

                <Stack
                  direction="row"
                  spacing={0.8}
                  sx={{ mt: 1.1, flexWrap: "wrap", rowGap: 0.8 }}
                  alignItems="center"
                >
                  {typeChip(n.type)}
                  {!n.isRead && (
                    <Chip
                      size="small"
                      icon={<CheckIcon />}
                      label="Mark read"
                      color="success"
                      variant="outlined"
                      onClick={() => markAsReadMutation.mutate(n.id)}
                      disabled={markAsReadMutation.isPending}
                      clickable
                    />
                  )}
                  <Chip
                    size="small"
                    icon={<DeleteOutlineIcon />}
                    label="Delete"
                    color="error"
                    variant="outlined"
                    onClick={() => deleteNotificationMutation.mutate(n.id)}
                    disabled={deleteNotificationMutation.isPending}
                    clickable
                  />
                </Stack>
              </Box>
            </ListItem>
          </Paper>
        ))}

        {filtered.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: "1px dashed",
              borderColor: "divider",
              p: { xs: 2, sm: 2.5 },
              textAlign: "center",
            }}
          >
            <Typography fontWeight={700}>No notifications</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
              You're all caught up.
            </Typography>
          </Paper>
        )}
      </List>
    </Box>
  );
}
