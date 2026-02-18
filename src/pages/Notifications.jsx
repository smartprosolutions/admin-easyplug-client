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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
} from "../services/notificationService";
import { connectSocket, getSocket } from "../socket/socketClient";

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
  const queryClient = useQueryClient();
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
      }))
    );
  }, [notificationsResponse]);

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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
    onError: (err) => console.error("Failed to mark as read:", err),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: (_, id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    onError: (err) => console.error("Failed to delete notification:", err),
  });

  const filtered = useMemo(
    () =>
      notifications.filter((n) =>
        filter === "all" ? true : n.type === filter
      ),
    [notifications, filter]
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
    <Box sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">Notifications</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button onClick={() => setFilter("system")}>System</Button>
          <Button onClick={() => setFilter("message")}>Messages</Button>
          <Button onClick={() => setFilter("warning")}>Warnings</Button>
          <Button onClick={() => setFilter("promo")}>Promos</Button>
        </Stack>
      </Stack>
      <Paper sx={{ p: 2 }} elevation={3}>
        <List>
          {filtered.map((n, idx) => (
            <React.Fragment key={n.id}>
              <ListItem
                sx={{ opacity: n.isRead ? 0.6 : 1 }}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    {typeChip(n.type)}
                    {!n.isRead && (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => markAsReadMutation.mutate(n.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <CheckIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteNotificationMutation.mutate(n.id)}
                      disabled={deleteNotificationMutation.isPending}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: n.isRead ? "grey.400" : "primary.main" }}>
                    {n.title?.charAt(0) || "N"}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={n.title}
                  secondary={`${n.body} • ${n.time}`}
                />
              </ListItem>
              {idx < filtered.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
          {filtered.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No notifications"
                secondary="You're all caught up"
              />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
}
