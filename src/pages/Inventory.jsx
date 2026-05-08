import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CustomDataGrid from "../components/customization/CustomDataGrid";
import {
  Stack,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Grid,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, Outlet } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteListing,
  getAdminListings,
  getListings,
} from "../services/listingService";
import { gradientPrimary } from "../theme/theme";
import ConfirmDialog from "../components/modals/ConfirmDialog";
import ToastAlert from "../components/alerts/ToastAlert";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useUserProfileQuery } from "../services/queries";
import {
  isOwnedByUser,
  isSellerRole,
  resolveUserId,
  resolveUserRole,
} from "../utils/accessControl";

// Live data will be fetched from the API

// (kept listings above) minimal page — only the grid

// No client-side formatting: show raw API fields in the grid per API contract

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export default function Inventory() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    severity: "info",
    message: "",
  });
  const { data: profileData } = useUserProfileQuery({ retry: false });
  const currentUserId = resolveUserId(profileData);
  const isSeller = isSellerRole(resolveUserRole(profileData));
  const listingsQueryKey = isSeller
    ? ["sellerListings", currentUserId]
    : ["adminListings"];

  const deleteMut = useMutation({
    mutationFn: (id) => deleteListing(id),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: listingsQueryKey });
      } catch {
        // ignore
      }
      setToast({ open: true, severity: "success", message: "Item deleted" });
      setDeleteTarget(null);
    },
    onError: (err) => {
      setToast({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || err.message || "Delete failed",
      });
    },
  });

  const { data: apiData, isPending } = useQuery({
    queryKey: listingsQueryKey,
    queryFn: () => (isSeller ? getListings() : getAdminListings()),
    retry: false,
  });

  // The API may return { listings: [...] } or an array directly. Normalize.
  const listings =
    apiData && Array.isArray(apiData)
      ? apiData
      : apiData && Array.isArray(apiData?.listings)
        ? apiData.listings
        : apiData?.data || [];

  // Use camelCase API fields when available. Ensure DataGrid `id` is set to listingId.
  const scopedListings = isSeller
    ? (listings || []).filter((item) => isOwnedByUser(item, currentUserId))
    : listings || [];

  const rows = scopedListings.map((r) => {
    const id = r.listingId ?? r.listing_id ?? r.id;
    return {
      id,
      ...r,
    };
  });

  // Use camelCase API fields (listingId, sellerId, createdAt, isAdvertisement) where possible.
  const statusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "success";
      case "draft":
        return "default";
      case "sold":
        return "warning";
      case "expired":
        return "error";
      default:
        return "primary";
    }
  };

  const columns = [
    { field: "title", headerName: "Title", flex: 1, minWidth: 200 },
    { field: "type", headerName: "Type", width: 120 },
    { field: "category", headerName: "Category", width: 140 },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      align: "right",
      headerAlign: "right",
    },
    {
      field: "isAdvertisement",
      headerName: "Ad",
      width: 120,
      renderCell: (params) =>
        (params.row.isAdvertisement ?? params.row.is_advertisement) ? (
          <Chip size="small" label="Ad" color="info" />
        ) : (
          <Chip size="small" label="Standard" />
        ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={statusColor(params.value)}
        />
      ),
    },

    {
      field: "createdAt",
      headerName: "Created",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">
            {formatDate(
              params.value ?? params.row.createdAt ?? params.row.created_at,
            )}
          </Typography>
        </Box>
      ),
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">
            {formatDate(
              params.value ?? params.row.updatedAt ?? params.row.updated_at,
            )}
          </Typography>
        </Box>
      ),
    },
  ];

  const totalProducts = rows.length;
  const activeProducts = rows.filter(
    (r) => String(r.status || "").toLowerCase() === "active",
  ).length;
  const promotedAds = rows.filter((r) =>
    Boolean(r.isAdvertisement ?? r.is_advertisement),
  ).length;

  const categoryCountMap = rows.reduce((acc, row) => {
    const key = String(row.category || "Uncategorized").trim();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topCategoryEntry = Object.entries(categoryCountMap).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const topCategory = topCategoryEntry?.[0] || "-";
  const topCategoryCount = topCategoryEntry?.[1] || 0;

  const productCards = [
    {
      label: "Total Products",
      value: totalProducts.toLocaleString("en-ZA"),
      sub: "All inventory records",
      accent: "primary.main",
    },
    {
      label: "Active Products",
      value: activeProducts.toLocaleString("en-ZA"),
      sub: "Currently visible to users",
      accent: "success.main",
    },
    {
      label: "Promoted Ads",
      value: promotedAds.toLocaleString("en-ZA"),
      sub: "Paid promotion products",
      accent: "warning.main",
    },
    {
      label: "Top Category",
      value: topCategory,
      sub: `${topCategoryCount.toLocaleString("en-ZA")} products`,
      accent: "secondary.main",
    },
  ];

  return (
    <Box sx={{ p: { xs: 1.25, sm: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={{ xs: 1.25, sm: 0 }}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSeller
              ? "Manage your inventory items and availability"
              : "Manage inventory items and availability"}
          </Typography>
        </Box>
        <Box sx={{ width: { xs: "100%", sm: "auto" }, mt: { xs: 0.5, sm: 0 } }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/inventory/add")}
            sx={{
              backgroundImage: gradientPrimary,
              color: "#fff",
              boxShadow: "none",
              borderRadius: { xs: 3, sm: 1.5 },
              py: { xs: 1.15, sm: 0.7 },
              fontSize: { xs: 16, sm: 14 },
              fontWeight: { xs: 800, sm: 600 },
              letterSpacing: { xs: 1, sm: 0 },
              width: { xs: "100%", sm: "auto" },
              "&:hover": { opacity: { xs: 0.95, sm: 0.92 }, boxShadow: "none" },
            }}
          >
            Add Item
          </Button>
        </Box>
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.2 }}>
          Product Overview
        </Typography>
        <Grid container spacing={1.5}>
          {productCards.map((card) => (
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

      <Box>
        {isPending ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : isMobile ? (
          <Stack spacing={1.25}>
            {rows.map((item) => {
              const rowId = item.listingId ?? item.listing_id ?? item.id;
              const canManageItem = isOwnedByUser(item, currentUserId);
              return (
                <Paper
                  key={rowId}
                  variant="outlined"
                  sx={{ p: 1.4, borderRadius: 2.2 }}
                >
                  <Stack spacing={0.9}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography fontSize={14} fontWeight={700} noWrap>
                        {item.title || "Untitled"}
                      </Typography>
                      <Chip
                        size="small"
                        label={item.status || "-"}
                        color={statusColor(item.status)}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                      <Chip size="small" label={item.category || "-"} />
                      <Chip
                        size="small"
                        label={(item.isAdvertisement ?? item.is_advertisement) ? "Ad" : "Standard"}
                        color={(item.isAdvertisement ?? item.is_advertisement) ? "info" : "default"}
                      />
                    </Stack>

                    <Typography fontSize={13} color="text.secondary">
                      Price: {item.price ?? "-"}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Updated: {formatDate(item.updatedAt ?? item.updated_at)}
                    </Typography>

                    <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        sx={{ border: "1px solid", borderColor: "divider" }}
                        onClick={() => navigate(`/inventory/${rowId}/edit`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {canManageItem ? (
                        <>
                          <IconButton
                            size="small"
                            sx={{ background: gradientPrimary, color: "#fff" }}
                            onClick={() => navigate(`/inventory/${rowId}/edit`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            sx={{ border: "1px solid", borderColor: "divider" }}
                            onClick={() =>
                              setDeleteTarget({
                                id: rowId,
                                title: item.title,
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : null}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <CustomDataGrid
            autoHeight
            rows={rows}
            columns={[
              ...columns,
              {
                field: "actions",
                headerName: "Actions",
                width: 160,
                sortable: false,
                renderCell: (params) => {
                  const rowId =
                    params.row.listingId ??
                    params.row.listing_id ??
                    params.row.id;
                  const canManageItem = isOwnedByUser(params.row, currentUserId);

                  return (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Tooltip title="View item">
                        <IconButton
                          sx={{
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            "&:hover": { borderColor: "primary.main" },
                          }}
                          onClick={() => {
                            navigate(`/inventory/${rowId}/edit`);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canManageItem ? (
                        <>
                          <Tooltip title="Edit item">
                            <IconButton
                              sx={{
                                background: gradientPrimary,
                                color: "#fff",
                                "&:hover": { opacity: 0.92 },
                              }}
                              onClick={() => {
                                navigate(`/inventory/${rowId}/edit`);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete item">
                            <IconButton
                              color="error"
                              sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                "&:hover": { borderColor: "error.main" },
                              }}
                              onClick={() => {
                                setDeleteTarget({
                                  id: rowId,
                                  title: params.row.title,
                                });
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : null}
                    </Stack>
                  );
                },
              },
            ]}
          />
        )}
      </Box>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete item"
        description={
          deleteTarget?.title
            ? `Delete ${deleteTarget.title}? This cannot be undone.`
            : "Delete this item? This cannot be undone."
        }
        confirmText="Delete"
        confirmColor="error"
        loading={deleteMut.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget?.id && deleteMut.mutate(deleteTarget.id)}
      />
      <ToastAlert
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
      <Outlet />
    </Box>
  );
}
