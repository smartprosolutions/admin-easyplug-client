import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { alpha } from "@mui/material/styles";
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
        background: (theme) =>
          `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 36%, ${theme.palette.background.default} 100%)`,
        pt: 0,
        pb: { xs: 2.5, sm: 3.5 },
        px: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "100%",
          minHeight: { xs: 240, sm: 300 },
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
          backgroundImage: (theme) =>
            `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.24)} 0%, ${alpha(theme.palette.primary.main, 0.14)} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          borderBottomLeftRadius: "46% 20%",
          borderBottomRightRadius: "46% 20%",
          "&::after": {
            content: '\"\"',
            position: "absolute",
            left: -40,
            right: -40,
            bottom: -22,
            height: 56,
            background: (theme) =>
              `radial-gradient(70% 40px at 50% 0%, ${alpha(theme.palette.common.black, theme.palette.mode === "light" ? 0.14 : 0.3)} 0%, ${alpha(theme.palette.common.black, 0)} 72%)`,
            pointerEvents: "none",
          },
        }}
      >
        <Avatar
          src={logo}
          alt="Logo"
          sx={{
            width: { xs: 185, sm: 235 },
            height: { xs: 185, sm: 235 },
            bgcolor: "transparent",
          }}
        />
      </Box>

      <Box
        sx={{
          maxWidth: 470,
          width: "100%",
          mx: "auto",
          px: { xs: 2.25, sm: 4 },
        }}
      >
        <Stack spacing={2.25} sx={{ pb: { xs: 3, sm: 4 }, pt: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: { xs: 11, sm: 12 },
                letterSpacing: { xs: 2.8, sm: 4 },
                color: "primary.main",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Powering Easyplug Commerce
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, lineHeight: 1.05, mt: 0.5, fontSize: { xs: 36, sm: 50 } }}
            >
              Reset
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                lineHeight: 1.05,
                fontSize: { xs: 36, sm: 50 },
                color: "secondary.main",
              }}
            >
              Password
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Enter your new password to complete the reset.
            </Typography>
            <Box
              sx={{
                width: 56,
                height: 3,
                borderRadius: 99,
                bgcolor: "secondary.main",
                mt: 2,
                mx: "auto",
              }}
            />
          </Box>

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
                    <Typography
                      variant="caption"
                      sx={{ letterSpacing: { xs: 2.2, sm: 3 }, fontWeight: 700, color: "secondary.main" }}
                    >
                      NEW PASSWORD
                    </Typography>
                    <TextFieldWrapper
                      name="password"
                      label=""
                      placeholder="Enter your new password"
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

                    <Typography
                      variant="caption"
                      sx={{ letterSpacing: { xs: 2.2, sm: 3 }, fontWeight: 700, color: "secondary.main", mt: 0.5 }}
                    >
                      CONFIRM PASSWORD
                    </Typography>
                    <TextFieldWrapper
                      name="confirmPassword"
                      label=""
                      placeholder="Confirm your password"
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
                        borderRadius: 3,
                        py: { xs: 1.15, sm: 1.3 },
                        fontSize: { xs: 16, sm: 18 },
                        fontWeight: 800,
                        letterSpacing: { xs: 1, sm: 1.4 },
                        "&:hover": { opacity: 0.95, boxShadow: "none" }
                      }}
                    >
                      {mutation.isPending ? (
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                          <CircularProgress size={18} color="inherit" />
                          <span>Resetting...</span>
                        </Stack>
                      ) : (
                        "RESET PASSWORD"
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
      </Box>

      <ToastAlert
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />
    </Box>
  );
}
