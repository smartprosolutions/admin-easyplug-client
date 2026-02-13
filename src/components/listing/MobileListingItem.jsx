import React from "react";
import { Box, Chip, Stack, Typography, IconButton } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export function MobileListingItem({ listing, onClick }) {
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
    <Box
      onClick={onClick}
      role={onClick ? "button" : undefined}
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
        cursor: onClick ? "pointer" : "default",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Box
          component="img"
          src={currentImage}
          alt={safeListing.title}
          sx={{ width: "100%", height: 140, objectFit: "cover" }}
        />
        <Chip
          size="small"
          label={safeListing.category || "Listing"}
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
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
              px: 0.5,
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
              bottom: 6,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 0.5,
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
      <Stack spacing={0.5} sx={{ p: 1.25 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap>
          {safeListing.title}
        </Typography>
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {safeListing.price}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
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
    </Box>
  );
}
