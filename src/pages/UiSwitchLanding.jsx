import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useNavigate, useSearchParams } from "react-router-dom";
import { consumeUiSwitchTicket } from "../services/authService";
import { persistUiSwitchSession } from "../utils/uiSwitch";

export default function UiSwitchLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Switching to selling…");

  useEffect(() => {
    let cancelled = false;
    const ticket = searchParams.get("ticket");

    const run = async () => {
      if (!ticket) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await consumeUiSwitchTicket(ticket);
        if (cancelled) return;
        persistUiSwitchSession(response);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        if (cancelled) return;
        setMessage(
          err?.response?.data?.message ||
            err.message ||
            "Could not switch to selling. Please sign in.",
        );
        setTimeout(() => navigate("/login", { replace: true }), 1400);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 3,
      }}
    >
      <CircularProgress />
      <Typography color="text.secondary" textAlign="center">
        {message}
      </Typography>
    </Box>
  );
}
