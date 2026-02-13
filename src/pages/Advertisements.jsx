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
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, Outlet } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAds } from "../services/advertService";
import { deleteListing } from "../services/listingService";
import { gradientPrimary } from "../theme/theme";
import ConfirmDialog from "../components/modals/ConfirmDialog";
import ToastAlert from "../components/alerts/ToastAlert";
import { useState } from "react";

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

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, (entity) => {
      switch (entity) {
        case "&nbsp;":
          return " ";
        case "&amp;":
          return "&";
        case "&quot;":
          return '"';
        case "&#39;":
          return "'";
        case "&lt;":
          return "<";
        case "&gt;":
          return ">";
        default:
          return " ";
      }
    })
    .replace(/\s+/g, " ")
    .trim();

export default function Advertisements() {
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
        await queryClient.invalidateQueries({ queryKey: ["adverts"] });
      } catch {
        // ignore
      }
      setToast({ open: true, severity: "success", message: "Advert deleted" });
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
    queryKey: ["adverts"],
    queryFn: () => getAds(),
    retry: false,
  });

  const adverts =
    apiData && Array.isArray(apiData)
      ? apiData
      : apiData?.listings ||
        apiData?.adverts ||
        apiData?.data ||
        apiData?.items ||
        [];

  const advertisementRows = (adverts || []).map((r) => {
    const id = r.listingId ?? r.listing_id ?? r.advertId ?? r.advert_id ?? r.id;
    return {
      id,
      ...r,
    };
  });

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
    { field: "title", headerName: "Title", width: 180 },
    {
      field: "subscriptionName",
      headerName: "Subscription",
      width: 180,
      renderCell: (params) => {
        const subs = params.row.sellerSubscriptions || [];
        const name = subs[0]?.subscription?.name || "-";
        return name;
      },
    },
    {
      field: "subscriptionTier",
      headerName: "Tier",
      width: 180,
      renderCell: (params) => {
        const subs = params.row.sellerSubscriptions || [];
        const subTier = subs[0]?.subscription?.pricingTiers?.[0];
        const tier =
          subTier ||
          params.row.pricingTier ||
          params.row.subscriptionTier ||
          params.row.tier ||
          null;
        const users = tier?.usersPerHour ?? params.row.usersPerHour;
        if (!users) return "-";
        return `${Number(users).toLocaleString("en-ZA")} users/hr`;
      },
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

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Advertisements</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            onClick={() => navigate("/inventory/add")}
            sx={{
              borderColor: "divider",
              color: "text.primary",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            Catalogue
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/advertisements/add")}
            sx={{
              background: gradientPrimary,
              color: "#fff",
              "&:hover": { opacity: 0.92 },
            }}
          >
            Add Advertisement
          </Button>
        </Stack>
      </Stack>

      <Box>
        {isPending ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <CustomDataGrid
            autoHeight
            rows={advertisementRows}
            getRowId={(row) =>
              row.listingId ??
              row.listing_id ??
              row.advertId ??
              row.advert_id ??
              row.id
            }
            columns={[
              ...columns,
              {
                field: "actions",
                headerName: "Actions",
                width: 140,
                sortable: false,
                renderCell: (params) => (
                  <Stack direction="row" spacing={1} alignItems="center">
                    {(() => {
                      const rowId =
                        params.row.advertId ??
                        params.row.advert_id ??
                        params.row.id ??
                        params.row.listingId ??
                        params.row.listing_id;
                      return (
                        <>
                          <Tooltip title="View advert">
                            <IconButton
                              sx={{
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                "&:hover": { borderColor: "primary.main" },
                              }}
                              onClick={() =>
                                navigate(`/advertisements/${rowId}`)
                              }
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit advert">
                            <IconButton
                              sx={{
                                background: gradientPrimary,
                                color: "#fff",
                                "&:hover": { opacity: 0.92 },
                              }}
                              onClick={() =>
                                navigate(`/advertisements/${rowId}/edit`)
                              }
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete advert">
                            <IconButton
                              color="error"
                              sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                "&:hover": { borderColor: "error.main" },
                              }}
                              onClick={() =>
                                setDeleteTarget({
                                  id: rowId,
                                  title: params.row.title,
                                })
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      );
                    })()}
                  </Stack>
                ),
              },
            ]}
          />
        )}
      </Box>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete advert"
        description={
          deleteTarget?.title
            ? `Delete ${deleteTarget.title}? This cannot be undone.`
            : "Delete this advert? This cannot be undone."
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
