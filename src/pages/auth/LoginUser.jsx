import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import { gradientPrimary } from "../../theme/theme";
import logo from "../../assets/images/Sample Logo 1 (3).png";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import React from "react";
import { useMutation } from "@tanstack/react-query";
import { login as loginRequest, googleLogin } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import ToastAlert from "../../components/alerts/ToastAlert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function LoginUser() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (creds) => loginRequest(creds),
    onSuccess: (data) => {
      if (data?.accessToken || data?.token) {
        const token = data.accessToken || data.token;
        localStorage.setItem("access_token", token);
      }
      // show success then navigate shortly after so user sees toast
      setAuthToast({
        open: true,
        severity: "success",
        message: "Signed in successfully"
      });
      setTimeout(() => navigate("/dashboard"), 700);
    },
    onError: (err) => {
      console.error("Login failed", err);
      const msg =
        err?.response?.data?.message || err?.message || "Login failed";
      setAuthToast({ open: true, severity: "error", message: msg });
    }
  });

  const googleMutation = useMutation({
    mutationFn: ({ credential }) => googleLogin({ credential }),
    onSuccess: (data) => {
      if (data?.accessToken || data?.token) {
        const token = data.accessToken || data.token;
        localStorage.setItem("access_token", token);
      }
      setAuthToast({
        open: true,
        severity: "success",
        message: "Signed in with Google"
      });
      setTimeout(() => navigate("/dashboard"), 700);
    },
    onError: (err) => {
      console.error("Google login failed", err);
      const msg =
        err?.response?.data?.message || err?.message || "Google login failed";
      setAuthToast({ open: true, severity: "error", message: msg });
    }
  });

  const [authToast, setAuthToast] = React.useState({
    open: false,
    severity: "info",
    message: ""
  });

  const [showPassword, setShowPassword] = React.useState(false);

  const passwordInputProps = {
    type: showPassword ? "text" : "password",
    InputProps: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((s) => !s)}
            edge="end"
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      )
    }
  };

  const handleToastClose = () => setAuthToast((s) => ({ ...s, open: false }));

  const handleGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    if (!clientId) {
      console.warn("Missing VITE_GOOGLE_CLIENT_ID env var.");
      return;
    }
    const src = "https://accounts.google.com/gsi/client";
    const initAndPrompt = () => {
      if (!window.google?.accounts?.id) return;
      try {
        if (!window.__oneTapInitialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              // response contains credential (JWT) that should be sent to backend
              const credential = response?.credential;
              if (credential) {
                googleMutation.mutate({ credential });
              }
            }
          });
          window.__oneTapInitialized = true;
        }
        try {
          window.google.accounts.id.cancel();
        } catch {
          /* no-op */
        }
        window.google.accounts.id.prompt();
      } catch {
        /* no-op */
      }
    };
    let script = document.querySelector(`script[src="${src}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = initAndPrompt;
      document.head.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initAndPrompt();
    } else {
      script.addEventListener("load", initAndPrompt, { once: true });
    }
  };
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: (theme) =>
          theme.palette.mode === "light" ? "#f7f7f7" : "#0f1115",
        p: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{ maxWidth: 500, width: "100%", borderRadius: 3 }}
      >
        <Stack spacing={3} sx={{ p: 4 }}>
          <Stack alignItems="center" justifyContent="center">
            <Avatar src={logo} alt="Logo" sx={{ width: 150, height: 150 }} />
          </Stack>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, textAlign: "center" }}
          >
            Welcome back
          </Typography>

          <Formik
            initialValues={{ email: "", password: "", remember: false }}
            validationSchema={Yup.object({
              email: Yup.string().email("Invalid email").required("Required"),
              password: Yup.string()
                .min(6, "Min 6 characters")
                .required("Required")
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await mutation.mutateAsync({
                  email: values.email,
                  password: values.password
                });
              } catch {
                // handled in mutation.onError
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ setFieldValue, isSubmitting }) => (
              <Form>
                <Stack spacing={2}>
                  <TextFieldWrapper name="email" label="Email" size="medium" />
                  <TextFieldWrapper
                    name="password"
                    label="Password"
                    {...passwordInputProps}
                    size="medium"
                  />
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) =>
                            setFieldValue("remember", e.target.checked)
                          }
                        />
                      }
                      label="Remember me"
                    />
                    <Button size="small">Forgot password?</Button>
                  </Stack>
                  <Button
                    type="submit"
                    disabled={isSubmitting || mutation.isLoading}
                    fullWidth
                    size="large"
                    variant="contained"
                    sx={{
                      color: "#fff",
                      backgroundImage: gradientPrimary,
                      boxShadow: "none",
                      "&:hover": { opacity: 0.95, boxShadow: "none" }
                    }}
                  >
                    {mutation.isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>

          <Divider>
            <Typography variant="caption" color="text.secondary">
              or continue with
            </Typography>
          </Divider>

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              startIcon={
                <img
                  alt="Google"
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  style={{ width: 18, height: 18 }}
                />
              }
            >
              Continue with Google
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Don’t have an account?{" "}
            <Button size="small" onClick={() => navigate("/register")}>
              Create one
            </Button>
          </Typography>
        </Stack>
      </Paper>
      <ToastAlert
        open={authToast.open}
        severity={authToast.severity}
        message={authToast.message}
        onClose={handleToastClose}
      />
    </Box>
  );
}
