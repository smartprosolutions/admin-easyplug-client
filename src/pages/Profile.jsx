import React, { useMemo, useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
})();
// Resolve picture references to absolute URLs served from the backend host.
// Rules:
// - If value is a File, use URL.createObjectURL for preview
// - If value is an absolute URL (http/https), return as is
// - If value starts with '/', prefix with API_ORIGIN
// - Otherwise treat value as a filename under `/uploads/pictures/<email>/` on the API host
function resolvePictureUrl(value, ownerEmail) {
  if (!value) return undefined;
  if (typeof value !== "string") {
    try {
      return URL.createObjectURL(value);
    } catch {
      return undefined;
    }
  }
  const v = value.trim();
  if (!v) return undefined;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return `${API_ORIGIN}${v}`;
  const emailSeg = ownerEmail ? `/${encodeURIComponent(ownerEmail)}` : "";
  return `${API_ORIGIN.replace(
    /\/$/,
    "",
  )}/uploads/pictures${emailSeg}/${v.replace(/^\//, "")}`;
}
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Container,
  Grid,
  Paper,
  Avatar,
  Typography,
  Button,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Link as MuiLink,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/LocalPhone";
import BusinessIcon from "@mui/icons-material/Business";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import PersonIcon from "@mui/icons-material/Person";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import NumbersIcon from "@mui/icons-material/Numbers";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LanguageIcon from "@mui/icons-material/Language";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import LightModeIcon from "@mui/icons-material/LightMode";
import LockResetIcon from "@mui/icons-material/LockReset";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import TextFieldWrapper from "../components/forms/TextFieldWrapper";
import SelectFieldWrapper from "../components/forms/SelectFieldWrapper";
import {
  createNameFieldSchema,
  sanitizeNameInput,
} from "../utils/nameValidation";
import {
  createPhoneFieldSchema,
  sanitizePhoneInput,
} from "../utils/phoneValidation";
import { createPasswordSchema } from "../utils/passwordValidation";
import {
  getUserProfileInfo,
  updateUser,
  uploadProfilePicture,
  changePassword as changePasswordRequest,
  deactivateMyAccount,
  deleteMyAccount,
} from "../services/authService";
import {
  updateSellerInfo,
  updateSellerInfoMe,
  uploadBusinessPicture,
  createCompanyAddress,
  updateCompanyAddress,
  deleteCompanyAddress,
} from "../services/sellerInfoService";
import ToastAlert from "../components/alerts/ToastAlert";
import { gradientPrimary } from "../theme/theme";
import { useUserProfileQuery } from "../services/queries";
import LocationAutoComplete from "../components/form-components/LocationAutoComplete";
import { useNavigate } from "react-router-dom";

// Helpers to safely extract IDs from the profile payload
const getUserIdFromMe = (me) => {
  const u = me?.user || {};
  return u.id || u._id || u.uid || u.userId || u.userID || null;
};

const getSellerInfoIdFromMe = (me) => {
  const s = me?.user?.sellerInfo || {};
  return s.id || s._id || s.sellerInfoId || s.addressId || null;
};

const gradientButtonSx = {
  background: gradientPrimary,
  color: "#fff",
  boxShadow: "none",
  "&:hover": { background: gradientPrimary, filter: "brightness(0.95)" },
};

const TITLE_OPTIONS = [
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
  { value: "Dr", label: "Dr" },
  { value: "Prof", label: "Prof" },
];

const editUserValidationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  firstName: createNameFieldSchema("First name"),
  lastName: createNameFieldSchema("Last name"),
  phone: createPhoneFieldSchema({ required: true, label: "Cellphone" }),
});

const optionalUrlSchema = Yup.string()
  .transform((v) => {
    const trimmed = typeof v === "string" ? v.trim() : v;
    return trimmed === "" ? null : trimmed;
  })
  .nullable()
  .notRequired()
  .url("Enter a valid URL (include https://)");

const editCompanyValidationSchema = Yup.object({
  businessName: Yup.string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .required("Business name is required")
    .min(2, "Business name must be at least 2 characters")
    .max(120, "Business name must be at most 120 characters"),
  businessEmail: Yup.string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .email("Invalid email")
    .required("Business email is required"),
  websiteURL: optionalUrlSchema,
  facebookURL: optionalUrlSchema,
  instagramURL: optionalUrlSchema,
  twitterURL: optionalUrlSchema,
  linkedInURL: optionalUrlSchema,
});

const editAddressValidationSchema = Yup.object({
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
  city: Yup.string().required("Required"),
  province: Yup.string().required("Required"),
  country: Yup.string().required("Required"),
});

const changePasswordValidationSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: createPasswordSchema({ emailField: "email" }).test(
    "different-from-current",
    "New password must be different from the current password",
    function (value) {
      if (!value) return true;
      return value !== this.parent.currentPassword;
    },
  ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm your new password"),
});

const normalizeOptionalUrl = (value) => {
  const trimmed = String(value || "").trim();
  return trimmed || undefined;
};

