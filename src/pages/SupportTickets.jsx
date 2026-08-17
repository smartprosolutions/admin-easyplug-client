import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { getAdminSupportTickets } from "../services/supportTicketService";
import { gradientPrimary } from "../theme/theme";

const STATUS_FILTERS = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
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
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function userDisplayName(user) {
  if (!user) return "Unknown user";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "Unknown user";
}

export default function SupportTickets() {
  const [statusFilter, setStatusFilter] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ["admin-support-tickets", statusFilter, searchQuery],
    queryFn: () =>
      getAdminSupportTickets({
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(searchQuery.trim() ? { q: searchQuery.trim() } : {}),
      }),
    staleTime: 30 * 1000,
  });

  const tickets = useMemo(() => data?.tickets || data?.data?.tickets || [], [data]);

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1.25, sm: 1.75, md: 1 },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ConfirmationNumberOutlinedIcon sx={{ color: "#667eea" }} />
            <Typography
              variant="h5"
              fontWeight={700}
              color="primary.main"
              sx={{ fontSize: { xs: 22, sm: 28 } }}
            >
              Support Tickets
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Review and respond to customer support requests.
          </Typography>
        </Box>
        <Chip
          label={`${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
          sx={{
            alignSelf: { xs: "flex-start", sm: "center" },
            fontWeight: 700,
            background: gradientPrimary,
            color: "#fff",
          }}
        />
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search by reference, subject, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                bgcolor: alpha("#667eea", 0.04),
              },
            }}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{
              overflowX: "auto",
              pb: 0.5,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {STATUS_FILTERS.map((filter) => (
              <Chip
                key={filter.id}
                label={filter.label}
                onClick={() => setStatusFilter(filter.id)}
                sx={{
                  fontWeight: 600,
                  bgcolor:
                    statusFilter === filter.id
                      ? "primary.main"
                      : alpha("#667eea", 0.08),
                  color: statusFilter === filter.id ? "#fff" : "text.primary",
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load tickets.{" "}
          {error?.response?.data?.message || error?.message || "Please retry."}
        </Alert>
      ) : null}

      {isPending || isFetching ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : tickets.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <Typography color="text.secondary">
            No {statusFilter === "all" ? "" : `${statusLabel[statusFilter] || statusFilter} `}
            tickets found.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.25}>
          {tickets.map((ticket) => {
            const name = userDisplayName(ticket.user);
            return (
              <Paper
                key={ticket.ticketId}
                component={RouterLink}
                to={`/support-tickets/${ticket.ticketId}`}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  textDecoration: "none",
                  color: "inherit",
                  borderLeft: "4px solid",
                  borderLeftColor:
                    ticket.status === "open"
                      ? "warning.main"
                      : ticket.status === "in_progress"
                        ? "info.main"
                        : ticket.status === "resolved"
                          ? "success.main"
                          : "divider",
                  "&:hover": {
                    boxShadow: `0 4px 18px ${alpha("#667eea", 0.18)}`,
                  },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography fontWeight={700} fontSize={14} noWrap>
                        {ticket.reference || ticket.ticketId}
                      </Typography>
                      <Chip
                        size="small"
                        color={statusColor[ticket.status] || "default"}
                        label={statusLabel[ticket.status] || ticket.status}
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                    <Typography fontWeight={600} fontSize={15} noWrap>
                      {ticket.subject}
                    </Typography>
                    <Typography fontSize={13} color="text.secondary" noWrap>
                      {name}
                      {ticket.user?.email ? ` · ${ticket.user.email}` : ""}
                      {ticket.serviceLabel ? ` · ${ticket.serviceLabel}` : ""}
                    </Typography>
                  </Box>
                  <Typography fontSize={12} color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                    {formatDate(ticket.lastMessageAt || ticket.createdAt)}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
