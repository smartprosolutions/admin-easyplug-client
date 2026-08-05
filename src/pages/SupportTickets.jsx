import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";
import { gradientPrimary } from "../theme/theme";
import {
  getAdminSupportTicket,
  getAdminSupportTickets,
  replyAdminSupportTicket,
  updateAdminSupportTicketStatus,
} from "../services/ticketService";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

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

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export default function SupportTickets() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState("");
  const [replyStatus, setReplyStatus] = useState("in_progress");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-support-tickets", statusFilter, searchQuery],
    queryFn: () =>
      getAdminSupportTickets({
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchQuery.trim() ? { q: searchQuery.trim() } : {}),
      }),
  });

  const tickets = useMemo(() => data?.tickets || [], [data]);

  const {
    data: detailData,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
  } = useQuery({
    queryKey: ["admin-support-ticket", selectedId],
    queryFn: () => getAdminSupportTicket(selectedId),
    enabled: Boolean(selectedId),
  });

  const selectedTicket = detailData?.ticket;

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, message, status }) =>
      replyAdminSupportTicket(ticketId, { message, status }),
    onSuccess: () => {
      setReply("");
      setFeedback({ type: "success", message: "Reply sent to the user." });
      queryClient.invalidateQueries({
        queryKey: ["admin-support-ticket", selectedId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to send reply.",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ ticketId, status }) =>
      updateAdminSupportTicketStatus(ticketId, status),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Ticket status updated." });
      queryClient.invalidateQueries({
        queryKey: ["admin-support-ticket", selectedId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update status.",
      });
    },
  });

  const rows = useMemo(
    () =>
      tickets.map((ticket) => ({
        id: ticket.ticketId,
        reference: ticket.reference,
        subject: ticket.subject,
        service: ticket.serviceLabel || ticket.service,
        status: ticket.status,
        userName: [ticket.user?.firstName, ticket.user?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "User",
        email: ticket.user?.email || "",
        updatedAt: ticket.lastMessageAt || ticket.createdAt,
      })),
    [tickets],
  );

  const columns = useMemo(
    () => [
      {
        field: "reference",
        headerName: "Reference",
        width: 130,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1}>
            <ConfirmationNumberOutlinedIcon
              sx={{ fontSize: 18, color: "#667eea" }}
            />
            <Typography fontSize={13} fontWeight={700}>
              {params.value}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "subject",
        headerName: "Subject",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography fontSize={13} fontWeight={700} noWrap>
              {params.value}
            </Typography>
            <Typography fontSize={12} color="text.secondary" noWrap>
              {params.row.service}
            </Typography>
          </Box>
        ),
      },
      {
        field: "userName",
        headerName: "User",
        flex: 1,
        minWidth: 160,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Avatar
              sx={{ width: 28, height: 28, bgcolor: "#667eea", fontSize: 12 }}
            >
              {params.value?.charAt(0) || "U"}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontSize={13} noWrap>
                {params.value}
              </Typography>
              <Typography fontSize={12} color="text.secondary" noWrap>
                {params.row.email}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        renderCell: (params) => (
          <Chip
            size="small"
            color={statusColor[params.value] || "default"}
            label={statusLabel[params.value] || params.value}
            sx={{ fontWeight: 700 }}
          />
        ),
      },
      {
        field: "updatedAt",
        headerName: "Updated",
        width: 160,
        renderCell: (params) => (
          <Typography fontSize={13} color="text.secondary">
            {formatDate(params.value)}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 90,
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="View & reply">
            <IconButton
              size="small"
              onClick={() => {
                setFeedback({ type: "", message: "" });
                setReply("");
                setReplyStatus(
                  params.row.status === "closed"
                    ? "closed"
                    : params.row.status === "resolved"
                      ? "resolved"
                      : "in_progress",
                );
                setSelectedId(params.row.id);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [],
  );

  const counts = useMemo(() => {
    const all = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    return { all, open, inProgress, resolved };
  }, [tickets]);

  const handleSendReply = () => {
    const message = reply.trim();
    if (!message || !selectedId) return;
    replyMutation.mutate({
      ticketId: selectedId,
      message,
      status: replyStatus,
    });
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Support Tickets
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            View user tickets and reply from the admin console.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {[
            { label: "All", value: counts.all },
            { label: "Open", value: counts.open },
            { label: "In progress", value: counts.inProgress },
            { label: "Resolved", value: counts.resolved },
          ].map((item) => (
            <Chip
              key={item.label}
              label={`${item.label}: ${item.value}`}
              sx={{
                fontWeight: 700,
                bgcolor: alpha("#667eea", 0.08),
                color: "#667eea",
              }}
            />
          ))}
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search reference, subject, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { sm: 280 }, flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value || "all"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {isError ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error?.response?.data?.message || "Failed to load support tickets."}
        </Alert>
      ) : null}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <MetricsDataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            autoHeight
            minHeight={isMobile ? 320 : 420}
          />
        )}
      </Paper>

      <Dialog
        open={Boolean(selectedId)}
        onClose={() => {
          if (!replyMutation.isPending && !statusMutation.isPending) {
            setSelectedId(null);
          }
        }}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedTicket
            ? `${selectedTicket.reference} · ${selectedTicket.subject}`
            : "Support ticket"}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {detailError ? (
            <Alert severity="error">
              {detailErr?.response?.data?.message || "Could not load ticket."}
            </Alert>
          ) : null}

          {selectedTicket ? (
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {[selectedTicket.user?.firstName, selectedTicket.user?.lastName]
                      .filter(Boolean)
                      .join(" ")}{" "}
                    · {selectedTicket.user?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTicket.serviceLabel} · Opened{" "}
                    {formatDate(selectedTicket.createdAt)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    color={statusColor[selectedTicket.status] || "default"}
                    label={
                      statusLabel[selectedTicket.status] || selectedTicket.status
                    }
                    sx={{ fontWeight: 700 }}
                  />
                  <TextField
                    select
                    size="small"
                    label="Set status"
                    value={selectedTicket.status}
                    disabled={statusMutation.isPending}
                    onChange={(e) =>
                      statusMutation.mutate({
                        ticketId: selectedTicket.ticketId,
                        status: e.target.value,
                      })
                    }
                    sx={{ minWidth: 140 }}
                  >
                    {STATUS_OPTIONS.filter((o) => o.value).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Stack>

              {feedback.message ? (
                <Alert
                  severity={feedback.type || "info"}
                  onClose={() => setFeedback({ type: "", message: "" })}
                >
                  {feedback.message}
                </Alert>
              ) : null}

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  maxHeight: 360,
                  overflowY: "auto",
                  bgcolor: alpha("#667eea", 0.03),
                }}
              >
                <Stack spacing={1.25}>
                  {(selectedTicket.messages || []).map((msg) => {
                    const isAdmin = msg.senderRole === "admin";
                    return (
                      <Box
                        key={msg.messageId}
                        sx={{
                          alignSelf: isAdmin ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                        >
                          {isAdmin ? "Admin" : "User"} ·{" "}
                          {formatDate(msg.createdAt)}
                        </Typography>
                        <Paper
                          elevation={0}
                          sx={{
                            mt: 0.35,
                            p: 1.25,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: isAdmin
                              ? alpha("#667eea", 0.35)
                              : "divider",
                            bgcolor: isAdmin
                              ? alpha("#667eea", 0.08)
                              : "background.paper",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          <Typography variant="body2">{msg.message}</Typography>
                        </Paper>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>

              {selectedTicket.status === "closed" ? (
                <Alert severity="info">
                  This ticket is closed. Re-open it from Set status to reply.
                </Alert>
              ) : (
                <Stack spacing={1.25}>
                  <TextField
                    select
                    size="small"
                    label="Status after reply"
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    sx={{ maxWidth: 220 }}
                  >
                    {STATUS_OPTIONS.filter((o) => o.value).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply to the user..."
                    multiline
                    minRows={3}
                    fullWidth
                    disabled={replyMutation.isPending}
                  />
                </Stack>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setSelectedId(null)}
            disabled={replyMutation.isPending}
            sx={{ textTransform: "none" }}
          >
            Close
          </Button>
          {selectedTicket && selectedTicket.status !== "closed" ? (
            <Button
              variant="contained"
              endIcon={
                replyMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SendRoundedIcon />
                )
              }
              disabled={!reply.trim() || replyMutation.isPending}
              onClick={handleSendReply}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                background: gradientPrimary,
              }}
            >
              {replyMutation.isPending ? "Sending..." : "Send reply"}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
