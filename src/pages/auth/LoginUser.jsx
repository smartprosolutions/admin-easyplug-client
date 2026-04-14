import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { gradientPrimary } from "../../theme/theme";
import logo from "../../assets/images/Sample Logo 1 (3).png";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import React from "react";
import { useMutation } from "@tanstack/react-query";
import { login as loginRequest } from "../../services/authService";
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
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, textAlign: "center", letterSpacing: 0.2 }}
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

              console.log(mutation)
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
                    <Button size="small" onClick={() => navigate("/forgot-password")}>
                      Forgot password?
                    </Button>
                  </Stack>
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
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <CircularProgress size={18} color="inherit" />
                        <span>Signing in...</span>
                      </Stack>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>

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
