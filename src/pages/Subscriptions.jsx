/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
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
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const itemsPerPage = 8;

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

  // Pagination
  const totalPages =
    Math.ceil(filteredSubscriptions.length / itemsPerPage) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    // Reset to first page when search query changes
    if (query && page !== 1) {
      setPage(1);
    }
  }, [query, page]);

  const formatCurrency = (val) => {
    try {
      const n = Number(val);
      return `R ${Number.isFinite(n) ? n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}`;
    } catch {
      return val;
    }
  };

  const formatDuration = (hours) => {
    if (!hours) return "-";
    if (hours < 24) return `${hours} hrs`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "1 day" : `${days} days`;
  };

  const formatTierLabel = (tier) => {
    const priceLabel = formatCurrency(tier?.price);
    const users = Number(tier?.usersPerHour);
    const usersLabel = Number.isFinite(users)
      ? `${users.toLocaleString("en-ZA")} users/hr`
      : "users/hr";
    return `${priceLabel} • ${usersLabel}`;
  };

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
    <Box sx={{ py: 3, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
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

      {/* Search & Add */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mt: 2, mb: 3, width: "100%" }}
        alignItems="center"
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
            minWidth: 180,
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
      ) : paginatedSubscriptions.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            mt: 4,
          }}
        >
          <Card
            sx={{
              maxWidth: 500,
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
        <>
          <Grid container spacing={2.5}>
            {paginatedSubscriptions.map((sub) => (
              <Grid
                key={sub.subscriptionId}
                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
              >
                <Paper
                  sx={{
                    p: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: (theme) => theme.palette.background.paper,
                    border: (theme) =>
                      `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    borderRadius: 3,
                    overflow: "hidden",
                    transition: "all .25s ease",
                    "&:hover": {
                      boxShadow: "0 8px 30px rgba(102, 126, 234, 0.15)",
                      transform: "translateY(-4px)",
                      borderColor: alpha("#667eea", 0.3),
                    },
                  }}
                >
                  {/* Header with gradient */}
                  <Box
                    sx={{
                      backgroundImage: gradientPrimary,
                      p: 2,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: -20,
                        right: -20,
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.1)",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: -30,
                        left: -10,
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.08)",
                      }}
                    />
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{ position: "relative", zIndex: 1 }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "#fff",
                          width: 44,
                          height: 44,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <SubscriptionsIcon />
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          noWrap
                          sx={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#fff",
                          }}
                        >
                          {sub.name || "Untitled"}
                        </Typography>
                        <Chip
                          label={
                            sub.status?.toLowerCase() === "active"
                              ? "Active"
                              : sub.status?.toLowerCase() === "draft"
                                ? "Draft"
                                : sub.status || "Inactive"
                          }
                          size="small"
                          sx={{
                            mt: 0.5,
                            height: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor:
                              sub.status?.toLowerCase() === "active"
                                ? "rgba(76, 175, 80, 0.9)"
                                : sub.status?.toLowerCase() === "draft"
                                  ? "rgba(33, 150, 243, 0.9)"
                                  : "rgba(244, 67, 54, 0.9)",
                            color: "#fff",
                          }}
                        />
                      </Box>
                    </Stack>
                  </Box>

                  {/* Content */}
                  <Box
                    sx={{
                      p: 2,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    {/* Price highlight */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha("#4caf50", 0.08),
                        border: `1px solid ${alpha("#4caf50", 0.15)}`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        Price
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color="success.main"
                      >
                        {formatCurrency(sub.price)}
                      </Typography>
                    </Box>

                    {/* Duration */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ px: 0.5 }}
                    >
                      <AccessTimeIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Duration:{" "}
                        <strong>{formatDuration(sub.durationInHours)}</strong>
                      </Typography>
                    </Stack>

                    {/* Pricing tiers */}
                    <Box sx={{ px: 0.5 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Pricing tiers
                      </Typography>
                      {Array.isArray(sub.pricingTiers) &&
                      sub.pricingTiers.length > 0 ? (
                        <Stack
                          spacing={0.75}
                          sx={{ mt: 0.75 }}
                          divider={
                            <Box
                              sx={{
                                borderBottom: "1px dashed",
                                borderColor: "divider",
                              }}
                            />
                          }
                        >
                          {sub.pricingTiers.map((tier, index) => (
                            <Stack
                              key={`${sub.subscriptionId}-tier-${index}`}
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <AttachMoneyIcon
                                sx={{ fontSize: 16, color: "text.secondary" }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatTierLabel(tier)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          No tiers configured
                        </Typography>
                      )}
                    </Box>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        minHeight: 40,
                        lineHeight: 1.5,
                        px: 0.5,
                      }}
                    >
                      {sub.description || "No description provided"}
                    </Typography>

                    {/* Actions */}
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        mt: "auto",
                        pt: 1.5,
                        borderTop: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                        onClick={() =>
                          navigate(`/subscriptions/${sub.subscriptionId}/edit`)
                        }
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          backgroundImage: gradientPrimary,
                          boxShadow: "none",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                          },
                        }}
                      >
                        Edit
                      </Button>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                variant="outlined"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                sx={{ borderRadius: 2 }}
              >
                Previous
              </Button>
              <Typography variant="body2" color="text.secondary">
                Page {currentPage} of {totalPages}
              </Typography>
              <Button
                variant="contained"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                sx={{
                  backgroundImage: gradientPrimary,
                  color: "#fff",
                  borderRadius: 2,
                  "&:hover": { filter: "brightness(0.95)" },
                  "&:disabled": { backgroundImage: "none" },
                }}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Outlet for nested routes (modal) */}
      <Outlet />
    </Box>
  );
}
