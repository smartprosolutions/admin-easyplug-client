import "leaflet/dist/leaflet.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { getLocationShare } from "../services/locationShareService";

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

const ownerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const viewerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SOCKET_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/api\/v\d+$/, "");

function formatCountdown(ms) {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ViewLocation() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [role, setRole] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [ownerPos, setOwnerPos] = useState(null);
  const [viewerPos, setViewerPos] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const remaining = new Date(expiresAt) - Date.now();
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    setCountdown(new Date(expiresAt) - Date.now());
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (ownerPos && mapRef.current) {
      mapRef.current.panTo([ownerPos.lat, ownerPos.lng]);
    }
  }, [ownerPos]);

  const startSharingLocation = useCallback(() => {
    if (!navigator.geolocation || !socketRef.current) return;
    setSharingLocation(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const pos = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        };
        setViewerPos(pos);
        socketRef.current?.emit("pos:update", pos);
      },
      (err) => {
        console.warn("[geolocation]", err.message);
        if (err.code === 1) setLocationDenied(true);
        setSharingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const data = await getLocationShare(token);
        if (!data.isActive) {
          if (!cancelled) setStatus("invalid");
          return;
        }

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

        sock.on("connect", () => sock.emit("join", { token }));
        sock.on("joined", ({ role: r, expiresAt: exp }) => {
          if (cancelled) return;
          setRole(r);
          setExpiresAt(exp);
          setStatus("active");
        });
        sock.on("owner:pos", (pos) => { if (!cancelled) setOwnerPos(pos); });
        sock.on("session:expired", () => { if (!cancelled) setStatus("ended"); cleanup(); });
        sock.on("session:stopped", () => { if (!cancelled) setStatus("ended"); cleanup(); });
        sock.on("error", () => { if (!cancelled) setStatus("invalid"); });
      } catch (err) {
        if (!cancelled) setStatus("invalid");
        console.error("[location init]", err.message);
      }
    }

    init();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [token, cleanup]);

  const defaultCenter = ownerPos
    ? [ownerPos.lat, ownerPos.lng]
    : [-25.7479, 28.2293];

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          px: 2, py: 1,
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" fontWeight={700} flex={1}>
          Live Location
        </Typography>
        {status === "active" && expiresAt && (
          <Chip
            label={countdown > 0 ? `⏱ ${formatCountdown(countdown)}` : "Expired"}
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
          />
        )}
      </Box>

      {status === "loading" && (
        <Box flex={1} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      )}

      {status === "invalid" && (
        <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={3}>
          <Alert severity="error">
            This location sharing link is invalid or has expired.
          </Alert>
        </Box>
      )}

      {status === "ended" && (
        <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={3}>
          <Alert severity="info">The location sharing session has ended.</Alert>
        </Box>
      )}

      {status === "active" && (
        <Box flex={1} display="flex" flexDirection="column">
          {role === "owner_same_device" && (
            <Alert severity="info" sx={{ mx: 2, mt: 1 }}>
              This is your own sharing link. Others who open it will see your live location.
            </Alert>
          )}

          {role === "viewer" && !sharingLocation && !locationDenied && (
            <Box sx={{ px: 2, pt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MyLocationIcon />}
                onClick={startSharingLocation}
              >
                Share my location too
              </Button>
            </Box>
          )}

          {locationDenied && (
            <Alert severity="warning" sx={{ mx: 2, mt: 1 }}>
              Location access denied. Only the owner's position is shown.
            </Alert>
          )}

          <Box flex={1}>
            <MapContainer
              center={defaultCenter}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {ownerPos && (
                <Marker position={[ownerPos.lat, ownerPos.lng]} icon={ownerIcon}>
                  <Popup>Owner's location</Popup>
                </Marker>
              )}
              {viewerPos && (
                <Marker position={[viewerPos.lat, viewerPos.lng]} icon={viewerIcon}>
                  <Popup>Your location</Popup>
                </Marker>
              )}
            </MapContainer>
          </Box>
        </Box>
      )}
    </Box>
  );
}