const normalizeCompanyAddress = (sellerInfo, user) => {
  const fallbackAddress =
    user?.location ||
    (Array.isArray(user?.addresses) && user.addresses.length > 0
      ? user.addresses[0]
      : null);
  const rawAddress = sellerInfo?.address || fallbackAddress;

  if (rawAddress && typeof rawAddress === "object") {
    return {
      id:
        rawAddress?.id ||
        rawAddress?._id ||
        rawAddress?.addressId ||
        sellerInfo?.addressId ||
        "",
      line1:
        rawAddress?.line1 ||
        rawAddress?.street ||
        rawAddress?.streetAddress ||
        rawAddress?.addressLine1 ||
        `${rawAddress?.streetNumber || ""} ${rawAddress?.streetName || ""}`.trim(),
      line2: rawAddress?.line2 || rawAddress?.addressLine2 || "",
      city: rawAddress?.city || rawAddress?.town || "",
      state: rawAddress?.state || rawAddress?.province || "",
      postalCode:
        rawAddress?.postalCode || rawAddress?.zipCode || rawAddress?.zip || "",
      country: rawAddress?.country || "",
      latitude: rawAddress?.latitude || "",
      longitude: rawAddress?.longitude || "",
      accuracy: rawAddress?.accuracy || "",
      radius: rawAddress?.radius || "",
      streetNumber: rawAddress?.streetNumber || "",
      streetName: rawAddress?.streetName || rawAddress?.route || "",
      suburb: rawAddress?.suburb || rawAddress?.sublocality || "",
      province: rawAddress?.province || rawAddress?.state || "",
      fullAddress:
        rawAddress?.fullAddress ||
        [
          `${rawAddress?.streetNumber || ""} ${rawAddress?.streetName || ""}`.trim(),
          rawAddress?.suburb || "",
          rawAddress?.city || "",
          rawAddress?.province || rawAddress?.state || "",
          rawAddress?.country || "",
          rawAddress?.postalCode || "",
        ]
          .map((part) => String(part || "").trim())
          .filter(Boolean)
          .join(", "),
    };
  }

  return {
    id: sellerInfo?.addressId || fallbackAddress?.addressId || "",
    line1: typeof rawAddress === "string" ? rawAddress : "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    latitude: "",
    longitude: "",
    accuracy: "",
    radius: "",
    streetNumber: "",
    streetName: "",
    suburb: "",
    province: "",
    fullAddress: "",
  };
};

