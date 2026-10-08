import React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
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
        onClose={() => {
          if (!busy) {
            setSession(null);
            setPassword("");
            setConfirmPassword("");
            setError("");
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Create a password</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            onSubmit={savePassword}
            spacing={2}
            sx={{ pt: 1 }}
          >
            <TextField
              label="Email"
              value={session?.user.email || ""}
              disabled
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={busy}
            />
            <TextField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={busy}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? "Creating password..." : "Create password & continue"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
