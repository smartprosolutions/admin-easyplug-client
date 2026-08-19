import React, { useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdvert, setAdvertFeatured } from "../services/advertService";
import { getMyListings } from "../services/listingService";
import { gradientPrimary } from "../theme/theme";
import { ListingTile } from "../components/listing/ListingTile";
import { MobileListingItem } from "../components/listing/MobileListingItem";
import { resolveListingImages } from "../utils/listingImages";
import ToastAlert from "../components/alerts/ToastAlert";
import { useUserProfileQuery } from "../services/queries";
import {
  canManageRecord,
  needsAdminPasswordForRecord,
  isOwnedByUser,
  isSellerRole,
  resolveUserId,
  resolveUserRole,
} from "../utils/accessControl";
import AdminPasswordDialog from "../components/modals/AdminPasswordDialog";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Checkbox from "@mui/material/Checkbox";

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

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

const InfoCard = ({ label, value }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 2,
      borderColor: "divider",
      boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
      {value || "-"}
    </Typography>
  </Paper>
);

export default function AdvertisementDetails() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [featureDialogOpen, setFeatureDialogOpen] = React.useState(false);
  const [selectedFeatured, setSelectedFeatured] = React.useState([]);
  const [toast, setToast] = React.useState({
    open: false,
    severity: "info",
    message: "",
  });
  const { data: profileData } = useUserProfileQuery({ retry: false });
  const currentUserId = resolveUserId(profileData);
  const userRole = resolveUserRole(profileData);
  const isSeller = isSellerRole(userRole);

  const { data, isPending, error } = useQuery({
    queryKey: ["advert", id],
    queryFn: () => getAdvert(id),
    enabled: Boolean(id),
    retry: false,
  });

  const { data: inventoryData, isPending: isInventoryLoading } = useQuery({
    queryKey: ["myInventoryForFeature", currentUserId],
    queryFn: () => getMyListings(),
    enabled: featureDialogOpen && Boolean(currentUserId),
    retry: false,
  });

  const advert =
    data?.advert ||
    data?.advertisement ||
    data?.listing ||
    data?.data ||
    data ||
    null;

  const canViewAdvert = !isSeller || isOwnedByUser(advert, currentUserId);
  const canManageAdvert = canManageRecord(advert, currentUserId, userRole);
  const needsAdminPassword = needsAdminPasswordForRecord(
    advert,
    currentUserId,
    userRole,
  );
  const [featurePasswordOpen, setFeaturePasswordOpen] = React.useState(false);
  const [featurePasswordError, setFeaturePasswordError] = React.useState("");
  const pendingFeaturedIdsRef = React.useRef(null);

  const featuredItems = useMemo(() => {
    const featured =
      data?.featuredListings ||
      advert?.featuredListings ||
      [];
    if (Array.isArray(featured) && featured.length > 0) return featured;
    // Legacy fallback: catalogue children
    return advert?.catalogueItems || advert?.items || advert?.listings || [];
  }, [advert, data?.featuredListings]);

  const advertUrl =
    advert?.url ||
    advert?.advertUrl ||
    advert?.websiteURL ||
    advert?.link ||
    "";
  const hasAdvertUrl = Boolean(String(advertUrl || "").trim());

  const sellerName = advert?.seller
    ? `${advert.seller.firstName || ""} ${advert.seller.lastName || ""}`.trim()
    : "-";
  const sellerEmail = advert?.seller?.email || "";

  const inventoryOptions = useMemo(() => {
    const rows =
      inventoryData?.listings ||
      inventoryData?.data ||
      inventoryData?.items ||
      (Array.isArray(inventoryData) ? inventoryData : []);
    return (rows || [])
      .filter((row) => !row?.isAdvertisement)
      .filter((row) => isOwnedByUser(row, currentUserId))
      .sort((a, b) =>
        String(a?.title || "").localeCompare(String(b?.title || "")),
      );
  }, [inventoryData, currentUserId]);

  const formattedFeaturedItems = useMemo(() => {
    if (!Array.isArray(featuredItems)) return [];
    return featuredItems.map((item) => {
      const createdAt = item?.createdAt || item?.created_at;
      const createdDate = createdAt ? new Date(createdAt) : null;
      const now = new Date();
      const diffMs = createdDate ? now - createdDate : 0;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      let timeAgo = "Just now";
      if (diffDays > 0) timeAgo = `${diffDays}d ago`;
      else if (diffHours > 0) timeAgo = `${diffHours}h ago`;

      const priceValue = item?.price ?? item?.amount;
      const priceText =
        priceValue !== undefined && priceValue !== null && priceValue !== ""
          ? `R ${Number(priceValue).toLocaleString("en-ZA")}`
          : "-";

      const images = resolveListingImages(item, {
        sellerEmail,
        variant: "catalogue",
      });
      const image = images[0];

      return {
        id: item?.listingId || item?.id,
        title: item?.title || item?.name || "Untitled",
        price: priceText,
        category: item?.category || "",
        image: image || "https://via.placeholder.com/500",
        images,
        rating: item?.sellerRating?.average || 0,
        reviews: item?.sellerRating?.count || 0,
        location:
          item?.seller?.address?.city ||
          item?.seller?.address?.suburb ||
          "South Africa",
        timeAgo,
        verified: item?.seller?.sellerInfo?.verified || false,
      };
    });
  }, [featuredItems, sellerEmail]);

  const featureMut = useMutation({
    mutationFn: ({ listingIds, adminPassword }) =>
      setAdvertFeatured(id, listingIds, { adminPassword }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["advert", id] });
      setFeatureDialogOpen(false);
      setFeaturePasswordOpen(false);
      setFeaturePasswordError("");
      pendingFeaturedIdsRef.current = null;
      setToast({
        open: true,
        severity: "success",
        message: "Featured listings updated",
      });
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to update featured listings";
      const code = err?.response?.data?.code;
      if (
        code === "ADMIN_PASSWORD_REQUIRED" ||
        code === "ADMIN_PASSWORD_INVALID" ||
        /admin password/i.test(message)
      ) {
        setFeaturePasswordError(message);
        setFeaturePasswordOpen(true);
        return;
      }
      setToast({
        open: true,
        severity: "error",
        message,
      });
    },
  });

  const openFeatureDialog = () => {
    const currentIds = Array.isArray(advert?.featuredListingIds)
      ? advert.featuredListingIds.map(String)
      : featuredItems.map((row) => String(row.listingId || row.id));
    setSelectedFeatured(
      inventoryOptions.filter((row) =>
        currentIds.includes(String(row.listingId || row.id)),
      ),
    );
    setFeatureDialogOpen(true);
  };

  React.useEffect(() => {
    if (!featureDialogOpen || inventoryOptions.length === 0) return;
    const currentIds = Array.isArray(advert?.featuredListingIds)
      ? advert.featuredListingIds.map(String)
      : featuredItems.map((row) => String(row.listingId || row.id));
    setSelectedFeatured(
      inventoryOptions.filter((row) =>
        currentIds.includes(String(row.listingId || row.id)),
      ),
    );
  }, [
    featureDialogOpen,
    inventoryOptions,
    advert?.featuredListingIds,
    featuredItems,
  ]);

  return (
    <Box sx={{ p: { xs: 1.25, sm: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        mb={3}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/advertisements")}
          >
            Back
          </Button>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                background: gradientPrimary,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Campaign Details
            </Typography>
            <Chip
              size="small"
              label={advert?.status || "-"}
              color={statusColor(advert?.status)}
              variant="outlined"
            />
          </Stack>
        </Stack>
        {canManageAdvert ? (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/advertisements/${id}/edit`)}
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
              "&:hover": {
                opacity: { xs: 0.95, sm: 0.92 },
                boxShadow: "none",
              },
            }}
          >
            Edit Campaign
          </Button>
        ) : null}
      </Stack>

      {error ? (
        <Alert severity="error">
          Failed to load campaign. {error?.message || "Please try again."}
        </Alert>
      ) : isPending ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : !advert ? (
        <Alert severity="warning">Campaign not found.</Alert>
      ) : !canViewAdvert ? (
        <Alert severity="warning">
          You can only access campaigns that belong to your seller account.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <InfoOutlinedIcon color="primary" fontSize="small" />
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  background: gradientPrimary,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Campaign
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              <InfoCard label="Title" value={advert.title} />
              <InfoCard label="Seller" value={sellerName} />
              <InfoCard label="Seller Email" value={sellerEmail || "-"} />
              <InfoCard
                label="Promo copy"
                value={stripHtml(advert.description) || "No promo copy"}
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <LocalOfferOutlinedIcon color="primary" fontSize="small" />
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  background: gradientPrimary,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Schedule & status
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              <InfoCard label="Status" value={advert.status} />
              <InfoCard label="Views" value={advert.views} />
              <InfoCard
                label="Starts"
                value={formatDate(advert.startsAt || advert.starts_at)}
              />
              <InfoCard
                label="Ends"
                value={formatDate(advert.expiresAt || advert.expires_at)}
              />
              <InfoCard label="Created" value={formatDate(advert.createdAt)} />
              <InfoCard label="Updated" value={formatDate(advert.updatedAt)} />
            </Stack>
          </Grid>

          {hasAdvertUrl ? (
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <LocalOfferOutlinedIcon color="primary" fontSize="small" />
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    background: gradientPrimary,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Website URL
                </Typography>
              </Stack>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  borderColor: "divider",
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {advertUrl}
                  </Typography>
                  <Box>
                    <Button
                      component="a"
                      href={advertUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      sx={{
                        background: gradientPrimary,
                        color: "#fff",
                        "&:hover": { opacity: 0.92 },
                      }}
                    >
                      Visit website
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ) : null}

          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <LocalOfferOutlinedIcon color="primary" fontSize="small" />
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  background: gradientPrimary,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Featured Listings
              </Typography>
            </Stack>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Typography variant="body2" color="text.secondary">
                {`${formattedFeaturedItems.length} listing(s) featured on this campaign`}
              </Typography>
              {canManageAdvert ? (
                <Button
                  variant="contained"
                  onClick={openFeatureDialog}
                  sx={{
                    background: gradientPrimary,
                    color: "#fff",
                    "&:hover": { opacity: 0.92 },
                  }}
                >
                  Manage featured items
                </Button>
              ) : null}
            </Stack>
            <Divider sx={{ my: 2 }} />
            {formattedFeaturedItems.length > 0 ? (
              <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                {formattedFeaturedItems.map((item) => (
                  <Grid
                    item
                    size={{ xs: 6, sm: 6, md: 4, lg: 3, xl: 2.4 }}
                    key={item.id}
                  >
                    {isMobile ? (
                      <MobileListingItem
                        listing={item}
                        onClick={() => navigate(`/inventory/${item.id}/edit`)}
                      />
                    ) : (
                      <ListingTile
                        listing={item}
                        onClick={() => navigate(`/inventory/${item.id}/edit`)}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  borderStyle: "dashed",
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                <Typography variant="body2">
                  No featured listings yet. Promote items from My Listings,
                  or leave empty for a website/brand campaign.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      <Dialog
        open={featureDialogOpen}
        onClose={() =>
          featureMut.isPending ? undefined : setFeatureDialogOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Feature listings</DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ mt: 1 }}
            multiple
            disableCloseOnSelect
            options={inventoryOptions}
            value={selectedFeatured}
            loading={isInventoryLoading}
            noOptionsText={
              isInventoryLoading
                ? "Loading listings..."
                : "No listings available to promote"
            }
            getOptionLabel={(option) =>
              option?.title ||
              option?.name ||
              String(option?.listingId || option?.id || "")
            }
            isOptionEqualToValue={(option, value) =>
              String(option?.listingId || option?.id) ===
              String(value?.listingId || value?.id)
            }
            onChange={(_, selected) => setSelectedFeatured(selected)}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox
                    icon={checkboxIcon}
                    checkedIcon={checkboxCheckedIcon}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {option?.title || option?.name || "Untitled"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                    >
                      {[option?.category, option?.type]
                        .filter(Boolean)
                        .join(" · ") || "Listing"}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Items to promote"
                placeholder="Pick one or more listings"
                helperText={`${selectedFeatured.length} selected`}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFeatureDialogOpen(false)}
            disabled={featureMut.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={featureMut.isPending}
            onClick={() => {
              const listingIds = selectedFeatured.map((row) =>
                String(row.listingId || row.id),
              );
              if (needsAdminPassword) {
                pendingFeaturedIdsRef.current = listingIds;
                setFeaturePasswordError("");
                setFeaturePasswordOpen(true);
                return;
              }
              featureMut.mutate({ listingIds });
            }}
            sx={{ background: gradientPrimary, color: "#fff" }}
          >
            {featureMut.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <AdminPasswordDialog
        open={featurePasswordOpen}
        title="Update featured items"
          description="Enter your admin password to update featured listings on this campaign."
        confirmText="Save"
        loading={featureMut.isPending}
        error={featurePasswordError}
        onClose={() => {
          setFeaturePasswordOpen(false);
          setFeaturePasswordError("");
          pendingFeaturedIdsRef.current = null;
        }}
        onConfirm={(adminPassword) => {
          const listingIds = pendingFeaturedIdsRef.current || [];
          featureMut.mutate({ listingIds, adminPassword });
        }}
      />

      <ToastAlert
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />
    </Box>
  );
}
