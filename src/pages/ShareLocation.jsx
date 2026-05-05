import "leaflet/dist/leaflet.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import StopIcon from "@mui/icons-material/Stop";
import PeopleIcon from "@mui/icons-material/People";
import {
  createLocationShare,
  stopLocationShare,
} from "../services/locationShareService";

// Fix default Leaflet marker icons (Vite asset handling)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL(
    "leaflet/dist/images/marker-shadow.png",
    import.meta.url,
  ).href,
});

const SOCKET_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/api\/v\d+$/, "");

const CLIENT_BASE_URL =
  import.meta.env.VITE_CLIENT_BASE_URL || window.location.origin;

const DURATIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 },
  { label: "2 hr", value: 120 },
];

function formatCountdown(ms) {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ShareLocation() {
  const [duration, setDuration] = useState(15);
  const [session, setSession] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [ownerPos, setOwnerPos] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const remaining = new Date(session.expiresAt) - Date.now();
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    setCountdown(new Date(session.expiresAt) - Date.now());
    return () => clearInterval(interval);
  }, [session]);

  const startWatchingPosition = useCallback((sock) => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const pos = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        };
        setOwnerPos(pos);
        sock.emit("pos:update", pos);
      },
      (err) => console.warn("[geolocation]", err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  }, []);

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await createLocationShare(duration);
      const url = `${CLIENT_BASE_URL}/location/${data.token}`;
      setShareUrl(url);
      setSession({ token: data.token, expiresAt: data.expiresAt });

      const rawToken =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        "";
      const authToken = String(rawToken)
        .replace(/^"|"$/g, "")
        .replace(/^Bearer\s+/i, "")
        .trim();

      const sock = io(`${SOCKET_URL}/location`, {
        auth: authToken ? { token: authToken } : {},
        transports: ["websocket", "polling"],
      });
      socketRef.current = sock;

      sock.on("connect", () => sock.emit("join", { token: data.token }));
      sock.on("joined", ({ viewerCount: vc }) => {
        setViewerCount(vc);
        startWatchingPosition(sock);
      });
      sock.on("viewer:count", ({ count }) => setViewerCount(count));
      sock.on("session:expired", () => { setSessionEnded(true); cleanup(); });
      sock.on("session:stopped", () => { setSessionEnded(true); cleanup(); });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to start sharing");
    } finally {
      setLoading(false);
    }
  };

  const cleanup = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const handleStop = async () => {
    if (!session) return;
    socketRef.current?.emit("stop");
    try { await stopLocationShare(session.token); } catch (_) {}
    setSessionEnded(true);
    cleanup();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => () => cleanup(), [cleanup]);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Share My Live Location
      </Typography>

      {!session && !sessionEnded && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Choose how long to share your location:
          </Typography>
          <ToggleButtonGroup
            value={duration}
            exclusive
            onChange={(_, v) => v && setDuration(v)}
            sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}
          >
            {DURATIONS.map((d) => (
              <ToggleButton key={d.value} value={d.value}>
                {d.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleStart}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {loading ? "Starting…" : "Start Sharing"}
          </Button>
        </Paper>
      )}

      {sessionEnded && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Location sharing has ended.
        </Alert>
      )}

      {session && !sessionEnded && (
        <Box>
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Share this link:
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              <Typography
                variant="body2"
                sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}
              >
                {shareUrl}
              </Typography>
              <Tooltip title={copied ? "Copied!" : "Copy link"}>
                <IconButton size="small" onClick={handleCopy}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          <Box display="flex" gap={2} mb={2} alignItems="center">
            <Chip icon={<PeopleIcon />} label={`${viewerCount} viewer${viewerCount !== 1 ? "s" : ""}`} size="small" />
            <Chip
              label={countdown > 0 ? `⏱ ${formatCountdown(countdown)}` : "Expired"}
              color={countdown > 0 ? "primary" : "error"}
              size="small"
            />
            <Box flex={1} />
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<StopIcon />}
              onClick={handleStop}
            >
              Stop Sharing
            </Button>
          </Box>

          {ownerPos ? (
            <MapContainer
              center={[ownerPos.lat, ownerPos.lng]}
              zoom={16}
              style={{ height: 380, borderRadius: 8 }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[ownerPos.lat, ownerPos.lng]} />
            </MapContainer>
          ) : (
            <Box
              sx={{
                height: 380,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "action.hover",
                borderRadius: 2,
              }}
            >
              <Box textAlign="center">
                <CircularProgress size={32} sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Waiting for GPS signal…
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
}
