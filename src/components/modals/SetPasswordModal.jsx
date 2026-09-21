import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  Avatar,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { alpha } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import TextFieldWrapper from "../forms/TextFieldWrapper";
import { setPassword as setPasswordRequest } from "../../services/authService";
import { createPasswordSchema } from "../../utils/passwordValidation";
import { gradientPrimary } from "../../theme/theme";

/**
 * First-time password for Google-only shoppers linking a seller account.
 * Cannot be dismissed while `required` is true.
 */
export default function SetPasswordModal({
  open,
  required = true,
  email = "",
  onSuccess,
  onClose,
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setShowPassword(false);
      setShowConfirm(false);
      setFormError("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: ({ password, confirmPassword }) =>
      setPasswordRequest({ password, confirmPassword }),
    onSuccess: (data) => {
      setFormError("");
      onSuccess?.(data);
    },
    onError: (err) => {
      setFormError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not set password. Please try again.",
      );
    },
  });

  const handleClose = () => {
    if (required || mutation.isPending) return;
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown={required}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          background: (theme) =>
            `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "common.white",
          px: 2.5,
          py: 2,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: alpha("#fff", 0.2),
              color: "common.white",
            }}
          >
            <LockOutlinedIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Set a password
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Create a password for your EasyPlug account so you can sign in
              with email later.
            </Typography>
          </Box>
          {!required && (
            <IconButton
              size="small"
              onClick={handleClose}
              disabled={mutation.isPending}
              sx={{ color: "common.white" }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      <Formik
        initialValues={{ password: "", confirmPassword: "" }}
        enableReinitialize
        validationSchema={Yup.object({
          password: createPasswordSchema({ compareEmail: email }),
          confirmPassword: Yup.string()
            .oneOf([Yup.ref("password"), null], "Passwords must match")
            .required("Required"),
        })}
        onSubmit={(values) => {
          setFormError("");
          mutation.mutate({
            password: values.password,
            confirmPassword: values.confirmPassword,
          });
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <Form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 2.5, pb: 1 }}>
              <Stack spacing={1.5}>
                {email ? (
                  <Typography variant="body2" color="text.secondary">
                    Signed in as <strong>{email}</strong>
                  </Typography>
                ) : null}
                <TextFieldWrapper
                  name="password"
                  label="New password"
                  type={showPassword ? "text" : "password"}
                  size="medium"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextFieldWrapper
                  name="confirmPassword"
                  label="Confirm password"
                  type={showConfirm ? "text" : "password"}
                  size="medium"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label="toggle confirm password visibility"
                        >
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {formError ? (
                  <Typography variant="caption" color="error">
                    {formError}
                  </Typography>
                ) : null}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={mutation.isPending || isSubmitting}
                sx={{
                  color: "#fff",
                  backgroundImage: gradientPrimary,
                  boxShadow: "none",
                  py: 1.1,
                  "&:hover": { opacity: 0.95 },
                }}
              >
                {mutation.isPending ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Save password & continue"
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
