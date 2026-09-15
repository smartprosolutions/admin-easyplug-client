import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  getAdminSupportTicket,
  replyAdminSupportTicket,
  updateAdminSupportTicketStatus,
} from "../services/supportTicketService";
import { gradientPrimary } from "../theme/theme";

const statusColor = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  closed: "default",
};

const statusLabel = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function userDisplayName(user) {
  if (!user) return "User";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "User";
}

export default function SupportTicketDetail() {
  const { ticketId } = useParams();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [reply, setReply] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin-support-ticket", ticketId],
    queryFn: () => getAdminSupportTicket(ticketId),
    enabled: Boolean(ticketId),
  });

  const ticket = data?.ticket;
  const messages = useMemo(() => ticket?.messages || [], [ticket]);
  const isClosed = ticket?.status === "closed";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["admin-support-ticket", ticketId],
    });
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
  };

  const replyMutation = useMutation({
    mutationFn: ({ message, status }) =>
      replyAdminSupportTicket(ticketId, { message, status }),
    onSuccess: () => {
      setReply("");
      setErrorMsg("");
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateAdminSupportTicketStatus(ticketId, status),
    onSuccess: () => {
      setErrorMsg("");
      invalidate();
    },
  });

  const handleSend = async () => {
    const message = reply.trim();
    if (!message || replyMutation.isPending) return;
    try {
      await replyMutation.mutateAsync({ message });
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message || err?.message || "Failed to send reply.",
      );
    }
  };

  const handleStatusChange = async (event) => {
    const status = event.target.value;
    if (!status || status === ticket?.status || statusMutation.isPending) return;
    try {
      await statusMutation.mutateAsync(status);
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update status.",
      );
    }
  };

  if (isPending) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError || !ticket) {
    return (
      <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 2 }}>
        <Button
          component={RouterLink}
          to="/support-tickets"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ mb: 2 }}
        >
          Back to tickets
        </Button>
        <Alert severity="error">
          {error?.response?.data?.message ||
            error?.message ||
            "Ticket not found."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1.25, sm: 1.75, md: 1 },
      }}
    >
      <Button
        component={RouterLink}
        to="/support-tickets"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ mb: 2 }}
      >
        Back to tickets
      </Button>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "flex-start" }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
              <Typography fontWeight={700}>
                {ticket.reference || ticket.ticketId}
              </Typography>
              <Chip
                size="small"
                color={statusColor[ticket.status] || "default"}
                label={statusLabel[ticket.status] || ticket.status}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              {ticket.subject}
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              {userDisplayName(ticket.user)}
              {ticket.user?.email ? ` · ${ticket.user.email}` : ""}
              {ticket.serviceLabel ? ` · ${ticket.serviceLabel}` : ""}
            </Typography>
            <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
              Opened {formatDate(ticket.createdAt)}
              {ticket.lastMessageAt
                ? ` · Last message ${formatDate(ticket.lastMessageAt)}`
                : ""}
            </Typography>
          </Box>
          <TextField
            select
            size="small"
            label="Status"
            value={ticket.status || "open"}
            onChange={handleStatusChange}
            disabled={statusMutation.isPending}
            sx={{ minWidth: 180 }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {errorMsg ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg("")}>
          {errorMsg}
        </Alert>
      ) : null}

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          minHeight: { xs: 420, md: 520 },
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            bgcolor: alpha("#667eea", 0.03),
          }}
        >
          <Stack spacing={1.25}>
            {messages.map((msg) => {
              const isAdmin = String(msg.senderRole || "").toLowerCase() === "admin";
              return (
                <Box
                  key={msg.messageId}
                  sx={{
                    alignSelf: isAdmin ? "flex-end" : "flex-start",
                    maxWidth: { xs: "92%", sm: "75%" },
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isAdmin ? "#667eea" : "background.paper",
                      color: isAdmin ? "#fff" : "text.primary",
                      border: isAdmin ? "none" : "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography fontSize={12} sx={{ opacity: 0.85, mb: 0.5 }}>
                      {isAdmin
                        ? "Support"
                        : userDisplayName(msg.sender || ticket.user)}
                    </Typography>
                    <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap" }}>
                      {msg.message}
                    </Typography>
                    <Typography
                      fontSize={11}
                      sx={{ opacity: 0.75, mt: 0.75, textAlign: "right" }}
                    >
                      {formatDate(msg.createdAt)}
                    </Typography>
                  </Paper>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Stack>
        </Box>

        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          {isClosed ? (
            <Alert severity="info">
              This ticket is closed. Re-open it from the status menu to reply.
            </Alert>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
                placeholder="Write a reply to the customer..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={replyMutation.isPending}
              />
              <Button
                variant="contained"
                endIcon={<SendRoundedIcon />}
                onClick={handleSend}
                disabled={!reply.trim() || replyMutation.isPending}
                sx={{
                  backgroundImage: gradientPrimary,
                  color: "#fff",
                  borderRadius: 2,
                  px: 2.5,
                  minWidth: { sm: 120 },
                  alignSelf: { xs: "stretch", sm: "flex-end" },
                }}
              >
                {replyMutation.isPending ? "Sending..." : "Reply"}
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
