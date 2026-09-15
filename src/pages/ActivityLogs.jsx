import React, { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Avatar,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useQuery } from "@tanstack/react-query";
import SearchIcon from "@mui/icons-material/Search";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import PersonIcon from "@mui/icons-material/Person";
import { useUserProfileQuery } from "../services/queries";
import { isAdminRole, resolveUserRole } from "../utils/accessControl";
import {
  getActivityLogs,
  getActivityLogActions,
  getActivityLogEntityTypes,
} from "../services/activityLogService";

const ACTION_COLORS = {
  login: "success",
  register: "info",
  delete: "error",
  create: "primary",
  update: "warning",
  list: "default",
  get: "default",
  view: "default",
  search: "secondary",
};

function actionColor(action = "") {
  const lower = action.toLowerCase();
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (lower.startsWith(key) || lower.includes(key)) return color;
  }
  return "default";
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function UserCell({ log }) {
  const theme = useTheme();
  const u = log.user;
  if (!u) {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.text.secondary, 0.15) }}>
          <PersonIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </Avatar>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Guest
          </Typography>
        </Box>
      </Stack>
    );
  }
  const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "?";
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha(theme.palette.primary.main, 0.15), color: "primary.main" }}>
        {initials}
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight={600} noWrap>
          {u.firstName} {u.lastName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {u.email}
        </Typography>
      </Box>
    </Stack>
  );
}

function EntityCell({ log }) {
  if (!log.entityType && !log.entityId) return <Typography variant="body2" color="text.secondary">—</Typography>;
  return (
    <Stack spacing={0.5}>
      {log.entityType && (
        <Chip label={log.entityType} size="small" variant="outlined" sx={{ fontSize: 11, height: 20 }} />
      )}
      {log.entityId && (
        <Tooltip title={log.entityId}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", cursor: "default" }}>
            {log.entityId.slice(0, 8)}…
          </Typography>
        </Tooltip>
      )}
    </Stack>
  );
}

export default function ActivityLogs() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { data: profileData } = useUserProfileQuery();
  const role = resolveUserRole(profileData);
  const isAdmin = isAdminRole(role);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const LIMIT = 50;

  const params = {
    page,
    limit: LIMIT,
    ...(search ? { search } : {}),
    ...(filterAction ? { action: filterAction } : {}),
    ...(filterEntityType ? { entityType: filterEntityType } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["activity-logs", params],
    queryFn: () => getActivityLogs(params),
    enabled: isAdmin,
    keepPreviousData: true,
  });

  const { data: actionsData } = useQuery({
    queryKey: ["activity-log-actions"],
    queryFn: getActivityLogActions,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const { data: entityTypesData } = useQuery({
    queryKey: ["activity-log-entity-types"],
    queryFn: getActivityLogEntityTypes,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleFilterChange = useCallback((setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  }, []);

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You do not have permission to view activity logs.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <ManageSearchIcon color="primary" sx={{ fontSize: 28 }} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700}>
            Activity Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track all actions performed across the platform
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <CircularProgress size={20} /> : <RefreshRoundedIcon />}
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          flexWrap="wrap"
          alignItems={{ sm: "center" }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />

          {/* Action filter */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={filterAction}
              label="Action"
              onChange={handleFilterChange(setFilterAction)}
            >
              <MenuItem value="">All Actions</MenuItem>
              {(actionsData?.actions || []).map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Entity type filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Entity Type</InputLabel>
            <Select
              value={filterEntityType}
              label="Entity Type"
              onChange={handleFilterChange(setFilterEntityType)}
            >
              <MenuItem value="">All Types</MenuItem>
              {(entityTypesData?.entityTypes || []).map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date from */}
          <TextField
            size="small"
            label="From"
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />

          {/* Date to */}
          <TextField
            size="small"
            label="To"
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
        </Stack>
      </Paper>

      {/* Total count */}
      {!isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {total.toLocaleString()} log{total !== 1 ? "s" : ""} found
        </Typography>
      )}

      {/* Error */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load activity logs. Please try again.
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Table — desktop */}
      {!isLoading && !isMobile && (
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Device / Browser</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No activity logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.activityId} hover>
                    <TableCell>
                      <UserCell log={log} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={actionColor(log.action)}
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <EntityCell log={log} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12 }}>
                        {log.ipAddress || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" noWrap>
                          {log.device || "—"}{log.os ? ` · ${log.os}` : ""}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {log.browser || ""}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {formatDateTime(log.createdAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Cards — mobile */}
      {!isLoading && isMobile && (
        <Stack spacing={1.5}>
          {logs.length === 0 ? (
            <Alert severity="info">No activity logs found</Alert>
          ) : (
            logs.map((log) => (
              <Paper
                key={log.activityId}
                elevation={0}
                sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <UserCell log={log} />
                    <Chip
                      label={log.action}
                      size="small"
                      color={actionColor(log.action)}
                      variant="outlined"
                      sx={{ fontSize: 10, ml: 1 }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <EntityCell log={log} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      {log.ipAddress || "No IP"} · {log.device || "unknown"} · {log.browser || ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(log.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
