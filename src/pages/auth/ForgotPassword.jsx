import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { gradientPrimary } from "../../theme/theme";
import logo from "../../assets/images/Sample Logo 1 (3).png";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import ToastAlert from "../../components/alerts/ToastAlert";
import { requestPasswordReset } from "../../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [toast, setToast] = React.useState({
    open: false,
    severity: "info",
    message: ""
  });

  const mutation = useMutation({
    mutationFn: (payload) => requestPasswordReset(payload),
    onSuccess: (data) => {
      setToast({
        open: true,
        severity: "success",
        message:
          data?.message ||
          "If this email exists, a reset link has been sent to the inbox."
      });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not send reset email.";
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
              Forgot password
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Enter your account email and we will send a reset link.
            </Typography>
          </Stack>

          <Formik
            initialValues={{ email: "" }}
            validationSchema={Yup.object({
              email: Yup.string().email("Invalid email").required("Required")
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await mutation.mutateAsync({ email: values.email });
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
                  <TextFieldWrapper name="email" label="Email" size="medium" />

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
                        <span>Sending...</span>
                      </Stack>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>

                  <Button size="small" onClick={() => navigate("/login")}>Back to sign in</Button>
                </Stack>
              </Form>
            )}
          </Formik>
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
