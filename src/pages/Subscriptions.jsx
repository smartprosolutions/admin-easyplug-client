/* eslint-disable no-unused-vars */
import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  Chip,
  Avatar,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { useNavigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { getSubscriptions } from "../services/subscriptionService";
import { gradientPrimary } from "../theme/theme";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

export default function Subscriptions() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getSubscriptions(),
  });

  const allSubscriptions =
    data && data.subscriptions
      ? data.subscriptions
      : Array.isArray(data)
        ? data
        : data?.data || [];

  // Filter subscriptions based on search
  const filteredSubscriptions = allSubscriptions.filter(
    (s) =>
      s.name?.toLowerCase().includes(query.toLowerCase()) ||
      s.description?.toLowerCase().includes(query.toLowerCase()),
  );

  const formatCurrency = useCallback((val) => {
    try {
      const n = Number(val);
      return `R ${Number.isFinite(n) ? n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}`;
    } catch {
      return val;
    }
  }, []);

  const formatDuration = useCallback((hours) => {
    if (!hours) return "-";
    if (hours < 24) return `${hours} hrs`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "1 day" : `${days} days`;
  }, []);

  const formatTierLabel = useCallback((tier) => {
    const priceLabel = formatCurrency(tier?.price);
    const users = Number(tier?.usersPerHour);
    const usersLabel = Number.isFinite(users)
      ? `${users.toLocaleString("en-ZA")} users/hr`
      : "users/hr";
    return `${priceLabel} • ${usersLabel}`;
  }, [formatCurrency]);

  const activeSubscriptions = allSubscriptions.filter(
    (s) => String(s?.status || "").toLowerCase() === "active",
  ).length;

  const tierPrices = allSubscriptions.flatMap((s) =>
    Array.isArray(s?.pricingTiers)
      ? s.pricingTiers
          .map((tier) => Number(tier?.price || 0))
          .filter((p) => Number.isFinite(p) && p > 0)
      : [],
  );

  const avgTierPrice =
    tierPrices.length > 0
      ? tierPrices.reduce((sum, p) => sum + p, 0) / tierPrices.length
      : 0;

  const durationMap = allSubscriptions.reduce((acc, sub) => {
    const duration = Number(sub?.durationInHours || 0);
    if (!Number.isFinite(duration) || duration <= 0) return acc;
    acc[duration] = (acc[duration] || 0) + 1;
    return acc;
  }, {});

  const topDurationEntry = Object.entries(durationMap).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const topDurationHours = Number(topDurationEntry?.[0] || 0);
  const topDurationCount = topDurationEntry?.[1] || 0;

  const subscriptionCards = [
    {
      label: "Total Plans",
      value: allSubscriptions.length.toLocaleString("en-ZA"),
      sub: "All subscription packages",
      accent: "primary.main",
    },
    {
      label: "Active Plans",
      value: activeSubscriptions.toLocaleString("en-ZA"),
      sub: "Currently available to sellers",
      accent: "success.main",
    },
    {
      label: "Average Tier Price",
      value: formatCurrency(avgTierPrice),
      sub: "Average across all pricing tiers",
      accent: "warning.main",
    },
    {
      label: "Top Duration",
      value: topDurationHours ? formatDuration(topDurationHours) : "-",
      sub: `${topDurationCount.toLocaleString("en-ZA")} plans`,
      accent: "secondary.main",
    },
  ];

  const subscriptionRows = filteredSubscriptions.map((sub) => ({
    id: sub.subscriptionId ?? sub.id,
    ...sub,
  }));

  const gridColumns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Plan Name",
        minWidth: 220,
        flex: 1.1,
        renderCell: (params) => (
          <Typography
            fontWeight={600}
            fontSize={13}
            sx={{ whiteSpace: "normal", lineHeight: 1.35, py: 0.5 }}
          >
            {params.row.name || "Untitled"}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 130,
        flex: 0.7,
        renderCell: (params) => {
          const status = String(params.value || "").toLowerCase();
          const chipColor =
            status === "active"
              ? "success"
              : status === "draft"
                ? "info"
                : "default";

          return (
            <Chip
              size="small"
              color={chipColor}
              label={
                status
                  ? status.charAt(0).toUpperCase() + status.slice(1)
                  : "Unknown"
              }
            />
          );
        },
      },
      {
        field: "durationInHours",
        headerName: "Duration",
        minWidth: 140,
        flex: 0.7,
        renderCell: (params) => (
          <Typography
            fontSize={13}
            color="text.secondary"
            sx={{ whiteSpace: "normal", lineHeight: 1.35, py: 0.5 }}
          >
            {formatDuration(params.value)}
          </Typography>
        ),
      },
      {
        field: "baseTierPrice",
        headerName: "Price",
        minWidth: 140,
        flex: 0.7,
        renderCell: (params) => {
          const tierPrice = Array.isArray(params.row.pricingTiers)
            ? Number(params.row.pricingTiers[0]?.price || 0)
            : Number(params.row.price || 0);
          return (
            <Typography
              fontWeight={700}
              fontSize={13}
              color="success.main"
              sx={{ whiteSpace: "normal", lineHeight: 1.35, py: 0.5 }}
            >
              {formatCurrency(tierPrice)}
            </Typography>
          );
        },
      },
      {
        field: "tiers",
        headerName: "Pricing Tiers",
        minWidth: 280,
        flex: 1.45,
        renderCell: (params) => {
          const tiers = Array.isArray(params.row.pricingTiers)
            ? params.row.pricingTiers
            : [];
          if (tiers.length === 0) {
            return (
              <Typography fontSize={13} color="text.secondary">
                No tiers configured
              </Typography>
            );
          }

          return (
            <Typography
              fontSize={13}
              color="text.secondary"
              sx={{
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                lineHeight: 1.35,
                py: 0.5,
                width: "100%",
              }}
              title={tiers.map((tier) => formatTierLabel(tier)).join(" | ")}
            >
              {tiers.map((tier) => formatTierLabel(tier)).join(" | ")}
            </Typography>
          );
        },
      },
      {
        field: "description",
        headerName: "Description",
        minWidth: 300,
        flex: 1.6,
        renderCell: (params) => (
          <Typography
            fontSize={13}
            color="text.secondary"
            sx={{
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              lineHeight: 1.35,
              py: 0.5,
              width: "100%",
            }}
            title={params.value || "No description provided"}
          >
            {params.value || "No description provided"}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        minWidth: 170,
        flex: 0.8,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="View plan">
              <IconButton size="small" color="primary">
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit plan">
              <IconButton
                size="small"
                onClick={() =>
                  navigate(`/subscriptions/${params.row.subscriptionId}/edit`)
                }
                sx={{
                  color: "#fff",
                  backgroundImage: gradientPrimary,
                  "&:hover": { opacity: 0.92 },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [formatCurrency, formatDuration, formatTierLabel, navigate],
  );

  if (error) {
    return (
      <Box sx={{ py: 3, px: { xs: 2, md: 3 } }}>
        <Alert severity="error">
          Failed to load subscriptions. {error?.message || "Please try again."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 1, gap: { xs: 0.5, sm: 0 } }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Subscriptions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage subscription plans and pricing
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.2 }}>
          Subscription Overview
        </Typography>
        <Grid container spacing={1.5}>
          {subscriptionCards.map((card) => (
            <Grid key={card.label} size={{ xs: 6, sm: 6, md: 3 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.8,
                  height: "100%",
                  borderLeft: "4px solid",
                  borderLeftColor: card.accent,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {card.label}
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ lineHeight: 1.2, my: 0.4 }}
                >
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.sub}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Search & Add */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mt: 2, mb: 3, width: "100%" }}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subscriptions by name or description"
          fullWidth
          size="medium"
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, bgcolor: alpha("#667eea", 0.04) },
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/subscriptions/add")}
          sx={{
            backgroundImage: gradientPrimary,
            color: "#fff",
            minWidth: { xs: "100%", sm: 180 },
            mt: { xs: 0.25, sm: 0 },
            whiteSpace: "nowrap",
            borderRadius: 2,
            px: 3,
            py: 1.5,
            "&:hover": { opacity: 0.92 },
          }}
        >
          Add Subscription
        </Button>
      </Stack>

      {isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredSubscriptions.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: { xs: "50vh", sm: "60vh" },
            mt: 4,
          }}
        >
          <Card
            sx={{
              maxWidth: 500,
              width: "100%",
              textAlign: "center",
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
              border: (theme) =>
                `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              position: "relative",
              overflow: "visible",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
              {/* Animated Background Circles */}
              <Box
                sx={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background: (theme) =>
                    alpha(theme.palette.primary.main, 0.05),
                  animation: `${pulse} 3s ease-in-out infinite`,
                  zIndex: 0,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -30,
                  left: -30,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: (theme) =>
                    alpha(theme.palette.secondary.main, 0.05),
                  animation: `${pulse} 3s ease-in-out infinite 1.5s`,
                  zIndex: 0,
                }}
              />

              {/* Main Icon */}
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box
                  sx={{
                    width: { xs: 100, sm: 120 },
                    height: { xs: 100, sm: 120 },
                    margin: "0 auto 24px",
                    borderRadius: "50%",
                    background: (theme) =>
                      alpha(theme.palette.primary.main, 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: `${float} 4s ease-in-out infinite`,
                    border: (theme) =>
                      `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  {query ? (
                    <SearchOffIcon
                      sx={{
                        fontSize: { xs: 50, sm: 60 },
                        color: "primary.main",
                        opacity: 0.8,
                      }}
                    />
                  ) : (
                    <SubscriptionsIcon
                      sx={{
                        fontSize: { xs: 50, sm: 60 },
                        color: "primary.main",
                        opacity: 0.8,
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    background: gradientPrimary,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {query ? "No Results Found" : "No Subscriptions Yet"}
                </Typography>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3, lineHeight: 1.7, px: { xs: 1, sm: 3 } }}
                >
                  {query
                    ? `We couldn't find any subscriptions matching "${query}". Try adjusting your search terms.`
                    : "Get started by creating your first subscription plan. Define pricing and duration for your services."}
                </Typography>

                {!query && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/subscriptions/add")}
                    sx={{
                      backgroundImage: gradientPrimary,
                      color: "#fff",
                      px: 4,
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 600,
                      borderRadius: 2,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                      "&:hover": {
                        boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                        transform: "translateY(-2px)",
                        transition: "all 0.3s ease",
                      },
                    }}
                  >
                    Add Subscription
                  </Button>
                )}

                {query && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setQuery("")}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 600,
                      borderWidth: 2,
                      borderRadius: 2,
                      "&:hover": { borderWidth: 2 },
                    }}
                  >
                    Clear Search
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <MetricsDataGrid
          autoHeight
          rows={subscriptionRows}
          columns={gridColumns}
          pageSize={10}
          getRowHeight={() => "auto"}
          sx={{
            "& .MuiDataGrid-columnHeaderTitle": {
              whiteSpace: "normal",
              lineHeight: 1.25,
            },
            "& .MuiDataGrid-cell": {
              alignItems: "center",
              py: 1,
            },
            "& .MuiDataGrid-cellContent": {
              whiteSpace: "normal",
              overflow: "visible",
              textOverflow: "unset",
            },
          }}
        />
      )}

      {/* Outlet for nested routes (modal) */}
      <Outlet />
    </Box>
  );
}
