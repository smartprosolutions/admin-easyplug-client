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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, Outlet } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteListing, getAdminListings } from "../services/listingService";
import { gradientPrimary } from "../theme/theme";
import ConfirmDialog from "../components/modals/ConfirmDialog";
import ToastAlert from "../components/alerts/ToastAlert";
import { useState } from "react";

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
        minute: "2-digit"
      })
    : "";

export default function Inventory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    severity: "info",
    message: "",
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteListing(id),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["adminListings"] });
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
    queryKey: ["adminListings"],
    queryFn: () => getAdminListings(),
    retry: false
  });

  // The API may return { listings: [...] } or an array directly. Normalize.
  const listings =
    apiData && Array.isArray(apiData)
      ? apiData
      : apiData && Array.isArray(apiData?.listings)
      ? apiData.listings
      : apiData?.data || [];

  // Use camelCase API fields when available. Ensure DataGrid `id` is set to listingId.
  const rows = (listings || []).map((r) => {
    const id = r.listingId ?? r.listing_id ?? r.id;
    return {
      id,
      ...r
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
      headerAlign: "right"
    },
    {
      field: "isAdvertisement",
      headerName: "Ad",
      width: 120,
      renderCell: (params) =>
        params.row.isAdvertisement ?? params.row.is_advertisement ? (
          <Chip size="small" label="Ad" color="info" />
        ) : (
          <Chip size="small" label="Standard" />
        )
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
      )
    },

    {
      field: "createdAt",
      headerName: "Created",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">
            {formatDate(
              params.value ?? params.row.createdAt ?? params.row.created_at
            )}
          </Typography>
        </Box>
      )
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">
            {formatDate(
              params.value ?? params.row.updatedAt ?? params.row.updated_at
            )}
          </Typography>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage inventory items and availability
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/inventory/add")}
          sx={{
            background: gradientPrimary,
            color: "#fff",
            "&:hover": { opacity: 0.92 }
          }}
        >
          Add Item
        </Button>
      </Stack>

      <Box>
  {isPending ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <CustomDataGrid
            autoHeight
            rows={rows}
            columns={[
              ...columns,
              {
                field: "actions",
                headerName: "Actions",
                width: 120,
                sortable: false,
                renderCell: (params) => (
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
                          const rowId =
                            params.row.listingId ??
                            params.row.listing_id ??
                            params.row.id;
                          navigate(`/inventory/${rowId}/edit`);
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
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
                          const rowId =
                            params.row.listingId ??
                            params.row.listing_id ??
                            params.row.id;
                          setDeleteTarget({
                            id: rowId,
                            title: params.row.title,
                          });
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )
              }
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
