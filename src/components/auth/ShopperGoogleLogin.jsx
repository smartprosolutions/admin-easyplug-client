import React from "react";
import {
  Alert,
  Box,
  Button,
  Avatar,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { alpha } from "@mui/material/styles";
import { useFormikContext } from "formik";
import * as Yup from "yup";
import axiosClient from "../../api/axiosClient";
import { createPasswordSchema } from "../../utils/passwordValidation";

const passwordSchema = Yup.object({
  email: Yup.string().email().required(),
  password: createPasswordSchema(),
  confirmPassword: Yup.string()
    .required("Confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

export default function ShopperGoogleLogin({ onAuthenticated, disabled }) {
  const { setFieldValue } = useFormikContext();
  const buttonRef = React.useRef(null);
  const callbackRef = React.useRef(null);
  const [session, setSession] = React.useState(null);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  const closePasswordModal = () => {
    if (busy) return;
    setSession(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmation(false);
    setError("");
  };

  const complete = (data, newPassword = "") => {
    setFieldValue("existingEmail", data.user.email);
    setFieldValue("existingPassword", newPassword);
    onAuthenticated(data);
  };

  callbackRef.current = async ({ credential }) => {
    if (!credential || disabled || busy || session) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await axiosClient.post("/auth/login/google", {
        credential,
        existingAccountOnly: true,
      });
      if (!data.success || !data.accessToken || !data.user?.email)
        throw new Error("Google authentication failed. Please try again.");
      const role = String(
        data.user.userType || data.user.role || "",
      ).toLowerCase();
      if (role === "seller" || role.includes("admin"))
        throw new Error(
          "This email is already registered as a seller or admin.",
        );
      if (data.hasPassword) complete(data);
      else setSession(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    let timer;
    const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
    if (!clientId) {
      setError("Google sign-in is not configured yet.");
      return;
    }
    let attempts = 0;
    const initialize = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        if (++attempts > 100) {
          setError(
            "Unable to load Google sign-in. Please refresh and try again.",
          );
          return;
        }
        timer = window.setTimeout(initialize, 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => callbackRef.current?.(response),
        auto_select: false,
        ux_mode: "popup",
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: Math.min(buttonRef.current.clientWidth || 360, 400),
      });
      setReady(true);
    };
    if (
      !document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onerror = () => {
        if (!cancelled) setError("Failed to load Google sign-in.");
      };
      document.head.appendChild(script);
    }
    initialize();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const savePassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await passwordSchema.validate({
        email: session.user.email,
        password,
        confirmPassword,
      });
      await axiosClient.post(
        "/auth/set-password",
        { password, confirmPassword },
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );
      complete(session, password);
      setSession(null);
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmation(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          height: 44,
          pointerEvents: busy || disabled || session ? "none" : "auto",
          opacity: busy || disabled ? 0.6 : 1,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          disabled={!ready || busy || disabled}
          startIcon={
            <Box
              component="img"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              sx={{ width: 18, height: 18 }}
            />
          }
          sx={{
            height: 44,
            borderRadius: 2.2,
            bgcolor: "#fff",
            color: "#1f2937",
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "0 6px 14px rgba(15, 23, 42, 0.1)",
          }}
        >
          {busy
            ? "Authenticating..."
            : ready
              ? "Sign in with Google"
              : "Loading Google..."}
        </Button>
        <Box
          ref={buttonRef}
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.01,
            overflow: "hidden",
            "& iframe": { width: "100% !important" },
          }}
        />
      </Box>
      {error && !session && <Alert severity="error">{error}</Alert>}
      <Dialog
        open={Boolean(session)}
        onClose={closePasswordModal}
        aria-labelledby="create-password-title"
        aria-describedby="create-password-description"
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{ background: (theme) => `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, color: "common.white", px: 2.5, py: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar sx={{ width: 38, height: 38, bgcolor: alpha("#fff", 0.2), color: "common.white" }}>
              <LockOutlinedIcon fontSize="small" />
            </Avatar>
            <Typography id="create-password-title" component="h2" variant="h6" fontWeight={700} sx={{ flex: 1, fontSize: 18 }}>Create a password</Typography>
            <IconButton aria-label="Close create password" onClick={closePasswordModal} disabled={busy} sx={{ color: "common.white", bgcolor: alpha("#fff", 0.12), "&:hover": { bgcolor: alpha("#fff", 0.2) } }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
        <DialogContent sx={{ px: 2.5, pt: 2.5, pb: 2.5 }}>
          <Stack
            component="form"
            onSubmit={savePassword}
            spacing={2}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          >
            <Typography id="create-password-description" variant="body2" color="text.secondary">Your Google account is verified. Create a password to continue setting up your lister account.</Typography>
            <TextField
              label="Email"
              value={session?.user.email || ""}
              disabled
              fullWidth
              helperText="This email is linked to your Google account."
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              autoFocus
              fullWidth
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={busy}
              helperText="Use 8–64 characters with uppercase and lowercase letters, a number, and a special character. Avoid spaces and common passwords."
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? "Hide password" : "Show password"} edge="end" onClick={() => setShowPassword((value) => !value)} disabled={busy}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
            />
            <TextField
              label="Confirm password"
              type={showConfirmation ? "text" : "password"}
              fullWidth
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={busy}
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} edge="end" onClick={() => setShowConfirmation((value) => !value)} disabled={busy}>{showConfirmation ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
              <Button type="button" variant="outlined" color="inherit" onClick={closePasswordModal} disabled={busy} sx={{ borderRadius: 2 }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={busy || !password || !confirmPassword} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ borderRadius: 2, boxShadow: "none", textTransform: "none" }}>
                {busy ? "Creating password..." : "Create password & continue"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
