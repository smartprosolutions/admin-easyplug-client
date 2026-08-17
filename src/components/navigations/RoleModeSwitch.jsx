import React, { useState } from "react";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { switchToMarketplace } from "../../utils/uiSwitch";

export default function RoleModeSwitch({ compact = false, vertical = false }) {
  const [pending, setPending] = useState(false);

  const handleChange = async (_event, value) => {
    if (value !== "shopping" || pending) return;
    setPending(true);
    try {
      await switchToMarketplace();
    } catch (err) {
      console.error("Failed to switch to shopping:", err);
      setPending(false);
    }
  };

  return (
    <Box sx={{ width: "100%", px: compact ? 0 : 0.5 }}>
      {!compact && !vertical && (
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
            color: "text.secondary",
            mb: 0.75,
            textTransform: "uppercase",
          }}
        >
          Mode
        </Typography>
      )}
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        orientation={vertical ? "vertical" : "horizontal"}
        value="selling"
        onChange={handleChange}
        disabled={pending}
        sx={{
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          borderRadius: 2,
          p: 0.35,
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 700,
            fontSize: vertical ? 11 : 12,
            border: 0,
            borderRadius: 1.6,
            py: 0.65,
          },
          "& .Mui-selected": {
            bgcolor: (theme) => `${theme.palette.background.paper} !important`,
            color: "primary.main",
            boxShadow: "0 1px 6px rgba(15,23,42,0.12)",
          },
        }}
      >
        <ToggleButton value="shopping">
          {pending ? "Opening…" : "Shopping"}
        </ToggleButton>
        <ToggleButton value="selling">Selling</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
