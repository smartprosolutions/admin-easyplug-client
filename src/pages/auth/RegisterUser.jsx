import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import BusinessIcon from "@mui/icons-material/Business";
import { alpha } from "@mui/material/styles";
import { Formik, Form, getIn } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { gradientPrimary } from "../../theme/theme";
import logo from "../../assets/images/Sample Logo 1 (3).png";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import SelectFieldWrapper from "../../components/forms/SelectFieldWrapper";
import LocationAutoComplete from "../../components/form-components/LocationAutoComplete";
import ToastAlert from "../../components/alerts/ToastAlert";
import {
  registerSeller as registerSellerRequest,
  sendVerificationCode,
  login as loginRequest,
} from "../../services/authService";

function isValidSouthAfricanId(id) {
  if (!/^\d{13}$/.test(id)) return false;
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

function getRegistrationProgress(
  values,
  { isBusiness, showUserFields, requiresLogin },
) {
  const checks = [];
  checks.push(Boolean(values.registrationType));
  checks.push(Boolean(values.alreadyHasAccount));

  if (requiresLogin) {
    checks.push(Boolean(values.existingEmail));
    checks.push(Boolean(values.existingPassword));
  }

  if (showUserFields) {
    checks.push(Boolean(values.email));
    checks.push(Boolean(values.password));
    checks.push(Boolean(values.confirmPassword));
    checks.push(Boolean(values.firstName));
    checks.push(Boolean(values.lastName));
    checks.push(
      values.hasIdNumber === "yes"
        ? Boolean(values.idNumber)
        : Boolean(values.passportNumber),
    );
    checks.push(values.profilePicture instanceof File);
    checks.push(Boolean(values.verificationCode));
  }

  if (isBusiness && !requiresLogin) {
    checks.push(Boolean(values.businessName));
    checks.push(Boolean(values.businessEmail));
    checks.push(values.businessPicture instanceof File);
  }

  checks.push(isAddressStepComplete(values));

  if (checks.length === 0) return 0;
  const complete = checks.filter(Boolean).length;
  return Math.round((complete / checks.length) * 100);
}

function getProgressLabel(percent) {
  if (percent >= 90) return "Ready to submit";
  if (percent >= 60) return "Almost there";
  if (percent >= 30) return "Good progress";
  return "Getting started";
}

function isAddressStepComplete(values) {
  const requiredFields = [
    "latitude",
    "longitude",
    "accuracy",
    "radius",
    "streetNumber",
    "streetName",
    "suburb",
    "city",
    "province",
    "country",
    "postalCode",
  ];

  return requiredFields.every((field) => {
    const value = values[field];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });
}

function StepCard({ title, children }) {
  return (
    <Box
      sx={{
        p: 0,
      }}
    >
      <Stack spacing={1.25}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {children}
      </Stack>
    </Box>
  );
}

function StepOneFields({
  values,
  setFieldValue,
  errors,
  touched,
  submitCount,
  requiresLogin,
  loginMutation,
  passwordInputProps,
  gradientPrimary,
}) {
  return (
    <StepCard title="Step 1 · Account Setup">
      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
        {[
          {
            value: "sole",
            title: "Sole Provider",
            caption: "Register as an individual seller",
            icon: PersonOutlineIcon,
          },
          {
            value: "business",
            title: "Registered Business",
            caption: "Register and manage a business profile",
            icon: BusinessIcon,
          },
        ].map((option) => {
          const selected = values.registrationType === option.value;
          const Icon = option.icon;
          return (
            <Box
              key={option.value}
              role="button"
              tabIndex={0}
              onClick={() => setFieldValue("registrationType", option.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setFieldValue("registrationType", option.value);
                }
              }}
              sx={{
                p: { xs: 1.2, sm: 1.65 },
                flex: 1,
                minWidth: 0,
                cursor: "pointer",
                borderRadius: 2.2,
                border: "1px solid",
                borderColor: selected ? "primary.main" : "divider",
                bgcolor: selected
                  ? (theme) => alpha(theme.palette.primary.main, 0.12)
                  : "background.paper",
                boxShadow: selected
                  ? (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}`
                  : "none",
                transition: "all 180ms ease",
                "&:hover": {
                  borderColor: "primary.main",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Stack spacing={0.8}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: { xs: 24, sm: 30 },
                      height: { xs: 24, sm: 30 },
                      borderRadius: 1.6,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: selected
                        ? (theme) => alpha(theme.palette.primary.main, 0.18)
                        : "action.hover",
                      color: selected ? "primary.main" : "text.secondary",
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ fontSize: { xs: 12, sm: 14 }, lineHeight: 1.2 }}
                  >
                    {option.title}
                  </Typography>
                  {selected && (
                    <Box
                      sx={{
                        ml: "auto",
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                      }}
                    />
                  )}
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: { xs: 10, sm: 12 }, lineHeight: 1.25 }}
                >
                  {option.caption}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Box sx={{ height: { xs: 1, sm: 1.5 } }} />

      {(submitCount > 0 || touched.registrationType) &&
      errors.registrationType ? (
        <Typography variant="caption" color="error">
          {errors.registrationType}
        </Typography>
      ) : null}

      <SelectFieldWrapper
        name="alreadyHasAccount"
        label="Already have an account?"
        options={[
          { value: "no", label: "No - Create New" },
          { value: "yes", label: "Yes - Link Business" },
        ]}
      />

      {values.alreadyHasAccount === "yes" ? (
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
          {requiresLogin && (
            <Button
              variant="contained"
              disabled={loginMutation.isPending}
              onClick={() =>
                loginMutation.mutate({
                  email: values.existingEmail,
                  password: values.existingPassword,
                })
              }
              sx={{
                color: "#fff",
                backgroundImage: gradientPrimary,
                boxShadow: "none",
                "&:hover": { opacity: 0.95 },
              }}
            >
              {loginMutation.isPending
                ? "Authenticating..."
                : "Login & Continue"}
            </Button>
          )}
          <Typography variant="caption" color="text.secondary">
            Existing account flow: login first, then continue to the next steps.
          </Typography>
        </>
      ) : (
        <>
          <TextFieldWrapper name="email" label="Email" size="medium" />
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
        </>
      )}
    </StepCard>
  );
}

function StepTwoFields({
  values,
  showUserFields,
  requiresLogin,
  setFieldValue,
  errors,
  touched,
  submitCount,
  sendCodeMutation,
  setAuthToast,
}) {
  const showSoleLinkedVerification =
    values.registrationType === "sole" &&
    values.alreadyHasAccount === "yes" &&
    !requiresLogin;

  return (
    <StepCard title="Step 2 · Identity & Verification">
      {requiresLogin ? (
        <Typography variant="body2" color="text.secondary">
          Login in Step 1 to unlock identity verification.
        </Typography>
      ) : (
        <>
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
                  { value: "Prof", label: "Prof" },
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
            </>
          )}

          {(showUserFields || showSoleLinkedVerification) && (
            <>
              <SelectFieldWrapper
                name="hasIdNumber"
                label="Do you have an RSA ID Number?"
                options={[
                  { value: "no", label: "No" },
                  { value: "yes", label: "Yes" },
                ]}
              />
              {values.hasIdNumber === "yes" ? (
                <TextFieldWrapper
                  name="idNumber"
                  label="RSA ID Number"
                  size="medium"
                />
              ) : (
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
                    if (e.target.files?.[0]) {
                      setFieldValue("profilePicture", e.target.files[0]);
                    }
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

              <Stack direction="row" spacing={1} alignItems="center">
                <TextFieldWrapper
                  name="verificationCode"
                  label="Verification code"
                  size="medium"
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    const email = values.email || values.existingEmail;
                    if (!email) {
                      setAuthToast({
                        open: true,
                        severity: "error",
                        message: "Enter email to receive code",
                      });
                      return;
                    }
                    sendCodeMutation.mutate({ email });
                  }}
                >
                  {sendCodeMutation.isPending ? "Sending..." : "Get Code"}
                </Button>
              </Stack>
            </>
          )}
        </>
      )}
    </StepCard>
  );
}

function StepThreeFields({
  values,
  isBusiness,
  requiresLogin,
  setFieldValue,
  errors,
  touched,
  submitCount,
}) {
  return (
    <StepCard title="Step 3 · Business Details">
      {!isBusiness ? (
        <Typography variant="body2" color="text.secondary">
          Business details are not required for Sole Provider. Continue to
          review.
        </Typography>
      ) : requiresLogin ? (
        <Typography variant="body2" color="text.secondary">
          Login in Step 1 first to continue with business details.
        </Typography>
      ) : (
        <>
          <Button component="label" variant="outlined">
            Capture Profile Picture
            <input
              hidden
              accept="image/*;capture=camera"
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0])
                  setFieldValue("profilePicture", e.target.files[0]);
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
                  setFieldValue("businessPicture", e.target.files[0]);
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
    </StepCard>
  );
}

function StepAddressFields({ setFieldValue, values }) {
  const [isCurrentLocationLoading, setIsCurrentLocationLoading] =
    React.useState(false);

  const defaultAddressValues = React.useMemo(
    () => ({
      latitude: values.latitude,
      longitude: values.longitude,
      accuracy: values.accuracy,
      radius: values.radius,
      streetNumber: values.streetNumber,
      streetName: values.streetName,
      suburb: values.suburb,
      city: values.city,
      province: values.province,
      country: values.country,
      postalCode: values.postalCode,
    }),
    [
      values.latitude,
      values.longitude,
      values.accuracy,
      values.radius,
      values.streetNumber,
      values.streetName,
      values.suburb,
      values.city,
      values.province,
      values.country,
      values.postalCode,
    ],
  );

  const handleAddressInfor = React.useCallback(
    (addressInfo) => {
      Object.keys(addressInfo).forEach((field) => {
        setFieldValue(field, addressInfo[field]);
      });
    },
    [setFieldValue],
  );

  return (
    <StepCard title="Step 4 · Address Details">
      {isCurrentLocationLoading ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading current location...
          </Typography>
        </Stack>
      ) : null}

      <LocationAutoComplete
        defaultAddressValues={defaultAddressValues}
        setAddressInfor={handleAddressInfor}
        onCurrentLocationLoadingChange={setIsCurrentLocationLoading}
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextFieldWrapper
          name="latitude"
          label="Latitude"
          size="medium"
          disabled
        />
        <TextFieldWrapper
          name="longitude"
          label="Longitude"
          size="medium"
          disabled
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextFieldWrapper
          name="accuracy"
          label="Accuracy"
          size="medium"
          disabled
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextFieldWrapper
          name="streetNumber"
          label="Street Number"
          size="medium"
          disabled
        />
        <TextFieldWrapper
          name="streetName"
          label="Street Name"
          size="medium"
          disabled
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextFieldWrapper name="suburb" label="Suburb" size="medium" disabled />
        <TextFieldWrapper name="city" label="City" size="medium" disabled />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextFieldWrapper
          name="province"
          label="Province"
          size="medium"
          disabled
        />
        <TextFieldWrapper
          name="country"
          label="Country"
          size="medium"
          disabled
        />
      </Stack>

      <TextFieldWrapper
        name="postalCode"
        label="Postal Code"
        size="medium"
        disabled
      />
    </StepCard>
  );
}

export default function RegisterUser() {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [activeStep, setActiveStep] = React.useState(0);
  const [showPassword, setShowPassword] = React.useState(false);
  const [authToast, setAuthToast] = React.useState({
    open: false,
    severity: "info",
    message: "",
  });

  const mutation = useMutation({
    mutationFn: (values) =>
      registerSellerRequest(values, (pct) => setUploadProgress(pct)),
    onSuccess: (data) => {
      if (data?.accessToken || data?.token) {
        const token = data.accessToken || data.token;
        localStorage.setItem("access_token", token);
      }
      setAuthToast({
        open: true,
        severity: "success",
        message: "Account created",
      });
      setTimeout(() => navigate("/dashboard"), 700);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Register failed";
      setAuthToast({ open: true, severity: "error", message: msg });
    },
    onSettled: () => setUploadProgress(0),
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => loginRequest({ email, password }),
    onSuccess: (data) => {
      const token = data?.accessToken || data?.token;
      if (token) localStorage.setItem("access_token", token);
      setAuthToast({
        open: true,
        severity: "success",
        message: "Logged in. Continue with business details.",
      });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Login failed";
      setAuthToast({ open: true, severity: "error", message: msg });
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: ({ email }) => sendVerificationCode({ email }),
    onSuccess: (data) => {
      setAuthToast({
        open: true,
        severity: "success",
        message: data?.message || "Verification code sent",
      });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to send code";
      setAuthToast({ open: true, severity: "error", message: msg });
    },
  });

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
      ),
    },
  };

  const handleToastClose = () => setAuthToast((s) => ({ ...s, open: false }));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: (theme) =>
          `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 34%, ${theme.palette.background.default} 100%)`,
        pt: 0,
        pb: { xs: 2.5, md: 3 },
        px: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "100%",
          minHeight: { xs: 240, md: 300 },
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
            content: '""',
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
        <Box
          component="img"
          src={logo}
          alt="Easyplug Logo"
          sx={{
            width: { xs: 185, md: 235 },
            height: { xs: 185, md: 235 },
            objectFit: "contain",
            zIndex: 1,
          }}
        />
      </Box>

      <Box
        sx={{
          maxWidth: 1080,
          width: "100%",
          mx: "auto",
          px: { xs: 2.25, md: 4 },
          position: "relative",
        }}
      >
        {mutation.isPending && (
          <LinearProgress
            variant={uploadProgress > 0 ? "determinate" : "indeterminate"}
            value={uploadProgress}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
            }}
          />
        )}

        <Stack
          spacing={2.5}
          sx={{ pt: { xs: 2, md: 2.5 } }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: 11, sm: 12 },
                letterSpacing: { xs: 2.8, sm: 4 },
                color: "primary.main",
                fontWeight: 700,
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              Powering Easyplug Commerce
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                textAlign: "center",
                lineHeight: 1.15,
                mt: 0.8,
              }}
            >
              Create Seller Account
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.9, textAlign: "center", color: "text.secondary" }}
            >
              Join the marketplace and set up your profile step by step.
            </Typography>
            <Box
              sx={{
                width: 64,
                height: 3,
                borderRadius: 99,
                bgcolor: "secondary.main",
                mx: "auto",
                mt: 1.8,
              }}
            />
          </Box>

          <Box
            sx={{
              p: { xs: 0.5, md: 1 },
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, textAlign: "center" }}
            >
              Seller Onboarding
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.5, textAlign: "center", color: "text.secondary" }}
            >
              Guided setup flow for your Easyplug seller account.
            </Typography>
          </Box>

          <Formik
            initialValues={{
              registrationType: "sole",
              alreadyHasAccount: "no",
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
              businessName: "",
              businessEmail: "",
              businessRegistrationNumber: "",
              taxNumber: "",
              latitude: "",
              longitude: "",
              accuracy: "",
              radius: "10",
              streetNumber: "",
              streetName: "",
              suburb: "",
              city: "",
              province: "",
              country: "",
              postalCode: "",
              businessPicture: null,
              verificationCode: "",
            }}
            validationSchema={Yup.lazy(() =>
              Yup.object({
                registrationType: Yup.string()
                  .oneOf(["sole", "business"])
                  .required(),
                alreadyHasAccount: Yup.string().oneOf(["yes", "no"]).required(),
                existingEmail: Yup.string().when("alreadyHasAccount", {
                  is: "yes",
                  then: (s) => s.email("Invalid email").required("Required"),
                }),
                existingPassword: Yup.string().when("alreadyHasAccount", {
                  is: "yes",
                  then: (s) => s.required("Required"),
                }),
                title: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: (s) => s.required("Required"),
                }),
                firstName: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: (s) => s.required("Required"),
                }),
                lastName: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: (s) => s.required("Required"),
                }),
                email: Yup.string()
                  .email("Invalid email")
                  .when("alreadyHasAccount", {
                    is: "no",
                    then: (s) => s.required("Required"),
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
                      .matches(/[^A-Za-z0-9]/, "Need special"),
                }),
                confirmPassword: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: (s) =>
                    s
                      .oneOf(
                        [Yup.ref("password"), null],
                        "Passwords must match",
                      )
                      .required("Required"),
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
                          (v) => !v || isValidSouthAfricanId(v),
                        ),
                    otherwise: (s) => s.notRequired(),
                  },
                ),
                businessName: Yup.string().when("registrationType", {
                  is: "business",
                  then: (s) =>
                    s.when("alreadyHasAccount", {
                      is: "no",
                      then: (ss) => ss.required("Required"),
                      otherwise: (ss) => ss,
                    }),
                }),
                businessEmail: Yup.string().when("registrationType", {
                  is: "business",
                  then: (s) =>
                    s.email("Invalid email").when("alreadyHasAccount", {
                      is: "no",
                      then: (ss) => ss.required("Required"),
                      otherwise: (ss) => ss,
                    }),
                }),
                profilePicture: Yup.mixed()
                  .nullable()
                  .test(
                    "profile-picture-required",
                    "Profile picture is required",
                    (v) => v instanceof File,
                  ),
                businessPicture: Yup.mixed()
                  .nullable()
                  .when("registrationType", {
                    is: "business",
                    then: (s) =>
                      s.test(
                        "business-picture-required",
                        "Business picture is required",
                        (v) => v instanceof File,
                      ),
                    otherwise: (s) => s.notRequired(),
                  }),
                businessRegistrationNumber: Yup.string(),
                taxNumber: Yup.string(),
                latitude: Yup.number()
                  .typeError("Latitude must be a number")
                  .required("Required"),
                longitude: Yup.number()
                  .typeError("Longitude must be a number")
                  .required("Required"),
                accuracy: Yup.number()
                  .typeError("Accuracy must be a number")
                  .required("Required"),
                radius: Yup.number()
                  .typeError("Radius must be a number")
                  .min(5, "Radius must be at least 5 km")
                  .max(50, "Radius must be at most 50 km")
                  .required("Required"),
                streetNumber: Yup.string().required("Required"),
                streetName: Yup.string().required("Required"),
                suburb: Yup.string().required("Required"),
                city: Yup.string().required("Required"),
                province: Yup.string().required("Required"),
                country: Yup.string().required("Required"),
                postalCode: Yup.string().required("Required"),
              }),
            )}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const formData = new FormData();
                Object.entries(values).forEach(([k, v]) => {
                  if (k === "registrationType") return;
                  if (v === null || v === undefined || v === "") return;
                  formData.append(k, v);
                });
                formData.set(
                  "alreadyHasAccount",
                  values.alreadyHasAccount ?? "",
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
              setFieldTouched,
              validateForm,
              isSubmitting,
              errors,
              touched,
              submitCount,
            }) => {
              const showUserFields = values.alreadyHasAccount === "no";
              const isBusiness = values.registrationType === "business";
              const requiresLogin =
                values.alreadyHasAccount === "yes" &&
                !localStorage.getItem("access_token");
              const currentStep = Math.min(activeStep, 4);

              const progress = getRegistrationProgress(values, {
                isBusiness,
                showUserFields,
                requiresLogin,
              });
              const progressLabel = getProgressLabel(progress);
              const profileReady = values.profilePicture instanceof File;
              const verificationReady = Boolean(values.verificationCode);
              const addressReady = isAddressStepComplete(values);
              const businessReady =
                !isBusiness || requiresLogin
                  ? true
                  : Boolean(values.businessName) &&
                    Boolean(values.businessEmail) &&
                    values.businessPicture instanceof File;

              const stepLabels = [
                "Account setup",
                "Identity",
                "Business",
                "Address",
                "Review & submit",
              ];

              const getStepFields = (step) => {
                if (step === 0) {
                  if (values.alreadyHasAccount === "yes") {
                    return [
                      "registrationType",
                      "alreadyHasAccount",
                      "existingEmail",
                      "existingPassword",
                    ];
                  }
                  return [
                    "registrationType",
                    "alreadyHasAccount",
                    "email",
                    "password",
                    "confirmPassword",
                  ];
                }

                if (step === 1) {
                  if (showUserFields) {
                    const fields = [
                      "title",
                      "firstName",
                      "lastName",
                      "hasIdNumber",
                      "profilePicture",
                      "verificationCode",
                    ];
                    fields.push(
                      values.hasIdNumber === "yes"
                        ? "idNumber"
                        : "passportNumber",
                    );
                    return fields;
                  }

                  if (
                    values.registrationType === "sole" &&
                    values.alreadyHasAccount === "yes" &&
                    !requiresLogin
                  ) {
                    const fields = [
                      "hasIdNumber",
                      "profilePicture",
                      "verificationCode",
                    ];
                    fields.push(
                      values.hasIdNumber === "yes"
                        ? "idNumber"
                        : "passportNumber",
                    );
                    return fields;
                  }

                  return [];
                }

                if (step === 2 && isBusiness && !requiresLogin) {
                  return [
                    "businessName",
                    "businessEmail",
                    "businessPicture",
                    "profilePicture",
                  ];
                }

                if (step === 3) {
                  return [
                    "latitude",
                    "longitude",
                    "accuracy",
                    "radius",
                    "streetNumber",
                    "streetName",
                    "suburb",
                    "city",
                    "province",
                    "country",
                    "postalCode",
                  ];
                }

                return [];
              };

              const handleNext = async () => {
                const fields = getStepFields(currentStep);
                const formErrors = await validateForm();

                fields.forEach((field) => setFieldTouched(field, true, false));

                const hasStepErrors = fields.some((field) =>
                  Boolean(getIn(formErrors, field)),
                );
                if (hasStepErrors) return;

                if (
                  currentStep === 0 &&
                  values.alreadyHasAccount === "yes" &&
                  !localStorage.getItem("access_token")
                ) {
                  setAuthToast({
                    open: true,
                    severity: "info",
                    message:
                      "Use Login & Continue before moving to the next step",
                  });
                  return;
                }

                if (currentStep === 1 && !isBusiness) {
                  setActiveStep(3);
                  return;
                }

                setActiveStep((prev) => Math.min(4, prev + 1));
              };

              return (
                <Form>
                  <Stack spacing={2.25}>
                    <Box sx={{ p: 0.5 }}>
                      <Stepper
                        activeStep={currentStep}
                        alternativeLabel
                        sx={{
                          overflowX: "auto",
                          pb: { xs: 0.5, sm: 0 },
                          "& .MuiStep-root": {
                            minWidth: { xs: 92, sm: "auto" },
                          },
                          "& .MuiStepLabel-label": {
                            fontSize: { xs: 10, sm: 12 },
                            fontWeight: 600,
                          },
                        }}
                      >
                        {stepLabels.map((label) => (
                          <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>

                    <Box sx={{ p: 0.5 }}>
                      <Stack spacing={1.2}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                          >
                            <AutoAwesomeIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={700}>
                              Smart Progress
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {progress}% · {progressLabel}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 7,
                            borderRadius: 999,
                            bgcolor: "action.hover",
                          }}
                        />
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <Chip
                            size="small"
                            icon={profileReady ? <TaskAltIcon /> : undefined}
                            color={profileReady ? "success" : "default"}
                            label={
                              profileReady
                                ? "Profile picture added"
                                : "Add profile picture"
                            }
                            variant={profileReady ? "filled" : "outlined"}
                          />
                          <Chip
                            size="small"
                            icon={
                              verificationReady ? <TaskAltIcon /> : undefined
                            }
                            color={verificationReady ? "success" : "default"}
                            label={
                              verificationReady
                                ? "Code entered"
                                : "Enter verification code"
                            }
                            variant={verificationReady ? "filled" : "outlined"}
                          />
                          <Chip
                            size="small"
                            icon={businessReady ? <TaskAltIcon /> : undefined}
                            color={businessReady ? "success" : "default"}
                            label={
                              isBusiness
                                ? businessReady
                                  ? "Business info complete"
                                  : "Complete business info"
                                : "Business section optional"
                            }
                            variant={businessReady ? "filled" : "outlined"}
                          />
                          <Chip
                            size="small"
                            icon={addressReady ? <TaskAltIcon /> : undefined}
                            color={addressReady ? "success" : "default"}
                            label={
                              addressReady
                                ? "Address complete"
                                : "Complete address step"
                            }
                            variant={addressReady ? "filled" : "outlined"}
                          />
                        </Stack>
                      </Stack>
                    </Box>

                    {currentStep === 0 && (
                      <StepOneFields
                        values={values}
                        setFieldValue={setFieldValue}
                        errors={errors}
                        touched={touched}
                        submitCount={submitCount}
                        requiresLogin={requiresLogin}
                        loginMutation={loginMutation}
                        passwordInputProps={passwordInputProps}
                        gradientPrimary={gradientPrimary}
                      />
                    )}

                    {currentStep === 1 && (
                      <StepTwoFields
                        values={values}
                        showUserFields={showUserFields}
                        requiresLogin={requiresLogin}
                        setFieldValue={setFieldValue}
                        errors={errors}
                        touched={touched}
                        submitCount={submitCount}
                        sendCodeMutation={sendCodeMutation}
                        setAuthToast={setAuthToast}
                      />
                    )}

                    {currentStep === 2 && (
                      <StepThreeFields
                        values={values}
                        isBusiness={isBusiness}
                        requiresLogin={requiresLogin}
                        setFieldValue={setFieldValue}
                        errors={errors}
                        touched={touched}
                        submitCount={submitCount}
                      />
                    )}

                    {currentStep === 3 && (
                      <StepAddressFields
                        setFieldValue={setFieldValue}
                        values={values}
                      />
                    )}

                    {currentStep === 4 && (
                      <StepCard title="Step 5 · Review & Submit">
                        <Typography variant="body2" color="text.secondary">
                          Review your details and submit your seller onboarding.
                        </Typography>
                        {!requiresLogin && (
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
                              borderRadius: 2,
                              py: 1.2,
                              "&:hover": { opacity: 0.95, boxShadow: "none" },
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
                                <span>
                                  {uploadProgress > 0
                                    ? `${uploadProgress}%`
                                    : "Registering..."}
                                </span>
                              </Stack>
                            ) : (
                              "Register to sell on Easyplug"
                            )}
                          </Button>
                        )}
                      </StepCard>
                    )}

                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="space-between"
                    >
                      <Button
                        variant="outlined"
                        disabled={currentStep === 0}
                        onClick={() =>
                          setActiveStep((prev) => Math.max(0, prev - 1))
                        }
                      >
                        Back
                      </Button>
                      {currentStep < 4 && (
                        <Button
                          variant="contained"
                          sx={{
                            backgroundImage: gradientPrimary,
                            color: "#fff",
                          }}
                          onClick={handleNext}
                        >
                          {currentStep === 3 ? "Review" : "Next"}
                        </Button>
                      )}
                    </Stack>

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
        </Stack>
      </Box>

      <ToastAlert
        open={authToast.open}
        severity={authToast.severity}
        message={authToast.message}
        onClose={handleToastClose}
      />
    </Box>
  );
}
