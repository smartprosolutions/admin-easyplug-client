import React from "react";
import { Box, Stack, Typography, Paper } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

/**
 * Renders shopper + lister referral QR codes when URLs are available.
 */
export default function ReferralQrCodes({
  shopperUrl,
  listerUrl,
  size = 128,
}) {
  const shopper = String(shopperUrl || "").trim();
  const lister = String(listerUrl || "").trim();
  if (!shopper && !lister) return null;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{ mt: 2 }}
      flexWrap="wrap"
    >
      {shopper ? (
        <QrCard label="Shopper QR" value={shopper} size={size} />
      ) : null}
      {lister ? <QrCard label="Lister QR" value={lister} size={size} /> : null}
    </Stack>
  );
}

function QrCard({ label, value, size }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        bgcolor: "#fff",
      }}
    >
      <Typography fontSize={12} fontWeight={700} color="text.secondary">
        {label}
      </Typography>
      <Box
        sx={{
          p: 1,
          bgcolor: "#fff",
          lineHeight: 0,
          borderRadius: 1,
        }}
      >
        <QRCodeSVG value={value} size={size} level="M" includeMargin={false} />
      </Box>
      <Typography
        fontSize={10}
        color="text.secondary"
        sx={{
          maxWidth: size + 24,
          textAlign: "center",
          wordBreak: "break-all",
        }}
      >
        Scan to open
      </Typography>
    </Paper>
  );
}
