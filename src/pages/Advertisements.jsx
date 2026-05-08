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
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useUserProfileQuery } from "../services/queries";
import {
  isOwnedByUser,
  isSellerRole,
  resolveUserId,
  resolveUserRole,
} from "../utils/accessControl";

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

export default function Advertisements() {
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
  const advertsQueryKey = isSeller
    ? ["sellerAdverts", currentUserId]
    : ["adverts"];

  const deleteMut = useMutation({
    mutationFn: (id) => deleteListing(id),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: advertsQueryKey });
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
    queryKey: advertsQueryKey,
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

  const scopedAdverts = isSeller
    ? (adverts || []).filter((item) => isOwnedByUser(item, currentUserId))
    : adverts || [];

  const advertisementRows = scopedAdverts.map((r) => {
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
    { field: "title", headerName: "Title", width: 180, flex: 1 },
    { field: "category", headerName: "Category", width: 170, flex: 1 },

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
      flex: 1,
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
      flex: 1,
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

  const totalAds = advertisementRows.length;
  const activeAds = advertisementRows.filter(
    (r) => String(r.status || "").toLowerCase() === "active",
  ).length;
  const draftAds = advertisementRows.filter(
    (r) => String(r.status || "").toLowerCase() === "draft",
  ).length;

  const uniqueCategories = new Set(
    advertisementRows.map((row) => String(row.category || "Uncategorized").trim()),
  ).size;

  const advertCards = [
    {
      label: "Total Adverts",
      value: totalAds.toLocaleString("en-ZA"),
      sub: "All advertisement listings",
      accent: "primary.main",
    },
    {
      label: "Active Adverts",
      value: activeAds.toLocaleString("en-ZA"),
      sub: "Currently live campaigns",
      accent: "success.main",
    },
    {
      label: "Draft Adverts",
      value: draftAds.toLocaleString("en-ZA"),
      sub: "Not yet published",
      accent: "warning.main",
    },
    {
      label: "Categories",
      value: uniqueCategories.toLocaleString("en-ZA"),
      sub: "Distinct advert categories",
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
            Advertisements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSeller
              ? "Manage your adverts and campaigns"
              : "Manage adverts and campaigns"}
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ width: { xs: "100%", sm: "auto" }, mt: { xs: 0.5, sm: 0 } }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/advertisements/add")}
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
            Add Advertisement
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.2 }}>
          Advert Overview
        </Typography>
        <Grid container spacing={1.5}>
          {advertCards.map((card) => (
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
            {advertisementRows.map((item) => {
              const rowId =
                item.advertId ??
                item.advert_id ??
                item.id ??
                item.listingId ??
                item.listing_id;
              const canManageItem = isOwnedByUser(item, currentUserId);

              return (
                <Paper
                  key={rowId}
                  variant="outlined"
                  sx={{ p: 1.4, borderRadius: 2.2 }}
                >
                  <Stack spacing={0.9}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography fontSize={14} fontWeight={700} noWrap>
                        {item.title || "Untitled advert"}
                      </Typography>
                      <Chip
                        size="small"
                        label={item.status || "-"}
                        color={statusColor(item.status)}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ flexWrap: "wrap", rowGap: 0.75 }}
                    >
                      <Chip size="small" label={item?.category || "Uncategorized"} />
                      <Chip size="small" color="info" label="Ad" />
                    </Stack>

                    <Typography fontSize={12} color="text.secondary">
                      Updated: {formatDate(item.updatedAt ?? item.updated_at)}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      justifyContent="flex-end"
                    >
                      <IconButton
                        size="small"
                        sx={{ border: "1px solid", borderColor: "divider" }}
                        onClick={() => navigate(`/advertisements/${rowId}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {canManageItem ? (
                        <>
                          <IconButton
                            size="small"
                            sx={{ background: gradientPrimary, color: "#fff" }}
                            onClick={() =>
                              navigate(`/advertisements/${rowId}/edit`)
                            }
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
                      const canManageItem = isOwnedByUser(
                        params.row,
                        currentUserId,
                      );
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
                          {canManageItem ? (
                            <>
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
                          ) : null}
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
