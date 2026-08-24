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
import { useNavigate, useSearchParams } from "react-router-dom";
import { gradientPrimary } from "../../theme/theme";
import BrandLogo from "../../components/brand/BrandLogo";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import SelectFieldWrapper from "../../components/forms/SelectFieldWrapper";
import LocationAutoComplete from "../../components/form-components/LocationAutoComplete";
import ToastAlert from "../../components/alerts/ToastAlert";
import {
  registerSeller as registerSellerRequest,
  sendVerificationCode,
  verifyVerificationCode,
  login as loginRequest,
  checkSellerRegistrationConflict,
} from "../../services/authService";
import { createPasswordSchema } from "../../utils/passwordValidation";
import {
  createNameFieldSchema,
  sanitizeNameInput,
} from "../../utils/nameValidation";
import {
  createPhoneFieldSchema,
  sanitizePhoneInput,
} from "../../utils/phoneValidation";
import { createSouthAfricanIdSchema } from "../../utils/idValidation";
import { compressImageFile } from "../../utils/compressImage";

const REGISTRATION_STEP_KEYS = [
  "account",
  "identity",
  "business",
  "address",
  "review",
];
const REGISTRATION_DRAFT_KEY = "easyplug_seller_registration_draft";

const isSellerOrAdminUserType = (userType) => {
  const role = String(userType || "")
    .trim()
    .toLowerCase();
  return role === "seller" || role.includes("admin");
};

const registrationConflictMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

async function assertNoSellerRegistrationConflict(payload) {
  try {
    await checkSellerRegistrationConflict(payload);
    return null;
  } catch (err) {
    if (err?.response?.status === 409 || err?.response?.data?.conflict) {
      return registrationConflictMessage(
        err,
        "This account cannot be used for seller registration.",
      );
    }
    throw err;
  }
}

const DEFAULT_REGISTRATION_VALUES = {
  registrationType: "sole",
  alreadyHasAccount: "no",
  existingEmail: "",
  existingPassword: "",
  title: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
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
};

function parseRegistrationStep(param) {
  if (param == null || param === "") return null;
  const asNumber = Number(param);
  if (Number.isInteger(asNumber) && asNumber >= 0 && asNumber <= 4) {
    return asNumber;
  }
  const idx = REGISTRATION_STEP_KEYS.indexOf(String(param).toLowerCase());
  return idx >= 0 ? idx : null;
}

