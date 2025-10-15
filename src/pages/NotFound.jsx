import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        minWidth: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2
      }}
    >
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            maxWidth: 1000,
            width: "100%"
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h1" sx={{ fontWeight: 800, fontSize: 72 }}>
              404
            </Typography>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Page not found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              We couldn't find the page you're looking for. It may have been
              removed or the URL is incorrect.
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="contained" onClick={() => navigate("/")}>
                Go home
              </Button>
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Go back
              </Button>
            </Box>
          </Box>

          <Box sx={{ width: 360, flexShrink: 0 }} aria-hidden>
            {/* Illustrative SVG (public domain style) */}
            <svg
              viewBox="0 0 600 400"
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100%" height="100%" fill="#f4f6fb" rx="16" />
              <g transform="translate(60,40)">
                <circle cx="200" cy="120" r="72" fill="#eef2ff" />
                <path
                  d="M20 260 C100 180 300 200 380 140"
                  stroke="#dbeafe"
                  strokeWidth="18"
                  fill="none"
                  strokeLinecap="round"
                />
                <g transform="translate(140,60)">
                  <rect
                    x="0"
                    y="0"
                    width="180"
                    height="120"
                    rx="12"
                    fill="#fff"
                    stroke="#e6e9f2"
                  />
                  <circle cx="36" cy="36" r="20" fill="#667eea" />
                  <rect
                    x="72"
                    y="24"
                    width="88"
                    height="14"
                    rx="6"
                    fill="#eef2ff"
                  />
                  <rect
                    x="72"
                    y="52"
                    width="120"
                    height="10"
                    rx="5"
                    fill="#f3f5fb"
                  />
                </g>
              </g>
            </svg>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