const formatAddressPreview = (address) => {
  const line1FromStreet = `${address?.streetNumber || ""} ${address?.streetName || ""}`.trim();
  const parts = [
    address?.line1 || line1FromStreet,
    address?.line2,
    address?.suburb,
    address?.city,
    address?.state || address?.province,
    address?.postalCode,
    address?.country,
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (parts.length > 0) return parts.join(", ");

  const fallback =
    typeof address?.fullAddress === "string" ? address.fullAddress.trim() : "";
  return fallback || "No company address yet";
};

export default function Profile({ currentTheme = true, setThemeMode }) {
  const queryClient = useQueryClient();
  const { data: meData } = useUserProfileQuery();
  const navigate = useNavigate();

  // Derive user/company view models from API response
  const { user, company, companyAddress } = useMemo(() => {
    const u = meData?.user || {};
    const s = u?.sellerInfo || {};
    const fullName = `${u?.title ? u.title + " " : ""}${u?.firstName || ""} ${
      u?.lastName || ""
    }`.trim();
    const initials = `${(u?.firstName || "").charAt(0)}${(
      u?.lastName || ""
    ).charAt(0)}`.toUpperCase();

    const userVM = {
      name: fullName,
      title: u?.title || "",
      firstName: u?.firstName || "",
      lastName: u?.lastName || "",
      avatarInitials: initials,
      email: u?.email || "",
      phone: u?.phone || "",
      role: u?.userType || "",
      idOrPassport:
        u?.idNumber ||
        s?.idNumber ||
        u?.passportNumber ||
        s?.passportNumber ||
        "",
      joined: u?.createdAt || new Date().toISOString(),
      profilePicture: u?.profilePicture || u?.avatarUrl || "",
      id: u?.id || u?._id || u?.userId,
    };

    const companyVM = {
      addressId: s?.addressId || "",
      businessName: s?.businessName || "",
      businessEmail: s?.businessEmail || "",
      businessRegistrationNumber: s?.businessRegistrationNumber || "",
      businessPicture: s?.businessPicture || "",
      websiteURL: s?.websiteURL || "",
      facebookURL: s?.facebookURL || "",
      instagramURL: s?.instagramURL || "",
      twitterURL: s?.twitterURL || "",
      linkedInURL: s?.linkedInURL || "",
      verified: !!s?.verified,
      status: s?.status || "",
      address: s?.address || "",
      taxNumber: s?.taxNumber || "",
      sellerInfoId: s?.id || s?._id,
    };

    const companyAddressVM = normalizeCompanyAddress(s, u);

    return {
      user: userVM,
      company: companyVM,
      companyAddress: companyAddressVM,
    };
  }, [meData]);
  const [editingUser, setEditingUser] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [editingCompanyAddress, setEditingCompanyAddress] = useState(false);
  const [isAddressLocationLoading, setIsAddressLocationLoading] =
    useState(false);
  const [toast, setToast] = useState({
    open: false,
    severity: "info",
    message: "",
  });
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deleteReasonKey, setDeleteReasonKey] = useState("");
  const [deleteReasonDetail, setDeleteReasonDetail] = useState("");
  // Mutations: update user, update company, upload pictures
  const updateUserMutation = useMutation({
    mutationFn: async (payload) => {
      // Resolve user ID from current view model, cache, or fresh fetch
      let id = user?.id || getUserIdFromMe(meData);
      if (!id) {
        const cached = queryClient.getQueryData(["user", "me", "full"]);
        id = getUserIdFromMe(cached);
      }
      if (!id) {
        const fresh = await queryClient.fetchQuery({
          queryKey: ["user", "me", "full"],
          queryFn: getUserProfileInfo,
        });
        id = getUserIdFromMe(fresh);
      }
      if (!id) throw new Error("Missing user ID");
      return updateUser(id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({ open: true, severity: "success", message: "User updated" });
      setEditProfileModalOpen(false);
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message:
          e?.response?.data?.message || e?.message || "Failed to update user",
      });
    },
    onSettled: () => setEditingUser(false),
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (payload) => {
      let sid =
        company?.sellerInfoId ||
        company?.addressId ||
        getSellerInfoIdFromMe(meData);
      if (!sid) {
        const cached = queryClient.getQueryData(["user", "me", "full"]);
        sid = getSellerInfoIdFromMe(cached);
      }
      if (!sid) {
        const fresh = await queryClient.fetchQuery({
          queryKey: ["user", "me", "full"],
          queryFn: getUserProfileInfo,
        });
        sid = getSellerInfoIdFromMe(fresh);
      }
      // If no explicit ID available, update current user's seller info via /me
      if (!sid) return updateSellerInfoMe(payload);
      return updateSellerInfo(sid, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setEditingCompany(false);
      setToast({ open: true, severity: "success", message: "Company updated" });
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message:
          e?.response?.data?.message ||
          e?.message ||
          "Failed to update company",
      });
    },
    onSettled: () => setEditingCompany(false),
  });

  const createCompanyAddressMutation = useMutation({
    mutationFn: async (payload) => {
      const sid = company?.sellerInfoId || getSellerInfoIdFromMe(meData);
      return createCompanyAddress(payload, sid);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({
        open: true,
        severity: "success",
        message: "Company address created",
      });
      setEditingCompanyAddress(false);
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to create company address",
      });
    },
  });

  const updateCompanyAddressMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const sid = company?.sellerInfoId || getSellerInfoIdFromMe(meData);
      return updateCompanyAddress(id, payload, sid);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({
        open: true,
        severity: "success",
        message: "Company address updated",
      });
      setEditingCompanyAddress(false);
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to update company address",
      });
    },
  });

  const deleteCompanyAddressMutation = useMutation({
    mutationFn: async (addressId) => {
      const sid = company?.sellerInfoId || getSellerInfoIdFromMe(meData);
      return deleteCompanyAddress(addressId, sid);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({
        open: true,
        severity: "success",
        message: "Company address deleted",
      });
      setEditingCompanyAddress(false);
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to delete company address",
      });
    },
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file) => uploadProfilePicture(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({
        open: true,
        severity: "success",
        message: "Profile picture updated",
      });
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to update profile picture",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload) => changePasswordRequest(payload),
    onSuccess: (data) => {
      setChangePasswordOpen(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setToast({
        open: true,
        severity: "success",
        message: data?.message || "Password changed successfully",
      });
    },
    onError: (e) => {
      setToast({
        open: true,
        severity: "error",
        message:
          e?.response?.data?.message ||
          e?.message ||
          "Failed to change password",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateMyAccount(deactivateReason.trim()),
    onSuccess: () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("auth_user");
      setDeactivateOpen(false);
      setToast({ open: true, severity: "success", message: "Account deactivated. You have been signed out." });
      setTimeout(() => window.location.href = "/login", 900);
    },
    onError: (e) => {
      setToast({ open: true, severity: "error", message: e?.response?.data?.message || "Failed to deactivate account." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMyAccount(builtDeleteReason),
    onSuccess: () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("auth_user");
      setDeleteOpen(false);
      setToast({ open: true, severity: "success", message: "Your account has been deleted." });
      setTimeout(() => window.location.href = "/login", 900);
    },
    onError: (e) => {
      setToast({ open: true, severity: "error", message: e?.response?.data?.message || "Failed to delete account." });
    },
  });

  const DELETE_REASON_OPTIONS = [
    { value: "not_using", label: "I'm not using EasyPlug anymore" },
    { value: "privacy", label: "Privacy concerns" },
    { value: "too_many_emails", label: "Too many emails / notifications" },
    { value: "found_alternative", label: "I found an alternative" },
    { value: "bad_experience", label: "Bad experience on the platform" },
    { value: "other", label: "Other" },
  ];

  const builtDeleteReason = (() => {
    const selected = DELETE_REASON_OPTIONS.find((o) => o.value === deleteReasonKey);
    const label = selected?.label || "";
    const detail = deleteReasonDetail.trim();
    if (!label && !detail) return "";
    if (deleteReasonKey === "other") return detail;
    if (detail) return `${label}. ${detail}`;
    return label;
  })();

  const canSubmitDelete =
    Boolean(deleteReasonKey) &&
    builtDeleteReason.trim().length >= 10 &&
    (deleteReasonKey !== "other" || deleteReasonDetail.trim().length >= 10);

  const uploadBusinessPictureMutation = useMutation({
    mutationFn: async (file) => uploadBusinessPicture(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({
        open: true,
        severity: "success",
        message: "Business picture updated",
      });
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to update business picture",
      });
    },
  });

  const hasCompanyAddress =
    Boolean(companyAddress?.id) ||
    Boolean(companyAddress?.line1) ||
    Boolean(companyAddress?.fullAddress) ||
    Boolean(companyAddress?.streetName) ||
    Boolean(companyAddress?.city) ||
    Boolean(companyAddress?.province);

  const isAddressMutationPending =
    createCompanyAddressMutation.isPending ||
    updateCompanyAddressMutation.isPending ||
    deleteCompanyAddressMutation.isPending;

  const joinedDate = user?.joined ? new Date(user.joined) : null;
  const isJoinedDateValid =
    joinedDate instanceof Date && !Number.isNaN(joinedDate.getTime());
  const joinedYear = isJoinedDateValid ? joinedDate.getFullYear() : "-";
  const accountAgeDays = isJoinedDateValid
    ? Math.max(
        1,
        Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)),
      )
    : 0;

  const sellerProfileFields = [
    company?.businessName,
    company?.businessEmail,
    company?.businessRegistrationNumber,
    company?.taxNumber,
    user?.phone,
    user?.email,
    companyAddress?.line1 || companyAddress?.fullAddress,
  ];
  const completedSellerProfileFields = sellerProfileFields.filter(
    (value) => Boolean(String(value || "").trim()),
  ).length;
  const sellerProfileCompletion = Math.round(
    (completedSellerProfileFields / sellerProfileFields.length) * 100,
  );

  const sellerStats = [
    {
      label: "Profile Completion",
      value: `${sellerProfileCompletion}%`,
      sub: `${completedSellerProfileFields}/${sellerProfileFields.length} key fields complete`,
    },
    {
      label: "Verification",
      value: company?.verified ? "Verified" : "Pending",
      sub: company?.verified
        ? "Trusted seller profile"
        : "Complete checks to verify",
    },
    {
      label: "Address Setup",
      value: hasCompanyAddress ? "Added" : "Missing",
      sub: hasCompanyAddress ? "Business location configured" : "Add business location",
    },
    {
      label: "Member Since",
      value: String(joinedYear),
      sub: accountAgeDays > 0 ? `${accountAgeDays} day(s) on platform` : "Join date unavailable",
    },
  ];

  const toDecimalOrNull = (value) => {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSaveCompanyAddress = (values) => {
    const line1Text = String(values.line1 || "").trim();
    const line1Parts = line1Text.split(/\s+/).filter(Boolean);
    const inferredStreetNumber =
      !values.streetNumber && line1Parts.length > 1 ? line1Parts[0] : "";
    const inferredStreetName =
      !values.streetName && line1Parts.length > 1
        ? line1Parts.slice(1).join(" ")
        : "";

    const payload = {
      latitude: toDecimalOrNull(values.latitude),
      longitude: toDecimalOrNull(values.longitude),
      accuracy: toDecimalOrNull(values.accuracy),
      radius: toDecimalOrNull(values.radius),
      streetNumber: values.streetNumber || inferredStreetNumber,
      streetName: values.streetName || inferredStreetName,
      suburb: values.suburb,
      city: values.city,
      province: values.province || values.state,
      country: values.country,
      postalCode: values.postalCode,
      line1: values.line1,
      line2: values.line2,
      state: values.state,
      fullAddress: values.fullAddress,
    };

    if (values.id) {
      updateCompanyAddressMutation.mutate({ id: values.id, payload });
      return;
    }

    createCompanyAddressMutation.mutate(payload);
  };

  const handleDeleteCompanyAddress = (addressId) => {
    if (!addressId && !hasCompanyAddress) return;
    deleteCompanyAddressMutation.mutate(addressId || companyAddress?.id);
  };

  return (
    <Box
      sx={{ bgcolor: "background.default", minHeight: "100%", width: "100%" }}
    >
      <Box
        sx={{
          background: gradientPrimary,
          color: "#fff",
          py: { xs: 3, sm: 4, md: 8 },
          px: { xs: 2, md: 6 },
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: 28, sm: 38, md: 48 } }}>
                {user?.name || "Profile"}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                {(user.role || "User") +
                  " — member since " +
                  new Date(user?.joined).toLocaleString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
                <Chip
                  icon={<EmailIcon />}
                  label={user?.email || "-"}
                  color="secondary"
                />
                <Chip icon={<PhoneIcon />} label={user?.phone || "-"} />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ExploreOutlinedIcon />}
                  onClick={() =>
                    window.dispatchEvent(new Event("easyplug:start-tour"))
                  }
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.55)",
                    "&:hover": {
                      borderColor: "#fff",
                      bgcolor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  Take a tour
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", md: "flex-end" },
                }}
              >
                <Box sx={{ position: "relative", width: 120, height: 120 }}>
                  <Avatar
                    src={resolvePictureUrl(user?.profilePicture, user?.email)}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: "secondary.main",
                      fontSize: 36,
                    }}
                  >
                    {user?.avatarInitials || ""}
                  </Avatar>
                  <Button
                    component="label"
                    size="small"
                    sx={{
                      position: "absolute",
                      right: -8,
                      bottom: -8,
                      minWidth: 0,
                      p: 1,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                    <input
                      hidden
                      accept="image/png,image/jpeg,image/jpg,image/webp;capture=camera"
                      type="file"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/")) {
                          setToast({
                            open: true,
                            severity: "warning",
                            message: "Please select a valid image",
                          });
                          return;
                        }
                        // Use mutation; no need to set local preview because refetch will update
                        uploadProfilePictureMutation.mutate(file);
                      }}
                    />
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: { xs: -2, sm: -3, md: -6 } }}>
        <ToastAlert
          open={toast.open}
          severity={toast.severity}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }} sx={{ display: { xs: "block", md: "none" } }}>
            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Seller Stats
              </Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {sellerStats.map((stat) => (
                  <Grid key={stat.label} size={{ xs: 6 }}>
                    <Paper sx={{ p: 1, height: "100%", textAlign: "center" }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.25 }}
                      >
                        {stat.sub}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 9 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={3}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="h6">User Details</Typography>
                {!editingUser ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LockResetIcon />}
                      onClick={() => setChangePasswordOpen(true)}
                    >
                      Change password
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => setEditProfileModalOpen(true)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Stack>
                ) : (
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => setEditingUser(false)}
                      sx={{
                        ...gradientButtonSx,
                        "&:hover": {
                          background: gradientPrimary,
                          filter: "brightness(0.9)",
                        },
                      }}
                    >
                      <SaveIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="inherit"
                      onClick={() => {
                        setEditingUser(false);
                      }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
              <Formik
                initialValues={user}
                enableReinitialize
                validationSchema={editUserValidationSchema}
                onSubmit={async (v) => {
                  updateUserMutation.mutate({
                    title: v.title,
                    firstName: String(v.firstName || "").trim(),
                    lastName: String(v.lastName || "").trim(),
                    phone: sanitizePhoneInput(v.phone),
                  });
                }}
              >
                {({ submitForm, resetForm }) => (
                  <Form>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Title
                        </Typography>
                        {editingUser ? (
                          <SelectFieldWrapper
                            name="title"
                            label="Title"
                            options={TITLE_OPTIONS}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <PersonIcon fontSize="small" />
                            <Typography variant="body1">
                              {user?.title || "-"}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          First name
                        </Typography>
                        {editingUser ? (
                          <TextFieldWrapper
                            name="firstName"
                            label="First name"
                            sanitize={sanitizeNameInput}
                            blockDigits
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PersonIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <PersonIcon fontSize="small" />
                            <Typography variant="body1">
                              {user?.firstName || "-"}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Last name
                        </Typography>
                        {editingUser ? (
                          <TextFieldWrapper
                            name="lastName"
                            label="Last name"
                            sanitize={sanitizeNameInput}
                            blockDigits
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PersonIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <PersonIcon fontSize="small" />
                            <Typography variant="body1">
                              {user?.lastName || "-"}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Role
                        </Typography>
                        {editingUser ? (
                          <TextFieldWrapper
                            name="role"
                            label="Role"
                            disabled
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <WorkOutlineIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <WorkOutlineIcon fontSize="small" />
                            <Typography variant="body1">
                              {user?.role}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Email
                        </Typography>
                        {editingUser ? (
                          <TextFieldWrapper
                            name="email"
                            label="Email"
                            disabled
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <EmailIcon fontSize="small" />
                            <Typography variant="body1">
                              {user?.email}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Cellphone
                        </Typography>
                        {editingUser ? (
                          <TextFieldWrapper
                            name="phone"
                            label="Cellphone"
                            sanitize={sanitizePhoneInput}
                            inputMode="tel"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <PhoneIcon fontSize="small" />
                            <Typography variant="body1">
                              {user?.phone}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Identification / Passport
                        </Typography>
                        {editingUser ? (
                          <TextFieldWrapper
                            name="idOrPassport"
                            label="Identification / Passport"
                            disabled
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <NumbersIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <NumbersIcon fontSize="small" />
                            <Typography variant="body1">
                              {user?.idOrPassport || "-"}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      {editingUser && (
                        <Grid size={{ xs: 12 }}>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button
                              variant="contained"
                              onClick={submitForm}
                              startIcon={<SaveIcon />}
                              sx={gradientButtonSx}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                resetForm();
                                setEditingUser(false);
                              }}
                              startIcon={<CancelIcon />}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        </Grid>
                      )}
                    </Grid>
                  </Form>
                )}
              </Formik>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }} elevation={3}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ position: "relative", width: 48, height: 48 }}>
                    <Avatar
                      src={resolvePictureUrl(
                        company?.businessPicture,
                        user?.email || company?.businessEmail,
                      )}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "primary.main",
                        fontSize: 18,
                      }}
                    >
                      {(company.businessName || "").charAt(0).toUpperCase()}
                    </Avatar>
                    <Button
                      component="label"
                      size="small"
                      sx={{
                        position: "absolute",
                        right: -6,
                        bottom: -6,
                        minWidth: 0,
                        p: 0.5,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                      }}
                    >
                      <PhotoCameraIcon fontSize="small" />
                      <input
                        hidden
                        accept="image/png,image/jpeg,image/jpg,image/webp;capture=camera"
                        type="file"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.type.startsWith("image/")) {
                            setToast({
                              open: true,
                              severity: "warning",
                              message: "Please select a valid image",
                            });
                            return;
                          }
                          uploadBusinessPictureMutation.mutate(file);
                        }}
                      />
                    </Button>
                  </Box>
                  <Typography variant="h6">Company</Typography>
                </Stack>
                {!editingCompany ? (
                  <IconButton
                    size="small"
                    onClick={() => setEditingCompany(true)}
                  >
                    <BusinessIcon />
                  </IconButton>
                ) : (
                  <Box>
                    <IconButton
                      size="small"
                      color="inherit"
                      onClick={() => {
                        setEditingCompany(false);
                      }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
              <Formik
                initialValues={company}
                enableReinitialize
                validationSchema={editCompanyValidationSchema}
                validate={(vals) => {
                  const errs = {};
                  if (
                    (vals.businessName || vals.businessEmail) &&
                    !vals.businessPicture
                  ) {
                    errs.businessPicture = "Business picture is required";
                  }
                  return errs;
                }}
                onSubmit={async (v) => {
                  const payload = {
                    businessName: String(v.businessName || "").trim(),
                    businessEmail: String(v.businessEmail || "").trim(),
                    businessRegistrationNumber: v.businessRegistrationNumber,
                    websiteURL: normalizeOptionalUrl(v.websiteURL),
                    facebookURL: normalizeOptionalUrl(v.facebookURL),
                    instagramURL: normalizeOptionalUrl(v.instagramURL),
                    twitterURL: normalizeOptionalUrl(v.twitterURL),
                    linkedInURL: normalizeOptionalUrl(v.linkedInURL),
                    taxNumber: v.taxNumber,
                  };
                  updateCompanyMutation.mutate(payload);
                }}
              >
                {({ submitForm, resetForm, values }) => (
                  <Form>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Business Name
                        </Typography>
                        {editingCompany ? (
                          <TextFieldWrapper
                            name="businessName"
                            label="Business Name"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <BusinessIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <BusinessIcon fontSize="small" />
                            <Typography variant="body1">
                              {values.businessName}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Business Email
                        </Typography>
                        {editingCompany ? (
                          <TextFieldWrapper
                            name="businessEmail"
                            label="Business Email"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <EmailIcon fontSize="small" />
                            <Typography variant="body1">
                              {values.businessEmail}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Registration Number
                        </Typography>
                        {editingCompany ? (
                          <TextFieldWrapper
                            name="businessRegistrationNumber"
                            label="Registration Number"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <NumbersIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <NumbersIcon fontSize="small" />
                            <Typography variant="body1">
                              {values.businessRegistrationNumber}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          Address is managed in the Company Address section
                          below.
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Website URL
                        </Typography>
                        {editingCompany ? (
                          <TextFieldWrapper
                            name="websiteURL"
                            label="Website URL"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LanguageIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <LanguageIcon fontSize="small" />
                            <Typography variant="body1">
                              <MuiLink
                                href={values.websiteURL}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {values.websiteURL}
                              </MuiLink>
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Tax Number
                        </Typography>
                        {editingCompany ? (
                          <TextFieldWrapper
                            name="taxNumber"
                            label="Tax Number"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <ReceiptLongIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <ReceiptLongIcon fontSize="small" />
                            <Typography variant="body1">
                              {values.taxNumber}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Status
                        </Typography>
                        {editingCompany ? (
                          <TextFieldWrapper
                            name="status"
                            label="Status"
                            disabled
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <InfoOutlinedIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <InfoOutlinedIcon fontSize="small" />
                            <Typography variant="body1">
                              {values.status}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Verified
                        </Typography>
                        {editingCompany ? (
                          <TextFieldWrapper
                            name="verified"
                            label="Verified (true/false)"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <VerifiedIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <VerifiedIcon
                              fontSize="small"
                              color={values.verified ? "primary" : "disabled"}
                            />
                            <Typography variant="body1">
                              {values.verified ? "Yes" : "No"}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          Social Profiles
                        </Typography>
                        {editingCompany ? (
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextFieldWrapper
                                name="facebookURL"
                                label="Facebook"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <FacebookIcon fontSize="small" />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextFieldWrapper
                                name="twitterURL"
                                label="Twitter"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <TwitterIcon fontSize="small" />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextFieldWrapper
                                name="instagramURL"
                                label="Instagram"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <InstagramIcon fontSize="small" />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextFieldWrapper
                                name="linkedInURL"
                                label="LinkedIn"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <LinkedInIcon fontSize="small" />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            {/* Removed duplicate Save/Cancel here; use bottom action buttons */}
                          </Grid>
                        ) : (
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {values.facebookURL && (
                              <MuiLink
                                href={values.facebookURL}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <FacebookIcon />
                              </MuiLink>
                            )}
                            {values.twitterURL && (
                              <MuiLink
                                href={values.twitterURL}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <TwitterIcon />
                              </MuiLink>
                            )}
                            {values.instagramURL && (
                              <MuiLink
                                href={values.instagramURL}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <InstagramIcon />
                              </MuiLink>
                            )}
                            {values.linkedInURL && (
                              <MuiLink
                                href={values.linkedInURL}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <LinkedInIcon />
                              </MuiLink>
                            )}
                          </Stack>
                        )}
                      </Grid>
                      {editingCompany && (
                        <Grid size={{ xs: 12 }}>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button
                              variant="contained"
                              onClick={submitForm}
                              startIcon={<SaveIcon />}
                              sx={gradientButtonSx}
                            >
                              Save All
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                resetForm();
                                setEditingCompany(false);
                              }}
                              startIcon={<CancelIcon />}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        </Grid>
                      )}
                    </Grid>
                  </Form>
                )}
              </Formik>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }} elevation={3}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationOnIcon color="primary" />
                  <Typography variant="h6">Company Address</Typography>
                </Stack>

                {!editingCompanyAddress ? (
                  <Tooltip
                    title={hasCompanyAddress ? "Edit Address" : "Add Address"}
                  >
                    <IconButton
                      size="small"
                      onClick={() => setEditingCompanyAddress(true)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>

              <Formik
                initialValues={companyAddress}
                enableReinitialize
                validationSchema={editAddressValidationSchema}
                onSubmit={(values) => {
                  handleSaveCompanyAddress(values);
                }}
              >
                {({ values, submitForm, resetForm, setFieldValue }) => (
                  <Form>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {!editingCompanyAddress ? (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="body1">
                            {formatAddressPreview(values)}
                          </Typography>
                        </Grid>
                      ) : (
                        <>
                          <Grid size={{ xs: 12 }}>
                            <LocationAutoComplete
                              defaultAddressValues={{
                                latitude: values.latitude || "",
                                longitude: values.longitude || "",
                                accuracy: values.accuracy || "",
                                radius: values.radius || "",
                                streetNumber: values.streetNumber || "",
                                streetName: values.streetName || "",
                                suburb: values.suburb || "",
                                city: values.city || "",
                                province: values.province || values.state || "",
                                country: values.country || "",
                                postalCode: values.postalCode || "",
                              }}
                              setAddressInfor={(addressInfo) => {
                                const hasField = (field) =>
                                  Object.prototype.hasOwnProperty.call(
                                    addressInfo,
                                    field,
                                  );
                                const normalize = (value) =>
                                  value === undefined || value === null
                                    ? ""
                                    : String(value);
                                const setIfChanged = (field, nextValue) => {
                                  const next = normalize(nextValue);
                                  const current = normalize(values[field]);
                                  if (current !== next) {
                                    setFieldValue(field, next, false);
                                  }
                                };

                                const streetNumber =
                                  addressInfo.streetNumber || "";
                                const streetName = addressInfo.streetName || "";
                                const line1 =
                                  `${streetNumber} ${streetName}`.trim();
                                const city =
                                  addressInfo.city || addressInfo.suburb || "";
                                const province = addressInfo.province || "";
                                const state = province;
                                const country = addressInfo.country || "";
                                const postalCode = addressInfo.postalCode || "";

                                if (hasField("latitude")) {
                                  setIfChanged(
                                    "latitude",
                                    addressInfo.latitude,
                                  );
                                }
                                if (hasField("longitude")) {
                                  setIfChanged(
                                    "longitude",
                                    addressInfo.longitude,
                                  );
                                }
                                if (hasField("accuracy")) {
                                  setIfChanged(
                                    "accuracy",
                                    addressInfo.accuracy,
                                  );
                                }
                                if (hasField("radius")) {
                                  setIfChanged("radius", addressInfo.radius);
                                }
                                if (hasField("streetNumber")) {
                                  setIfChanged("streetNumber", streetNumber);
                                }
                                if (hasField("streetName")) {
                                  setIfChanged("streetName", streetName);
                                }
                                if (hasField("suburb")) {
                                  setIfChanged(
                                    "suburb",
                                    addressInfo.suburb || "",
                                  );
                                }
                                if (hasField("province")) {
                                  setIfChanged("province", province);
                                }

                                if (line1) setIfChanged("line1", line1);
                                if (city) setIfChanged("city", city);
                                if (state) setIfChanged("state", state);
                                if (country) setIfChanged("country", country);
                                if (postalCode)
                                  setIfChanged("postalCode", postalCode);

                                const fullAddress = [
                                  line1,
                                  addressInfo.suburb || "",
                                  city,
                                  state,
                                  country,
                                  postalCode,
                                ]
                                  .map((part) => String(part || "").trim())
                                  .filter(Boolean)
                                  .join(", ");

                                if (fullAddress) {
                                  setIfChanged("fullAddress", fullAddress);
                                }
                              }}
                              onCurrentLocationLoadingChange={
                                setIsAddressLocationLoading
                              }
                            />
                            {isAddressLocationLoading ? (
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mt: 0.75 }}
                              >
                                <CircularProgress size={16} />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Loading current location...
                                </Typography>
                              </Stack>
                            ) : null}
                          </Grid>

                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextFieldWrapper
                              name="line1"
                              label="Address Line 1"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LocationOnIcon fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextFieldWrapper
                              name="line2"
                              label="Address Line 2"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextFieldWrapper name="city" label="City" />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextFieldWrapper
                              name="state"
                              label="State / Province"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextFieldWrapper
                              name="postalCode"
                              label="Postal Code"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextFieldWrapper name="country" label="Country" />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextFieldWrapper
                              name="fullAddress"
                              label="Full Address (optional)"
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={submitForm}
                                disabled={isAddressMutationPending}
                                sx={gradientButtonSx}
                              >
                                Save Address
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={() => {
                                  resetForm();
                                  setEditingCompanyAddress(false);
                                }}
                                disabled={isAddressMutationPending}
                              >
                                Cancel
                              </Button>
                              {hasCompanyAddress && (
                                <Button
                                  color="error"
                                  variant="outlined"
                                  startIcon={<DeleteOutlineIcon />}
                                  onClick={() =>
                                    handleDeleteCompanyAddress(values.id)
                                  }
                                  disabled={isAddressMutationPending}
                                >
                                  Delete Address
                                </Button>
                              )}
                            </Stack>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Form>
                )}
              </Formik>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Quick Actions
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  sx={gradientButtonSx}
                  onClick={() => navigate("/inventory/add")}
                >
                  Sell old items
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/advertisements/add")}
                >
                  Advertise
                </Button>
                <Button
                  variant="text"
                  onClick={() => setThemeMode?.((prev) => !prev)}
                  startIcon={currentTheme ? <DarkModeIcon /> : <LightModeIcon />}
                >
                  Toggle Theme
                </Button>
              </Stack>
            </Paper>
            <Paper
              sx={{ p: 2, borderRadius: 2, mt: 3, display: { xs: "none", md: "block" } }}
              elevation={3}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Seller Stats
              </Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {sellerStats.map((stat) => (
                  <Grid key={stat.label} size={{ xs: 6 }}>
                    <Paper sx={{ p: 1, height: "100%", textAlign: "center" }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                        {stat.sub}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Dialog
          open={editProfileModalOpen}
          onClose={() => setEditProfileModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, overflow: "hidden", position: "relative" },
          }}
        >
          {updateUserMutation.isPending && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0, 0, 0, 0.24)",
                zIndex: 10,
              }}
            >
              <Stack spacing={1.25} alignItems="center">
                <CircularProgress size={28} />
                <Typography variant="body2" color="common.white">
                  Saving changes...
                </Typography>
              </Stack>
            </Box>
          )}

          <Formik
            initialValues={user}
            enableReinitialize
            validationSchema={editUserValidationSchema}
            onSubmit={async (values) => {
              updateUserMutation.mutate({
                title: values.title,
                firstName: String(values.firstName || "").trim(),
                lastName: String(values.lastName || "").trim(),
                phone: sanitizePhoneInput(values.phone),
              });
            }}
          >
            {({ resetForm, submitForm }) => (
              <Form>
                <Box
                  sx={{
                    background: gradientPrimary,
                    color: "common.white",
                    px: 3,
                    py: 2.4,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "common.white",
                      }}
                    >
                      <PersonAddRoundedIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={700}>
                        Edit Profile
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Update your account details and save changes.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75}>
                      <Tooltip title="Reset changes">
                        <span>
                          <IconButton
                            onClick={() => resetForm()}
                            disabled={updateUserMutation.isPending}
                            sx={{
                              color: "common.white",
                              bgcolor: "rgba(255,255,255,0.12)",
                              "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                            }}
                          >
                            <RefreshRoundedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <IconButton
                        onClick={() => {
                          resetForm();
                          setEditProfileModalOpen(false);
                        }}
                        disabled={updateUserMutation.isPending}
                        sx={{
                          color: "common.white",
                          bgcolor: "rgba(255,255,255,0.12)",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                        }}
                      >
                        <CloseRoundedIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>

                <DialogContent sx={{ pt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SelectFieldWrapper
                        name="title"
                        label="Title"
                        options={TITLE_OPTIONS}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextFieldWrapper
                        name="firstName"
                        label="First name"
                        sanitize={sanitizeNameInput}
                        blockDigits
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextFieldWrapper
                        name="lastName"
                        label="Last name"
                        sanitize={sanitizeNameInput}
                        blockDigits
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextFieldWrapper
                        name="phone"
                        label="Cellphone"
                        sanitize={sanitizePhoneInput}
                        inputMode="tel"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextFieldWrapper
                        name="role"
                        label="Role"
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <WorkOutlineIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextFieldWrapper
                        name="email"
                        label="Email"
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextFieldWrapper
                        name="idOrPassport"
                        label="Identification / Passport"
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <NumbersIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                  <Button
                    onClick={() => {
                      resetForm();
                      setEditProfileModalOpen(false);
                    }}
                    disabled={updateUserMutation.isPending}
                    variant="outlined"
                    color="inherit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    onClick={() => submitForm()}
                    disabled={updateUserMutation.isPending}
                    sx={gradientButtonSx}
                  >
                    Save Changes
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </Dialog>

        <Dialog
          open={changePasswordOpen}
          onClose={() => {
            if (changePasswordMutation.isPending) return;
            setChangePasswordOpen(false);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, overflow: "hidden", position: "relative" },
          }}
        >
          {changePasswordMutation.isPending && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0, 0, 0, 0.24)",
                zIndex: 10,
              }}
            >
              <Stack spacing={1.25} alignItems="center">
                <CircularProgress size={28} />
                <Typography variant="body2" color="common.white">
                  Updating password...
                </Typography>
              </Stack>
            </Box>
          )}

          <Formik
            initialValues={{
              email: user?.email || "",
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            }}
            enableReinitialize
            validationSchema={changePasswordValidationSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                await changePasswordMutation.mutateAsync({
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                  confirmPassword: values.confirmPassword,
                });
                resetForm();
              } catch {
                /* toast handled by mutation */
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ resetForm, submitForm, isSubmitting }) => (
              <Form>
                <Box
                  sx={{
                    background: gradientPrimary,
                    color: "common.white",
                    px: 3,
                    py: 2.4,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "common.white",
                      }}
                    >
                      <LockResetIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={700}>
                        Change Password
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Enter your current password, then choose a new one.
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => {
                        resetForm();
                        setChangePasswordOpen(false);
                      }}
                      disabled={changePasswordMutation.isPending}
                      sx={{
                        color: "common.white",
                        bgcolor: "rgba(255,255,255,0.12)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                      }}
                    >
                      <CloseRoundedIcon />
                    </IconButton>
                  </Stack>
                </Box>

                <DialogContent sx={{ pt: 3 }}>
                  <Stack spacing={2}>
                    <TextFieldWrapper
                      name="currentPassword"
                      label="Current password"
                      type={showCurrentPassword ? "text" : "password"}
                      autoComplete="current-password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showCurrentPassword
                                  ? "Hide current password"
                                  : "Show current password"
                              }
                              onClick={() =>
                                setShowCurrentPassword((s) => !s)
                              }
                              edge="end"
                            >
                              {showCurrentPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextFieldWrapper
                      name="newPassword"
                      label="New password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showNewPassword
                                  ? "Hide new password"
                                  : "Show new password"
                              }
                              onClick={() => setShowNewPassword((s) => !s)}
                              edge="end"
                            >
                              {showNewPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextFieldWrapper
                      name="confirmPassword"
                      label="Confirm new password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showConfirmPassword
                                  ? "Hide confirm password"
                                  : "Show confirm password"
                              }
                              onClick={() =>
                                setShowConfirmPassword((s) => !s)
                              }
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Use at least 8 characters with uppercase, lowercase, a
                      number, and a special character.
                    </Typography>
                  </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                  <Button
                    onClick={() => {
                      resetForm();
                      setChangePasswordOpen(false);
                    }}
                    disabled={changePasswordMutation.isPending || isSubmitting}
                    variant="outlined"
                    color="inherit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    onClick={() => submitForm()}
                    disabled={changePasswordMutation.isPending || isSubmitting}
                    sx={gradientButtonSx}
                  >
                    Update password
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </Dialog>

        {/* Danger Zone */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "error.light",
            bgcolor: (t) => t.palette.mode === "dark" ? "transparent" : "#fff8f8",
          }}
        >
          <Typography variant="h6" fontWeight={800} color="error" sx={{ mb: 0.5 }}>
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Deactivate to pause your account, or permanently delete it.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<PauseCircleOutlineIcon />}
              onClick={() => setDeactivateOpen(true)}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Deactivate account
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteForeverOutlinedIcon />}
              onClick={() => setDeleteOpen(true)}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Delete account
            </Button>
          </Stack>
        </Paper>

        {/* Deactivate dialog */}
        <Dialog
          open={deactivateOpen}
          onClose={() => !deactivateMutation.isPending && setDeactivateOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Deactivate account</DialogTitle>
          <DialogContent dividers>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Your account will be paused and you will be signed out. You can contact support later if you want it reactivated.
            </Alert>
            <TextField
              label="Reason (optional)"
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              placeholder="Tell us why you're pausing your account"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setDeactivateOpen(false)}
              disabled={deactivateMutation.isPending}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              color="warning"
              variant="contained"
              disabled={deactivateMutation.isPending}
              onClick={() => deactivateMutation.mutate()}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {deactivateMutation.isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete dialog */}
        <Dialog
          open={deleteOpen}
          onClose={() => !deleteMutation.isPending && setDeleteOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Delete account</DialogTitle>
          <DialogContent dividers>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              This permanently deletes your account. You will need to register again if you return.
            </Alert>
            <Stack spacing={1.5}>
              <TextField
                select
                label="Why are you leaving?"
                value={deleteReasonKey}
                onChange={(e) => setDeleteReasonKey(e.target.value)}
                fullWidth
                required
              >
                {DELETE_REASON_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={deleteReasonKey === "other" ? "Please tell us more (required)" : "Additional details (optional)"}
                value={deleteReasonDetail}
                onChange={(e) => setDeleteReasonDetail(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                required={deleteReasonKey === "other"}
                helperText="Minimum 10 characters required overall"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              disabled={!canSubmitDelete || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
