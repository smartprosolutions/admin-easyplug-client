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
import { deleteListing, extractListings } from "../services/listingService";
import { gradientPrimary } from "../theme/theme";
import ConfirmDialog from "../components/modals/ConfirmDialog";
import AdminPasswordDialog from "../components/modals/AdminPasswordDialog";
import ToastAlert from "../components/alerts/ToastAlert";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useUserProfileQuery } from "../services/queries";
import {
  canManageRecord,
  needsAdminPasswordForRecord,
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
  const userRole = resolveUserRole(profileData);
  const isSeller = isSellerRole(userRole);
  const advertsQueryKey = isSeller
    ? ["sellerAdverts", currentUserId]
    : ["adverts"];
  const [adminPasswordError, setAdminPasswordError] = useState("");

  const deleteMut = useMutation({
    mutationFn: ({ id, adminPassword }) =>
      deleteListing(id, { adminPassword }),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: advertsQueryKey });
      } catch {
        // ignore
      }
      setToast({ open: true, severity: "success", message: "Advert deleted" });
      setDeleteTarget(null);
      setAdminPasswordError("");
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || err.message || "Delete failed";
      const code = err?.response?.data?.code;
      if (
        code === "ADMIN_PASSWORD_REQUIRED" ||
        code === "ADMIN_PASSWORD_INVALID" ||
        /admin password/i.test(message)
      ) {
        setAdminPasswordError(message);
        return;
      }
      setToast({
        open: true,
        severity: "error",
        message,
      });
      setDeleteTarget(null);
    },
  });

  const { data: apiData, isPending } = useQuery({
    queryKey: advertsQueryKey,
    queryFn: () => getAds(),
    retry: false,
  });

  const adverts = extractListings(apiData);

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
    { field: "title", headerName: "Campaign", width: 220, flex: 1.2 },
    {
      field: "schedule",
      headerName: "Schedule",
      width: 220,
      flex: 1,
      valueGetter: (_value, row) => {
        const start = row?.startsAt || row?.starts_at;
        const end = row?.expiresAt || row?.expires_at;
        if (!start && !end) return "No schedule";
        const startLabel = start ? formatDate(start) : "Anytime";
        const endLabel = end ? formatDate(end) : "No end";
        return `${startLabel} → ${endLabel}`;
      },
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "featuredCount",
      headerName: "Featured",
      width: 110,
      valueGetter: (_value, row) => {
        const ids = row?.featuredListingIds;
        if (Array.isArray(ids)) return ids.length;
        return Array.isArray(row?.catalogueItems) ? row.catalogueItems.length : 0;
      },
    },
    {
      field: "url",
      headerName: "Website",
      width: 160,
      valueGetter: (_value, row) =>
        row?.url || row?.advertUrl || row?.websiteURL || "",
      renderCell: (params) => (
        <Typography variant="body2" noWrap title={params.value || ""}>
          {params.value ? "Yes" : "—"}
        </Typography>
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
  ];

  const totalAds = advertisementRows.length;
  const activeAds = advertisementRows.filter(
    (r) => String(r.status || "").toLowerCase() === "active",
  ).length;
  const draftAds = advertisementRows.filter(
    (r) => String(r.status || "").toLowerCase() === "draft",
  ).length;
  const withWebsite = advertisementRows.filter(
    (r) => Boolean(String(r.url || r.advertUrl || r.websiteURL || "").trim()),
  ).length;

  const advertCards = [
    {
      label: "Total Campaigns",
      value: totalAds.toLocaleString("en-ZA"),
      sub: "All advertisement campaigns",
      accent: "primary.main",
    },
    {
      label: "Active Campaigns",
      value: activeAds.toLocaleString("en-ZA"),
      sub: "Currently published",
      accent: "success.main",
    },
    {
      label: "Draft Campaigns",
      value: draftAds.toLocaleString("en-ZA"),
      sub: "Not yet published",
      accent: "warning.main",
    },
    {
      label: "With Website",
      value: withWebsite.toLocaleString("en-ZA"),
      sub: "Campaigns with a URL CTA",
      accent: "secondary.main",
    },
  ];

  if (isSeller) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          px: 3,
          p: { xs: 1.25, sm: 2, md: 3 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            maxWidth: 480,
            width: "100%",
          }}
        >
          <Typography variant="h2" sx={{ mb: 1.5, lineHeight: 1 }}>
            📢
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
            Advertisements — Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            Advertisement management for sellers is being prepared and will be available shortly. Check back soon!
          </Typography>
        </Paper>
      </Box>
    );
  }

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
            Manage adverts and campaigns
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
            Add Campaign
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.2 }}>
          Campaign Overview
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
              const canManageItem = canManageRecord(
                item,
                currentUserId,
                userRole,
              );
              const needsPassword = needsAdminPasswordForRecord(
                item,
                currentUserId,
                userRole,
              );

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
                      <Chip
                        size="small"
                        label={
                          item?.expiresAt || item?.expires_at || item?.startsAt
                            ? "Scheduled"
                            : "Campaign"
                        }
                      />
                      <Chip size="small" color="info" label="Ad" />
                    </Stack>

                    <Typography fontSize={12} color="text.secondary">
                      {item.startsAt || item.expiresAt
                        ? `${item.startsAt ? formatDate(item.startsAt) : "Anytime"} → ${
                            item.expiresAt || item.expires_at
                              ? formatDate(item.expiresAt || item.expires_at)
                              : "No end"
                          }`
                        : `Updated: ${formatDate(item.updatedAt ?? item.updated_at)}`}
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
                                needsPassword,
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
                      const canManageItem = canManageRecord(
                        params.row,
                        currentUserId,
                        userRole,
                      );
                      const needsPassword = needsAdminPasswordForRecord(
                        params.row,
                        currentUserId,
                        userRole,
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
                                      needsPassword,
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
        open={Boolean(deleteTarget) && !deleteTarget?.needsPassword}
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
        onConfirm={() =>
          deleteTarget?.id && deleteMut.mutate({ id: deleteTarget.id })
        }
      />
      <AdminPasswordDialog
        open={Boolean(deleteTarget?.needsPassword)}
        title="Delete advert"
        description={
          deleteTarget?.title
            ? `Enter your admin password to delete "${deleteTarget.title}".`
            : "Enter your admin password to delete this advert."
        }
        confirmText="Delete"
        loading={deleteMut.isPending}
        error={adminPasswordError}
        onClose={() => {
          setDeleteTarget(null);
          setAdminPasswordError("");
        }}
        onConfirm={(adminPassword) =>
          deleteTarget?.id &&
          deleteMut.mutate({ id: deleteTarget.id, adminPassword })
        }
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