function loadRegistrationDraft() {
  try {
    const raw = sessionStorage.getItem(REGISTRATION_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRegistrationDraft(draft) {
  try {
    sessionStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota / private mode errors */
  }
}

function clearRegistrationDraft() {
  try {
    sessionStorage.removeItem(REGISTRATION_DRAFT_KEY);
  } catch {
    /* no-op */
  }
}

function RegistrationDraftSaver({
  values,
  step,
  codeSentTo,
  verifiedEmail,
  verificationToken,
}) {
  React.useEffect(() => {
    const {
      password,
      confirmPassword,
      existingPassword,
      profilePicture,
      businessPicture,
      ...persistable
    } = values;
    saveRegistrationDraft({
      step: REGISTRATION_STEP_KEYS[step],
      values: persistable,
      codeSentTo,
      verifiedEmail,
      verificationToken,
    });
  }, [values, step, codeSentTo, verifiedEmail, verificationToken]);

  return null;
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
    checks.push(Boolean(values.phone));
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
  // streetNumber, streetName, suburb and postalCode are optional
  // (rural/village areas like parts of Limpopo may not have these)
  const requiredFields = [
    "latitude",
    "longitude",
    "accuracy",
    "radius",
    "city",
    "province",
    "country",
  ];

  return requiredFields.every((field) => {
    const value = values[field];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });
}

function firstFormErrorMessage(formErrors, fields) {
  const candidates =
    Array.isArray(fields) && fields.length
      ? fields
      : Object.keys(formErrors || {});
  for (const field of candidates) {
    const message = getIn(formErrors, field);
    if (message) return String(message);
  }
  return "Please fix the highlighted fields before continuing";
}

function stepForRegistrationField(field, { isBusiness } = {}) {
  if (
    [
      "registrationType",
      "alreadyHasAccount",
      "existingEmail",
      "existingPassword",
      "email",
      "phone",
      "password",
      "confirmPassword",
    ].includes(field)
  ) {
    return 0;
  }
  if (
    [
      "title",
      "firstName",
      "lastName",
      "hasIdNumber",
      "idNumber",
      "passportNumber",
      "profilePicture",
      "verificationCode",
    ].includes(field)
  ) {
    return 1;
  }
  if (
    [
      "businessName",
      "businessEmail",
      "businessPicture",
      "businessRegistrationNumber",
      "taxNumber",
    ].includes(field)
  ) {
    return isBusiness ? 2 : 1;
  }
  if (
    [
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
    ].includes(field)
  ) {
    return 3;
  }
  return 4;
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
            caption: "Register as an individual lister",
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
            name="phone"
            label="Cellphone"
            size="medium"
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g. 0821234567"
            sanitize={sanitizePhoneInput}
            allowOnlyPattern={/[\d+]/}
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
  codeSentTo,
  isEmailVerified,
  onVerificationCodeChange,
}) {
  const showSoleLinkedVerification =
    values.registrationType === "sole" &&
    values.alreadyHasAccount === "yes" &&
    !requiresLogin;

  const emailForCode = values.email || values.existingEmail;
  const codeAlreadySent =
    Boolean(codeSentTo) &&
    codeSentTo.toLowerCase() === String(emailForCode || "").toLowerCase();

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
                  sanitize={sanitizeNameInput}
                  blockDigits
                  inputMode="text"
                  autoComplete="given-name"
                />
                <TextFieldWrapper
                  name="lastName"
                  label="Last name"
                  size="medium"
                  sanitize={sanitizeNameInput}
                  blockDigits
                  inputMode="text"
                  autoComplete="family-name"
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

              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextFieldWrapper
                    name="verificationCode"
                    label="Verification code"
                    size="medium"
                    disabled={isEmailVerified}
                    onChange={(e) => {
                      onVerificationCodeChange?.(e.target.value);
                    }}
                  />
                  <Button
                    variant="outlined"
                    disabled={
                      sendCodeMutation.isPending ||
                      isEmailVerified ||
                      !emailForCode
                    }
                    onClick={() => {
                      if (!emailForCode) {
                        setAuthToast({
                          open: true,
                          severity: "error",
                          message: "Enter email to receive code",
                        });
                        return;
                      }
                      if (
                        showUserFields &&
                        (!String(values.firstName || "").trim() ||
                          !String(values.lastName || "").trim())
                      ) {
                        setAuthToast({
                          open: true,
                          severity: "error",
                          message: "Enter first and last name before sending the code",
                        });
                        return;
                      }
                      sendCodeMutation.mutate({
                        email: emailForCode,
                        firstName: values.firstName,
                        lastName: values.lastName,
                      });
                    }}
                  >
                    {sendCodeMutation.isPending
                      ? "Sending..."
                      : codeAlreadySent
                        ? "Resend"
                        : "Get Code"}
                  </Button>
                </Stack>
                {isEmailVerified ? (
                  <Typography variant="caption" color="success.main">
                    Email verified. You can continue to the next step.
                  </Typography>
                ) : codeAlreadySent ? (
                  <Typography variant="caption" color="text.secondary">
                    Code sent to {codeSentTo}. Enter it to continue.
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Request a verification code before continuing.
                  </Typography>
                )}
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

      <Typography variant="caption" color="text.secondary">
        Rural or village address? Street number, street name, suburb, and postal
        code are optional — you can leave them blank or fill them in manually.
      </Typography>

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
          label="Street Number (optional)"
          size="medium"
        />
        <TextFieldWrapper
          name="streetName"
          label="Street Name (optional)"
          size="medium"
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextFieldWrapper
          name="suburb"
          label="Suburb (optional)"
          size="medium"
        />
        <TextFieldWrapper name="city" label="City / Town" size="medium" disabled />
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
        label="Postal Code (optional)"
        size="medium"
      />
    </StepCard>
  );
}

export default function RegisterUser() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const draft = React.useMemo(() => loadRegistrationDraft(), []);

  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [activeStep, setActiveStepState] = React.useState(() => {
    return (
      parseRegistrationStep(searchParams.get("step")) ??
      parseRegistrationStep(draft?.step) ??
      0
    );
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [codeSentTo, setCodeSentTo] = React.useState(
    () => draft?.codeSentTo || "",
  );
  const [verifiedEmail, setVerifiedEmail] = React.useState(
    () => draft?.verifiedEmail || "",
  );
  const [verificationToken, setVerificationToken] = React.useState(
    () => draft?.verificationToken || "",
  );
  const [authToast, setAuthToast] = React.useState({
    open: false,
    severity: "info",
    message: "",
  });

  const [initialValues] = React.useState(() => ({
    ...DEFAULT_REGISTRATION_VALUES,
    ...(draft?.values || {}),
    // File inputs cannot be restored after refresh
    profilePicture: null,
    businessPicture: null,
    // Keep passwords empty after refresh for safety
    password: "",
    confirmPassword: "",
    existingPassword: "",
  }));

  const goToStep = React.useCallback(
    (stepOrUpdater) => {
      setActiveStepState((prev) => {
        const next =
          typeof stepOrUpdater === "function"
            ? stepOrUpdater(prev)
            : stepOrUpdater;
        const clamped = Math.min(4, Math.max(0, Number(next) || 0));
        setSearchParams(
          (params) => {
            const nextParams = new URLSearchParams(params);
            nextParams.set("step", REGISTRATION_STEP_KEYS[clamped]);
            return nextParams;
          },
          { replace: true },
        );
        return clamped;
      });
    },
    [setSearchParams],
  );

  // Keep URL in sync on first load
  React.useEffect(() => {
    const fromUrl = parseRegistrationStep(searchParams.get("step"));
    if (fromUrl == null) {
      setSearchParams(
        (params) => {
          const nextParams = new URLSearchParams(params);
          nextParams.set("step", REGISTRATION_STEP_KEYS[activeStep]);
          return nextParams;
        },
        { replace: true },
      );
    } else if (fromUrl !== activeStep) {
      setActiveStepState(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation({
    mutationFn: (values) =>
      registerSellerRequest(values, (pct) => setUploadProgress(pct)),
    onSuccess: (data) => {
      clearRegistrationDraft();
      if (data?.accessToken || data?.token) {
        const token = data.accessToken || data.token;
        localStorage.setItem("access_token", token);
      }
      setAuthToast({
        open: true,
        severity: "success",
        message: "Account created",
      });
      setTimeout(() => navigate("/inventory"), 700);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Register failed";
      setAuthToast({ open: true, severity: "error", message: msg });
    },
    onSettled: () => setUploadProgress(0),
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const conflictMessage = await assertNoSellerRegistrationConflict({
        email,
      });
      if (conflictMessage) {
        const error = new Error(conflictMessage);
        error.code = "SELLER_ADMIN_CONFLICT";
        throw error;
      }
      return loginRequest({ email, password });
    },
    onSuccess: (data) => {
      const userType =
        data?.user?.userType ||
        data?.user?.role ||
        data?.data?.user?.userType ||
        data?.userType;
      if (isSellerOrAdminUserType(userType)) {
        try {
          localStorage.removeItem("access_token");
        } catch {
          /* ignore */
        }
        setAuthToast({
          open: true,
          severity: "error",
          message: "This email is already registered as a seller or admin.",
        });
        return;
      }
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
        err?.code === "SELLER_ADMIN_CONFLICT"
          ? err.message
          : err?.response?.data?.message || err?.message || "Login failed";
      setAuthToast({ open: true, severity: "error", message: msg });
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: ({ email, firstName, lastName }) =>
      sendVerificationCode({ email, firstName, lastName }),
    onSuccess: (data, variables) => {
      setCodeSentTo(variables.email);
      setVerifiedEmail("");
      setVerificationToken(data?.verificationToken || "");
      const message = data?.devCode
        ? `SMTP unavailable locally. Your code is ${data.devCode}`
        : data?.message || "Verification code sent";
      setAuthToast({
        open: true,
        severity: data?.devCode ? "warning" : "success",
        message,
      });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to send code";
      setAuthToast({ open: true, severity: "error", message: msg });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: ({ email, code, verificationToken: token }) =>
      verifyVerificationCode({ email, code, verificationToken: token }),
    onSuccess: (data, variables) => {
      setVerifiedEmail(variables.email);
      setAuthToast({
        open: true,
        severity: "success",
        message: data?.message || "Email verified",
      });
    },
    onError: (err) => {
      setVerifiedEmail("");
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid verification code";
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
        width: "100%",
        maxWidth: "100%",
        background: (theme) =>
          `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 34%, ${theme.palette.background.default} 100%)`,
        pt: 0,
        pb: { xs: 2.5, md: 3 },
        px: 0,
        position: "relative",
        overflowX: "hidden",
        overflowY: "auto",
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
        <BrandLogo
          alt="EasyPlug Logo"
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
              Powering EasyPlug Commerce
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
              Create Lister Account
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

          <Formik
            initialValues={initialValues}
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
                  then: () => createNameFieldSchema("First name"),
                }),
                lastName: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: () => createNameFieldSchema("Last name"),
                }),
                email: Yup.string()
                  .email("Invalid email")
                  .when("alreadyHasAccount", {
                    is: "no",
                    then: (s) => s.required("Required"),
                  }),
                phone: Yup.string().when("alreadyHasAccount", {
                  is: "no",
                  then: () => createPhoneFieldSchema({ required: true }),
                }),
                password: Yup.string().when(["alreadyHasAccount", "email"], {
                  is: (alreadyHasAccount) => alreadyHasAccount === "no",
                  then: () => createPasswordSchema({ emailField: "email" }),
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
                  ["hasIdNumber", "alreadyHasAccount", "registrationType"],
                  {
                    is: (has, acct, type) =>
                      has === "yes" &&
                      (acct === "no" || (acct === "yes" && type === "sole")),
                    then: () => createSouthAfricanIdSchema(),
                    otherwise: (s) => s.notRequired(),
                  },
                ),
                passportNumber: Yup.string().when(
                  ["hasIdNumber", "alreadyHasAccount", "registrationType"],
                  {
                    is: (has, acct, type) =>
                      has === "no" &&
                      (acct === "no" || (acct === "yes" && type === "sole")),
                    then: (s) => s.required("Required"),
                    otherwise: (s) => s.notRequired(),
                  },
                ),
                verificationCode: Yup.string().when(
                  ["alreadyHasAccount", "registrationType"],
                  {
                    is: (acct, type) =>
                      acct === "no" || (acct === "yes" && type === "sole"),
                    then: (s) =>
                      s
                        .required("Verification code is required")
                        .min(4, "Enter the verification code sent to your email"),
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
                streetNumber: Yup.string(),
                streetName: Yup.string(),
                suburb: Yup.string(),
                city: Yup.string().required("Required"),
                province: Yup.string().required("Required"),
                country: Yup.string().required("Required"),
                postalCode: Yup.string(),
              }),
            )}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const needsVerification =
                  values.alreadyHasAccount === "no" ||
                  (values.alreadyHasAccount === "yes" &&
                    values.registrationType === "sole");
                const email = values.email || values.existingEmail || "";

                if (
                  needsVerification &&
                  verifiedEmail.toLowerCase() !== String(email).toLowerCase()
                ) {
                  setAuthToast({
                    open: true,
                    severity: "error",
                    message:
                      "Verify your email with the code before submitting",
                  });
                  goToStep(1);
                  return;
                }

                if (
                  !(values.profilePicture instanceof File) ||
                  (values.registrationType === "business" &&
                    !(values.businessPicture instanceof File))
                ) {
                  setAuthToast({
                    open: true,
                    severity: "error",
                    message:
                      "Please re-upload required pictures before submitting (they are cleared if the page was refreshed)",
                  });
                  goToStep(
                    values.registrationType === "business" &&
                      !(values.businessPicture instanceof File)
                      ? 2
                      : 1,
                  );
                  return;
                }

                let profilePicture = values.profilePicture;
                let businessPicture = values.businessPicture;
                try {
                  profilePicture = await compressImageFile(
                    values.profilePicture,
                    250 * 1024,
                  );
                  if (values.businessPicture instanceof File) {
                    businessPicture = await compressImageFile(
                      values.businessPicture,
                      250 * 1024,
                    );
                  }
                } catch (err) {
                  setAuthToast({
                    open: true,
                    severity: "error",
                    message:
                      err?.message ||
                      "Could not compress pictures. Try a smaller JPEG or PNG.",
                  });
                  return;
                }

                const formData = new FormData();
                Object.entries(values).forEach(([k, v]) => {
                  if (k === "registrationType") return;
                  if (k === "profilePicture" || k === "businessPicture") return;
                  if (v === null || v === undefined || v === "") return;
                  formData.append(k, v);
                });
                formData.append(
                  "profilePicture",
                  profilePicture,
                  profilePicture?.name || "profile.jpg",
                );
                if (businessPicture instanceof Blob) {
                  formData.append(
                    "businessPicture",
                    businessPicture,
                    businessPicture?.name || "business.jpg",
                  );
                }
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
              submitForm,
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
              const emailForVerification =
                values.email || values.existingEmail || "";
              const isEmailVerified =
                Boolean(verifiedEmail) &&
                verifiedEmail.toLowerCase() ===
                  emailForVerification.toLowerCase();
              const needsEmailVerification =
                showUserFields ||
                (values.registrationType === "sole" &&
                  values.alreadyHasAccount === "yes" &&
                  !requiresLogin);
              const verificationReady = needsEmailVerification
                ? isEmailVerified
                : true;
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
                    "phone",
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

                // On Identity, allow progressing to "send code" before a code exists
                const fieldsToCheck =
                  currentStep === 1 && needsEmailVerification
                    ? fields.filter((field) => field !== "verificationCode")
                    : fields;

                fieldsToCheck.forEach((field) =>
                  setFieldTouched(field, true, false),
                );

                const hasStepErrors = fieldsToCheck.some((field) =>
                  Boolean(getIn(formErrors, field)),
                );
                if (hasStepErrors) {
                  setAuthToast({
                    open: true,
                    severity: "error",
                    message: firstFormErrorMessage(formErrors, fieldsToCheck),
                  });
                  return;
                }

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

                // New-account email: block seller/admin and any existing account
                if (currentStep === 0 && values.alreadyHasAccount === "no") {
                  try {
                    const conflictMessage =
                      await assertNoSellerRegistrationConflict({
                        email: values.email,
                        checkExistingEmail: true,
                      });
                    if (conflictMessage) {
                      setAuthToast({
                        open: true,
                        severity: "error",
                        message: conflictMessage,
                      });
                      return;
                    }
                  } catch (err) {
                    setAuthToast({
                      open: true,
                      severity: "error",
                      message: registrationConflictMessage(
                        err,
                        "Could not verify email. Please try again.",
                      ),
                    });
                    return;
                  }
                }

                // Existing-account email: block seller/admin before later steps
                if (
                  currentStep === 0 &&
                  values.alreadyHasAccount === "yes" &&
                  localStorage.getItem("access_token")
                ) {
                  try {
                    const conflictMessage =
                      await assertNoSellerRegistrationConflict({
                        email: values.existingEmail,
                      });
                    if (conflictMessage) {
                      try {
                        localStorage.removeItem("access_token");
                      } catch {
                        /* ignore */
                      }
                      setAuthToast({
                        open: true,
                        severity: "error",
                        message: conflictMessage,
                      });
                      return;
                    }
                  } catch (err) {
                    setAuthToast({
                      open: true,
                      severity: "error",
                      message: registrationConflictMessage(
                        err,
                        "Could not verify email. Please try again.",
                      ),
                    });
                    return;
                  }
                }

                // Identity step: block seller/admin ID or passport before continue
                if (currentStep === 1) {
                  const idPayload =
                    values.hasIdNumber === "yes"
                      ? { idNumber: values.idNumber }
                      : { passportNumber: values.passportNumber };
                  const hasIdentityValue = Boolean(
                    String(
                      values.hasIdNumber === "yes"
                        ? values.idNumber
                        : values.passportNumber || "",
                    ).trim(),
                  );
                  if (hasIdentityValue) {
                    try {
                      const conflictMessage =
                        await assertNoSellerRegistrationConflict(idPayload);
                      if (conflictMessage) {
                        setAuthToast({
                          open: true,
                          severity: "error",
                          message: conflictMessage,
                        });
                        return;
                      }
                    } catch (err) {
                      setAuthToast({
                        open: true,
                        severity: "error",
                        message: registrationConflictMessage(
                          err,
                          "Could not verify ID number. Please try again.",
                        ),
                      });
                      return;
                    }
                  }
                }

                // Email verification is sent from Identity step with first/last name
                if (currentStep === 1 && needsEmailVerification) {
                  const email = values.email || values.existingEmail;
                  const code = String(values.verificationCode || "").trim();
                  const firstName = String(values.firstName || "").trim();
                  const lastName = String(values.lastName || "").trim();

                  if (!email) {
                    setAuthToast({
                      open: true,
                      severity: "error",
                      message: "Email is required for verification",
                    });
                    return;
                  }

                  if (
                    codeSentTo.toLowerCase() !== String(email).toLowerCase()
                  ) {
                    if (showUserFields && (!firstName || !lastName)) {
                      setAuthToast({
                        open: true,
                        severity: "error",
                        message:
                          "Enter first and last name, then send the verification code",
                      });
                      return;
                    }

                    try {
                      await sendCodeMutation.mutateAsync({
                        email,
                        firstName: values.firstName,
                        lastName: values.lastName,
                      });
                      setAuthToast({
                        open: true,
                        severity: "success",
                        message:
                          "Verification code sent. Enter it to continue.",
                      });
                    } catch {
                      /* toast handled by mutation */
                    }
                    return;
                  }

                  setFieldTouched("verificationCode", true, false);

                  if (!code) {
                    setAuthToast({
                      open: true,
                      severity: "error",
                      message: "Enter the verification code sent to your email",
                    });
                    return;
                  }

                  if (
                    verifiedEmail.toLowerCase() !==
                    String(email).toLowerCase()
                  ) {
                    if (!verificationToken) {
                      setAuthToast({
                        open: true,
                        severity: "error",
                        message:
                          "Request a verification code before continuing",
                      });
                      return;
                    }
                    try {
                      await verifyCodeMutation.mutateAsync({
                        email,
                        code,
                        verificationToken,
                      });
                    } catch {
                      return;
                    }
                  }
                }

                if (currentStep === 1 && !isBusiness) {
                  goToStep(3);
                  return;
                }

                goToStep((prev) => Math.min(4, prev + 1));
              };

              const handleRegisterClick = async () => {
                const formErrors = await validateForm();
                const errorFields = Object.keys(formErrors || {}).filter(
                  (field) => Boolean(getIn(formErrors, field)),
                );

                if (errorFields.length) {
                  errorFields.forEach((field) =>
                    setFieldTouched(field, true, false),
                  );
                  setAuthToast({
                    open: true,
                    severity: "error",
                    message: firstFormErrorMessage(formErrors, errorFields),
                  });
                  goToStep(
                    stepForRegistrationField(errorFields[0], { isBusiness }),
                  );
                  return;
                }

                await submitForm();
              };

              return (
                <Form>
                  <RegistrationDraftSaver
                    values={values}
                    step={currentStep}
                    codeSentTo={codeSentTo}
                    verifiedEmail={verifiedEmail}
                    verificationToken={verificationToken}
                  />
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
                                ? "Email verified"
                                : "Verify email code"
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
                        codeSentTo={codeSentTo}
                        isEmailVerified={isEmailVerified}
                        onVerificationCodeChange={() => {
                          if (verifiedEmail) setVerifiedEmail("");
                        }}
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
                          Review your details and submit your lister onboarding.
                        </Typography>
                        {!requiresLogin && (
                          <Button
                            type="button"
                            onClick={handleRegisterClick}
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
                              "Register to list on EasyPlug"
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
                          goToStep((prev) => {
                            if (prev === 3 && !isBusiness) return 1;
                            return Math.max(0, prev - 1);
                          })
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
                          disabled={
                            sendCodeMutation.isPending ||
                            verifyCodeMutation.isPending
                          }
                          onClick={handleNext}
                        >
                          {verifyCodeMutation.isPending
                            ? "Verifying..."
                            : sendCodeMutation.isPending
                              ? "Sending code..."
                              : currentStep === 3
                                ? "Review"
                                : "Next"}
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
