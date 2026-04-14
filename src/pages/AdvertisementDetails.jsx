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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdvert } from "../services/advertService";
import { gradientPrimary } from "../theme/theme";
import InventoryModal from "../components/modals/InventoryModal";
import { ListingTile } from "../components/listing/ListingTile";
import { MobileListingItem } from "../components/listing/MobileListingItem";
import { resolveListingImages } from "../utils/listingImages";

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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCatalogueOpen, setIsCatalogueOpen] = React.useState(false);

  const { data, isPending, error } = useQuery({
    queryKey: ["advert", id],
    queryFn: () => getAdvert(id),
    enabled: Boolean(id),
    retry: false,
  });

  const advert =
    data?.advert ||
    data?.advertisement ||
    data?.listing ||
    data?.data ||
    data ||
    null;

  const catalogueItems = useMemo(
    () => advert?.catalogueItems || advert?.items || advert?.listings || [],
    [advert],
  );

  const subscriptions = advert?.sellerSubscriptions || [];
  const subscriptionName = subscriptions[0]?.subscription?.name || "-";
  const subTier = subscriptions[0]?.subscription?.pricingTiers?.[0];
  const tierUsers = subTier?.usersPerHour || "-";
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

  const formattedCatalogueItems = useMemo(() => {
    if (!Array.isArray(catalogueItems)) return [];
    return catalogueItems.map((item) => {
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
  }, [catalogueItems, sellerEmail]);

  return (
    <Box sx={{ p: 3 }}>
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
              Advert Details
            </Typography>
            <Chip
              size="small"
              label={advert?.status || "-"}
              color={statusColor(advert?.status)}
              variant="outlined"
            />
          </Stack>
        </Stack>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/advertisements/${id}/edit`)}
          sx={{
            background: gradientPrimary,
            color: "#fff",
            "&:hover": { opacity: 0.92 },
          }}
        >
          Edit Advert
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error">
          Failed to load advert. {error?.message || "Please try again."}
        </Alert>
      ) : isPending ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : !advert ? (
        <Alert severity="warning">Advert not found.</Alert>
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
                Basic Information
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              <InfoCard label="Title" value={advert.title} />
              <InfoCard label="Type" value={advert.type} />
              <InfoCard label="Category" value={advert.category} />
              <InfoCard label="Seller" value={sellerName} />
              <InfoCard label="Seller Email" value={sellerEmail || "-"} />
              <InfoCard label="Created" value={formatDate(advert.createdAt)} />
              <InfoCard label="Updated" value={formatDate(advert.updatedAt)} />
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
                Subscription Information
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              <InfoCard label="Subscription" value={subscriptionName} />
              <InfoCard
                label="Tier"
                value={
                  tierUsers !== "-"
                    ? `${Number(tierUsers).toLocaleString("en-ZA")} users/hr`
                    : "-"
                }
              />
              <InfoCard label="Status" value={advert.status} />
              <InfoCard label="Views" value={advert.views} />
              <InfoCard label="Price" value={advert.price} />
              <InfoCard label="Condition" value={advert.condition} />
              <InfoCard
                label="Description"
                value={stripHtml(advert.description) || "No description"}
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12 }}>
            {hasAdvertUrl ? (
              <>
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
                    URL
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
                  {hasAdvertUrl ? (
                    <Stack spacing={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        This advert uses an external URL.
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ wordBreak: "break-all" }}
                      >
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
                          Open URL
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No URL configured for this advert.
                    </Typography>
                  )}
                </Paper>
              </>
            ) : (
              <>
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
                    Catalogue Items
                  </Typography>
                </Stack>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  spacing={2}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {Array.isArray(catalogueItems)
                        ? `${catalogueItems.length} item(s) linked to this advert`
                        : "No items linked"}
                    </Typography>
                  </Box>
                  {!hasAdvertUrl && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setIsCatalogueOpen(true)}
                      sx={{
                        background: gradientPrimary,
                        color: "#fff",
                        "&:hover": { opacity: 0.92 },
                      }}
                    >
                      Add Catalogue Item
                    </Button>
                  )}
                </Stack>
                <Divider sx={{ my: 2 }} />
                {formattedCatalogueItems.length > 0 ? (
                  <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                    {formattedCatalogueItems.map((item) => (
                      <Grid
                        item
                        size={{ xs: 6, sm: 6, md: 4, lg: 3, xl: 2.4 }}
                        key={item.id}
                      >
                        {isMobile ? (
                          <MobileListingItem listing={item} />
                        ) : (
                          <ListingTile listing={item} />
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
                      No catalogue items yet. Add one to showcase this advert.
                    </Typography>
                  </Paper>
                )}
              </>
            )}
          </Grid>
        </Grid>
      )}
      {isCatalogueOpen && (
        <InventoryModal
          onClose={() => setIsCatalogueOpen(false)}
          redirectPath={null}
          presetType={advert?.type}
          presetCategory={advert?.category}
          lockTypeCategory
          advertId={id}
        />
      )}
    </Box>
  );
}
