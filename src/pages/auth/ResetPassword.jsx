import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { gradientPrimary } from "../../theme/theme";
import logo from "../../assets/images/Sample Logo 1 (3).png";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import ToastAlert from "../../components/alerts/ToastAlert";
import { resetPassword as resetPasswordRequest } from "../../services/authService";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token: tokenFromPath } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const tokenFromQuery = query.get("token");
  const email = query.get("email") || "";
  const token = tokenFromPath || tokenFromQuery || "";

  const [toast, setToast] = React.useState({
    open: false,
    severity: "info",
    message: ""
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const mutation = useMutation({
    mutationFn: (payload) => resetPasswordRequest(payload),
    onSuccess: (data) => {
      setToast({
        open: true,
        severity: "success",
        message: data?.message || "Password reset successful. Please sign in."
      });
      setTimeout(() => navigate("/login"), 1200);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not reset password. Please request a new reset link.";
      setToast({ open: true, severity: "error", message: msg });
    }
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: (theme) =>
          theme.palette.mode === "light"
            ? "radial-gradient(circle at top, rgba(102,126,234,0.16), rgba(247,247,247,1) 45%)"
            : "radial-gradient(circle at top, rgba(102,126,234,0.18), rgba(15,17,21,1) 45%)",
        p: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 500,
          width: "100%",
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (theme) =>
            theme.palette.mode === "light"
              ? "0 18px 48px rgba(15, 23, 42, 0.14)"
              : "0 18px 48px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(6px)",
          backgroundColor: "background.paper"
        }}
      >
        <Stack spacing={3} sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack alignItems="center" justifyContent="center">
            <Avatar
              src={logo}
              alt="Logo"
              sx={{
                width: { xs: 110, sm: 140 },
                height: { xs: 110, sm: 140 },
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper"
              }}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, textAlign: "center", letterSpacing: 0.2 }}
            >
              Reset password
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Enter your new password to complete the reset.
            </Typography>
          </Stack>

          {!token ? (
            <Stack spacing={2}>
              <Typography color="error" variant="body2" textAlign="center">
                Reset token is missing or invalid.
              </Typography>
              <Button size="small" onClick={() => navigate("/forgot-password")}>
                Request a new reset link
              </Button>
            </Stack>
          ) : (
            <Formik
              initialValues={{ password: "", confirmPassword: "" }}
              validationSchema={Yup.object({
                password: Yup.string().min(6, "Min 6 characters").required("Required"),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref("password")], "Passwords must match")
                  .required("Required")
              })}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  await mutation.mutateAsync({
                    token,
                    email,
                    password: values.password
                  });
                } catch {
                  // handled in mutation.onError
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <Stack spacing={2}>
                    <TextFieldWrapper
                      name="password"
                      label="New password"
                      size="medium"
                      type={showPassword ? "text" : "password"}
                      InputProps={{
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
                      }}
                    />

                    <TextFieldWrapper
                      name="confirmPassword"
                      label="Confirm new password"
                      size="medium"
                      type={showConfirmPassword ? "text" : "password"}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showConfirmPassword ? "Hide password" : "Show password"
                              }
                              onClick={() => setShowConfirmPassword((s) => !s)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />

                    <Button
                      type="submit"
                      disabled={isSubmitting || mutation.isPending}
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
                      {mutation.isPending ? (
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                          <CircularProgress size={18} color="inherit" />
                          <span>Resetting...</span>
                        </Stack>
                      ) : (
                        "Reset password"
                      )}
                    </Button>

                    <Button size="small" onClick={() => navigate("/login")}>
                      Back to sign in
                    </Button>
                  </Stack>
                </Form>
              )}
            </Formik>
          )}
        </Stack>
      </Paper>

      <ToastAlert
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />
    </Box>
  );
}
