import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Typography,
  Rating,
  IconButton,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export function ListingTile({ listing, onClick }) {
  const safeListing = listing || {};
  const images =
    Array.isArray(safeListing.images) && safeListing.images.length > 0
      ? safeListing.images
      : safeListing.image
        ? [safeListing.image]
        : [];
  const [index, setIndex] = React.useState(0);
  const safeIndex = images.length > 0 ? index % images.length : 0;
  const currentImage = images[safeIndex] || "https://via.placeholder.com/500";

  const handlePrev = (event) => {
    event.stopPropagation();
    if (images.length < 2) return;
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (event) => {
    event.stopPropagation();
    if (images.length < 2) return;
    setIndex((prev) => (prev + 1) % images.length);
  };

  if (!listing) return null;

  return (
    <Card
      onClick={onClick}
      role={onClick ? "button" : undefined}
      sx={{
        borderRadius: 2.5,
        overflow: "hidden",
        boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
        border: "1px solid",
        borderColor: "divider",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          transform: onClick ? "translateY(-2px)" : "none",
          boxShadow: onClick
            ? "0 14px 30px rgba(0,0,0,0.14)"
            : "0 10px 24px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          height="180"
          image={currentImage}
          alt={safeListing.title}
          sx={{ objectFit: "cover" }}
        />
        <Chip
          size="small"
          label={safeListing.category || "Listing"}
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            bgcolor: "rgba(255,255,255,0.9)",
            fontWeight: 600,
          }}
        />
        {images.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={handlePrev}
              sx={{
                bgcolor: "rgba(0,0,0,0.45)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleNext}
              sx={{
                bgcolor: "rgba(0,0,0,0.45)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        {images.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 0.6,
            }}
          >
            {images.map((_, dotIndex) => (
              <Box
                key={dotIndex}
                sx={{
                  width: dotIndex === safeIndex ? 10 : 6,
                  height: 6,
                  borderRadius: 999,
                  bgcolor:
                    dotIndex === safeIndex
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.5)",
                  transition: "all 120ms ease",
                }}
              />
            ))}
          </Box>
        )}
      </Box>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {safeListing.title}
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {safeListing.price}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Rating
              value={Number(safeListing.rating) || 0}
              size="small"
              readOnly
            />
            <Typography variant="caption" color="text.secondary">
              {Number(safeListing.reviews) > 0
                ? `(${Number(safeListing.reviews)})`
                : "(0)"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationOnOutlinedIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary" noWrap>
              {safeListing.location}
            </Typography>
            {safeListing.verified && (
              <Chip
                size="small"
                color="success"
                icon={<VerifiedIcon />}
                label="Verified"
                sx={{ ml: "auto" }}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {safeListing.timeAgo}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
