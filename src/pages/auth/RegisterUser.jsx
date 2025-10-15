import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { gradientPrimary } from "../../theme/theme";
import logo from "../../assets/images/Sample Logo 1 (3).png";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import SelectFieldWrapper from "../../components/forms/SelectFieldWrapper";
import { useMutation } from "@tanstack/react-query";
import {
  registerSeller as registerSellerRequest,
  sendVerificationCode,
  login as loginRequest
} from "../../services/authService";
import { useNavigate } from "react-router-dom";
import ToastAlert from "../../components/alerts/ToastAlert";
import React from "react";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// Simple South African ID number Luhn-like check (13 digits) + Luhn checksum
function isValidSouthAfricanId(id) {
  if (!/^\d{13}$/.test(id)) return false;
  // Luhn checksum
  let sum = 0;
  let alt = false;
  for (let i = id.length - 1; i >= 0; i--) {
    let n = parseInt(id[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export default function RegisterUser() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (values) => registerSellerRequest(values),
    onSuccess: (data) => {
      if (data?.accessToken || data?.token) {
        const token = data.accessToken || data.token;
        localStorage.setItem("access_token", token);
      }
      setAuthToast({
        open: true,
        severity: "success",
        message: "Account created"
      });
      setTimeout(() => navigate("/dashboard"), 700);
    },
    onError: (err) => {
      console.error("Register failed", err);
      const msg =
        err?.response?.data?.message || err?.message || "Register failed";
      setAuthToast({ open: true, severity: "error", message: msg });
    }
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => loginRequest({ email, password }),
    onSuccess: (data) => {
      const token = data?.accessToken || data?.token;
      if (token) localStorage.setItem("access_token", token);
      setAuthToast({
        open: true,
        severity: "success",
        message: "Logged in. Continue with business details."
      });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Login failed";
      setAuthToast({ open: true, severity: "error", message: msg });
    }
  });

  const sendCodeMutation = useMutation({
    mutationFn: ({ email }) => sendVerificationCode({ email }),
    onSuccess: (data) => {
      const msg = data?.message || "Verification code sent";
      setAuthToast({ open: true, severity: "success", message: msg });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to send code";
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
          {/* Title removed to prevent duplication; dynamic title is rendered inside the form */}

          <Formik
            initialValues={{
              registrationType: "sole", // 'sole' | 'business'
              alreadyHasAccount: "no", // 'yes' | 'no'
              existingEmail: "",
              existingPassword: "",
              title: "",
              firstName: "",
              lastName: "",
              email: "",
              password: "",
              confirmPassword: "",
              hasIdNumber: "yes",
              idNumber: "",
              passportNumber: "",
              profilePicture: null,
              // business fields
              businessName: "",
              businessEmail: "",
              businessRegistrationNumber: "",
              taxNumber: "",
              businessPicture: null,
              // verification
              verificationCode: ""
            }}
            validationSchema={Yup.lazy(() =>
              Yup.object({
                registrationType: Yup.string()
                  .oneOf(["sole", "business"])
                  .required(),
                alreadyHasAccount: Yup.string().oneOf(["yes", "no"]).required(),
                existingEmail: Yup.string().when("alreadyHasAccount", {
                  is: "yes",
                  then: (s) => s.email("Invalid email").required("Required")
                }),
                existingPassword: Yup.string().when("alreadyHasAccount", {
                  is: "yes",
                  then: (s) => s.required("Required")
                }),
                title: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: (s) => s.required("Required")
                }),
                firstName: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: (s) => s.required("Required")
                }),
                lastName: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: (s) => s.required("Required")
                }),
                email: Yup.string()
                  .email("Invalid email")
                  .when("alreadyHasAccount", {
                    is: "no",
                    then: (s) => s.required("Required")
                  }),
                password: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: (s) =>
                    s
                      .required("Required")
                      .min(10, "Min 10 chars")
                      .matches(/[0-9]/, "Need number")
                      .matches(/[a-z]/, "Need lowercase")
                      .matches(/[A-Z]/, "Need uppercase")
                      .matches(/[^A-Za-z0-9]/, "Need special")
                }),
                confirmPassword: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: (s) =>
                    s
                      .oneOf(
                        [Yup.ref("password"), null],
                        "Passwords must match"
                      )
                      .required("Required")
                }),
                idNumber: Yup.string().when(
                  ["hasIdNumber", "alreadyHasAccount"],
                  {
                    is: (has, acct) => has === "yes" && acct === "no",
                    then: (s) =>
                      s
                        .required("Required")
                        .test(
                          "rsa-id",
                          "Invalid ID",
                          (v) => !v || isValidSouthAfricanId(v)
                        ),
                    otherwise: (s) => s.notRequired()
                  }
                ),
                businessName: Yup.string().when("registrationType", {
                  is: "business",
                  then: (s) =>
                    s.when("alreadyHasAccount", {
                      is: "no",
                      then: (ss) => ss.required("Required"),
                      otherwise: (ss) => ss
                    })
                }),
                businessEmail: Yup.string().when("registrationType", {
                  is: "business",
                  then: (s) =>
                    s.email("Invalid email").when("alreadyHasAccount", {
                      is: "no",
                      then: (ss) => ss.required("Required"),
                      otherwise: (ss) => ss
                    })
                }),
                // Profile picture is always required
                profilePicture: Yup.mixed()
                  .nullable()
                  .test(
                    "profile-picture-required",
                    "Profile picture is required",
                    (v) => v instanceof File
                  ),
                // Require business picture for all business registrations (shown after login for 'yes' and immediately for 'no')
                businessPicture: Yup.mixed()
                  .nullable()
                  .when("registrationType", {
                    is: "business",
                    then: (s) =>
                      s.test(
                        "business-picture-required",
                        "Business picture is required",
                        (v) => v instanceof File
                      ),
                    otherwise: (s) => s.notRequired()
                  }),
                businessRegistrationNumber: Yup.string(),
                taxNumber: Yup.string()
              })
            )}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                // build FormData for file uploads
                const formData = new FormData();
                Object.entries(values).forEach(([k, v]) => {
                  if (k === "registrationType") return; // do not submit registrationType
                  if (v === null || v === undefined || v === "") return; // skip empties
                  if (v instanceof File) {
                    formData.append(k, v);
                  } else {
                    formData.append(k, v);
                  }
                });
                // Ensure key flags are always present
                formData.set(
                  "alreadyHasAccount",
                  values.alreadyHasAccount ?? ""
                );
                await mutation.mutateAsync(formData);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              values,
              setFieldValue,
              isSubmitting,
              errors,
              touched,
              submitCount
            }) => {
              const showUserFields = values.alreadyHasAccount === "no";
              const isBusiness = values.registrationType === "business";
              const requiresLogin =
                values.alreadyHasAccount === "yes" &&
                !localStorage.getItem("access_token");
              return (
                <Form>
                  <Stack spacing={2}>
                    {/* Dynamic heading inside form */}
                    {requiresLogin ? (
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, textAlign: "center" }}
                      >
                        Already have an account? LOGIN
                      </Typography>
                    ) : (
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, textAlign: "center" }}
                      >
                        Register to sell on Easyplug
                      </Typography>
                    )}
                    {/* Registration Type */}
                    <SelectFieldWrapper
                      name="registrationType"
                      label="Registering As"
                      options={[
                        { value: "sole", label: "Sole Provider" },
                        { value: "business", label: "Registered Business" }
                      ]}
                    />
                    <SelectFieldWrapper
                      name="alreadyHasAccount"
                      label="Already have an account?"
                      options={[
                        { value: "no", label: "No - Create New" },
                        { value: "yes", label: "Yes - Link Business" }
                      ]}
                    />
                    {values.alreadyHasAccount === "yes" && requiresLogin && (
                      <>
                        <TextFieldWrapper
                          name="existingEmail"
                          label="Account Email"
                          size="medium"
                        />
                        <TextFieldWrapper
                          name="existingPassword"
                          label="Account Password"
                          size="medium"
                          type="password"
                        />
                        <Button
                          variant="contained"
                          disabled={loginMutation.isLoading}
                          onClick={() =>
                            loginMutation.mutate({
                              email: values.existingEmail,
                              password: values.existingPassword
                            })
                          }
                          sx={{
                            color: "#fff",
                            backgroundImage: gradientPrimary,
                            boxShadow: "none",
                            "&:hover": { opacity: 0.95 }
                          }}
                        >
                          {loginMutation.isLoading
                            ? "Authenticating..."
                            : "Login"}
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                          Login to proceed with linking business details.
                        </Typography>
                      </>
                    )}
                    {/* Sole Provider extra details after logging in (alreadyHasAccount = yes) */}
                    {values.registrationType === "sole" &&
                      values.alreadyHasAccount === "yes" &&
                      !requiresLogin && (
                        <>
                          <SelectFieldWrapper
                            name="hasIdNumber"
                            label="Do you have an RSA ID Number?"
                            options={[
                              { value: "no", label: "No" },
                              { value: "yes", label: "Yes" }
                            ]}
                          />
                          {values.hasIdNumber === "yes" && (
                            <TextFieldWrapper
                              name="idNumber"
                              label="RSA ID Number"
                              size="medium"
                            />
                          )}
                          {values.hasIdNumber === "no" && (
                            <TextFieldWrapper
                              name="passportNumber"
                              label="Passport Number"
                              size="medium"
                            />
                          )}
                          <Button component="label" variant="outlined">
                            Capture Profile Picture
                            <input
                              hidden
                              accept="image/*;capture=camera"
                              type="file"
                              onChange={(e) => {
                                if (e.target.files?.[0])
                                  setFieldValue(
                                    "profilePicture",
                                    e.target.files[0]
                                  );
                              }}
                            />
                          </Button>
                          {errors.profilePicture &&
                            (submitCount > 0 || touched.profilePicture) && (
                              <Typography variant="caption" color="error">
                                {errors.profilePicture}
                              </Typography>
                            )}
                          {values.profilePicture && (
                            <Typography variant="caption">
                              {values.profilePicture.name}
                            </Typography>
                          )}
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <TextFieldWrapper
                              name="verificationCode"
                              label="Verification code"
                              size="medium"
                            />
                            <Button
                              variant="outlined"
                              onClick={() => {
                                const email =
                                  values.email || values.existingEmail;
                                if (!email) {
                                  setAuthToast({
                                    open: true,
                                    severity: "error",
                                    message: "Enter email to receive code"
                                  });
                                  return;
                                }
                                sendCodeMutation.mutate({ email });
                              }}
                            >
                              {sendCodeMutation.isLoading
                                ? "Sending..."
                                : "Get Code"}
                            </Button>
                          </Stack>
                        </>
                      )}
                    {showUserFields && (
                      <>
                        <SelectFieldWrapper
                          name="title"
                          label="Title"
                          options={[
                            { value: "Mr", label: "Mr" },
                            { value: "Mrs", label: "Mrs" },
                            { value: "Ms", label: "Ms" },
                            { value: "Dr", label: "Dr" },
                            { value: "Prof", label: "Prof" }
                          ]}
                        />
                        <Stack direction="row" spacing={1}>
                          <TextFieldWrapper
                            name="firstName"
                            label="First name"
                            size="medium"
                          />
                          <TextFieldWrapper
                            name="lastName"
                            label="Last name"
                            size="medium"
                          />
                        </Stack>
                        <TextFieldWrapper
                          name="email"
                          label="Email"
                          size="medium"
                        />
                        <TextFieldWrapper
                          name="password"
                          label="Password"
                          {...passwordInputProps}
                          size="medium"
                        />
                        <TextFieldWrapper
                          name="confirmPassword"
                          label="Confirm password"
                          {...passwordInputProps}
                          size="medium"
                        />
                        {/* ID number toggle */}
                        <SelectFieldWrapper
                          name="hasIdNumber"
                          label="Do you have an RSA ID Number?"
                          options={[
                            { value: "no", label: "No" },
                            { value: "yes", label: "Yes" }
                          ]}
                        />
                        {values.hasIdNumber === "yes" && (
                          <TextFieldWrapper
                            name="idNumber"
                            label="RSA ID Number"
                            size="medium"
                          />
                        )}
                        {values.hasIdNumber === "no" && (
                          <TextFieldWrapper
                            name="passportNumber"
                            label="Passport Number"
                            size="medium"
                          />
                        )}
                        {/* Profile picture capture */}
                        <Button component="label" variant="outlined">
                          Capture Profile Picture
                          <input
                            hidden
                            accept="image/*;capture=camera"
                            type="file"
                            onChange={(e) => {
                              if (e.target.files?.[0])
                                setFieldValue(
                                  "profilePicture",
                                  e.target.files[0]
                                );
                            }}
                          />
                        </Button>
                        {errors.profilePicture &&
                          (submitCount > 0 || touched.profilePicture) && (
                            <Typography variant="caption" color="error">
                              {errors.profilePicture}
                            </Typography>
                          )}
                        {values.profilePicture && (
                          <Typography variant="caption">
                            {values.profilePicture.name}
                          </Typography>
                        )}
                      </>
                    )}
                    {/* Business Section */}
                    {isBusiness && !requiresLogin && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2 }}>
                          Business Information
                        </Typography>
                        {/* Capture profile picture for business as well (always shown) */}
                        <Button component="label" variant="outlined">
                          Capture Profile Picture
                          <input
                            hidden
                            accept="image/*;capture=camera"
                            type="file"
                            onChange={(e) => {
                              if (e.target.files?.[0])
                                setFieldValue(
                                  "profilePicture",
                                  e.target.files[0]
                                );
                            }}
                          />
                        </Button>
                        {errors.profilePicture &&
                          (submitCount > 0 || touched.profilePicture) && (
                            <Typography variant="caption" color="error">
                              {errors.profilePicture}
                            </Typography>
                          )}
                        {values.profilePicture && (
                          <Typography variant="caption">
                            {values.profilePicture.name}
                          </Typography>
                        )}
                        <TextFieldWrapper
                          name="businessName"
                          label="Business Name"
                          size="medium"
                        />
                        <TextFieldWrapper
                          name="businessEmail"
                          label="Business Email"
                          size="medium"
                        />
                        <TextFieldWrapper
                          name="businessRegistrationNumber"
                          label="Registration Number (optional)"
                          size="medium"
                        />
                        <TextFieldWrapper
                          name="taxNumber"
                          label="Tax Number (optional)"
                          size="medium"
                        />
                        <Button component="label" variant="outlined">
                          Upload Business Picture
                          <input
                            hidden
                            accept="image/*;capture=camera"
                            type="file"
                            onChange={(e) => {
                              if (e.target.files?.[0])
                                setFieldValue(
                                  "businessPicture",
                                  e.target.files[0]
                                );
                            }}
                          />
                        </Button>
                        {errors.businessPicture &&
                          (submitCount > 0 || touched.businessPicture) && (
                            <Typography variant="caption" color="error">
                              {errors.businessPicture}
                            </Typography>
                          )}
                        {values.businessPicture && (
                          <Typography variant="caption">
                            {values.businessPicture.name}
                          </Typography>
                        )}
                      </>
                    )}
                    {/* Verification code (for email verification) */}
                    {showUserFields && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextFieldWrapper
                          name="verificationCode"
                          label="Verification code"
                          size="medium"
                        />
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const email = values.email;
                            if (!email) {
                              setAuthToast({
                                open: true,
                                severity: "error",
                                message: "Enter email to receive code"
                              });
                              return;
                            }
                            sendCodeMutation.mutate({ email });
                          }}
                        >
                          {sendCodeMutation.isLoading
                            ? "Sending..."
                            : "Get Code"}
                        </Button>
                      </Stack>
                    )}
                    {!requiresLogin && (
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
                        {mutation.isLoading
                          ? "Registering..."
                          : "Register to sell on Easyplug"}
                      </Button>
                    )}
                    {/* Conditional footer link to Login page: hidden only during login gate */}
                    {!(values.alreadyHasAccount === "yes" && requiresLogin) && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        Already have an account?{" "}
                        <Button size="small" onClick={() => navigate("/login")}>
                          Log in
                        </Button>
                      </Typography>
                    )}
                  </Stack>
                </Form>
              );
            }}
          </Formik>

          {/* Login footer removed as requested */}
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
