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
    ""
  )}/uploads/pictures${emailSeg}/${v.replace(/^\//, "")}`;
}
import { Formik, Form } from "formik";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Container,
  Grid,
  Paper,
  Avatar,
  Typography,
  Button,
  Divider,
  IconButton,
  Stack,
  Chip,
  InputAdornment,
  Link as MuiLink
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
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
import LogoutIcon from "@mui/icons-material/Logout";
import TextFieldWrapper from "../components/forms/TextFieldWrapper";
import {
  getUserProfileInfo,
  updateUser,
  uploadProfilePicture
} from "../services/authService";
import {
  updateSellerInfo,
  updateSellerInfoMe,
  uploadBusinessPicture
} from "../services/sellerInfoService";
import ToastAlert from "../components/alerts/ToastAlert";
import { gradientPrimary } from "../theme/theme";
import { useUserProfileQuery } from "../services/queries";
import ConfirmDialog from "../components/modals/ConfirmDialog";
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
  "&:hover": { background: gradientPrimary, filter: "brightness(0.95)" }
};

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: meData } = useUserProfileQuery();
  const navigate = useNavigate();

  // Derive user/company view models from API response
  const { user, company } = useMemo(() => {
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
      id: u?.id || u?._id
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
      sellerInfoId: s?.id || s?._id
    };

    return { user: userVM, company: companyVM };
  }, [meData]);
  const [editingUser, setEditingUser] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    severity: "info",
    message: ""
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
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
          queryFn: getUserProfileInfo
        });
        id = getUserIdFromMe(fresh);
      }
      if (!id) throw new Error("Missing user ID");
      return updateUser(id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({ open: true, severity: "success", message: "User updated" });
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to update user"
      });
    },
    onSettled: () => setEditingUser(false)
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
          queryFn: getUserProfileInfo
        });
        sid = getSellerInfoIdFromMe(fresh);
      }
      // If no explicit ID available, update current user's seller info via /me
      if (!sid) return updateSellerInfoMe(payload);
      return updateSellerInfo(sid, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({ open: true, severity: "success", message: "Company updated" });
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to update company"
      });
    },
    onSettled: () => setEditingCompany(false)
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file) => uploadProfilePicture(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({
        open: true,
        severity: "success",
        message: "Profile picture updated"
      });
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to update profile picture"
      });
    }
  });

  const uploadBusinessPictureMutation = useMutation({
    mutationFn: async (file) => uploadBusinessPicture(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", "me", "full"] });
      setToast({
        open: true,
        severity: "success",
        message: "Business picture updated"
      });
    },
    onError: (e) => {
      console.error(e);
      setToast({
        open: true,
        severity: "error",
        message: "Failed to update business picture"
      });
    }
  });

  return (
    <Box
      sx={{ bgcolor: "background.default", minHeight: "100%", width: "100%" }}
    >
      <Box
        sx={{
          background: gradientPrimary,
          color: "#fff",
          py: { xs: 4, md: 8 },
          px: { xs: 2, md: 6 }
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={2} alignItems="center">
            <Grid item size={{ xs: 12, md: 8 }}>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {user?.name || "Profile"}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                {(user.role || "User") +
                  " — member since " +
                  new Date(user?.joined).toLocaleString(undefined, {
                    month: "short",
                    year: "numeric"
                  })}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Chip
                  icon={<EmailIcon />}
                  label={user?.email || "-"}
                  color="secondary"
                />
                <Chip icon={<PhoneIcon />} label={user?.phone || "-"} />
              </Stack>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "flex-start", md: "flex-end" }
                }}
              >
                <Box sx={{ position: "relative", width: 120, height: 120 }}>
                  <Avatar
                    src={resolvePictureUrl(user?.profilePicture, user?.email)}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: "secondary.main",
                      fontSize: 36
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
                      color: "#fff"
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
                            message: "Please select a valid image"
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

      <Container maxWidth="xl" sx={{ mt: -6 }}>
        <ToastAlert
          open={toast.open}
          severity={toast.severity}
          message={toast.message}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        />
        <Grid container spacing={3}>
          <Grid item size={{ xs: 12, md: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Account
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                {user?.name || ""}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || ""}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditingUser(true)}
                  sx={gradientButtonSx}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutIcon />}
                  sx={{ mt: 1.5 }}
                  onClick={() => setConfirmOpen(true)}
                >
                  Sign out
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={3}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Typography variant="h6">User Details</Typography>
                {!editingUser ? (
                  <IconButton size="small" onClick={() => setEditingUser(true)}>
                    <EditIcon />
                  </IconButton>
                ) : (
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => setEditingUser(false)}
                      sx={{
                        ...gradientButtonSx,
                        "&:hover": {
                          background: gradientPrimary,
                          filter: "brightness(0.9)"
                        }
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
                onSubmit={async (v) => {
                  updateUserMutation.mutate({ name: v.name, phone: v.phone });
                }}
              >
                {({ submitForm, resetForm }) => (
                  <Form>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Full name
                        </Typography>
                        {editingUser ? (
                          <TextFieldWrapper
                            name="name"
                            label="Full name"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PersonIcon fontSize="small" />
                                </InputAdornment>
                              )
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
                              {user?.name}
                            </Typography>
                          </Stack>
                        )}
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 6 }}>
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
                              )
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
                      <Grid item size={{ xs: 12, sm: 6 }}>
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
                              )
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
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, display: "block" }}
                        >
                          Phone
                        </Typography>
                        {editingUser ? (
                          <TextFieldWrapper
                            name="phone"
                            label="Phone"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIcon fontSize="small" />
                                </InputAdornment>
                              )
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
                      <Grid item size={{ xs: 12 }}>
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
                              )
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
                        <Grid item size={{ xs: 12 }}>
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
                  alignItems: "center"
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ position: "relative", width: 48, height: 48 }}>
                    <Avatar
                      src={resolvePictureUrl(
                        company?.businessPicture,
                        user?.email || company?.businessEmail
                      )}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "primary.main",
                        fontSize: 18
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
                        color: "#fff"
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
                              message: "Please select a valid image"
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
                      onClick={() => setEditingCompany(false)}
                      sx={{
                        ...gradientButtonSx,
                        width: 32,
                        height: 32,
                        "&:hover": {
                          background: gradientPrimary,
                          filter: "brightness(0.9)"
                        }
                      }}
                    >
                      <SaveIcon />
                    </IconButton>
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
                    businessName: v.businessName,
                    businessEmail: v.businessEmail,
                    businessRegistrationNumber: v.businessRegistrationNumber,
                    websiteURL: v.websiteURL,
                    facebookURL: v.facebookURL,
                    instagramURL: v.instagramURL,
                    twitterURL: v.twitterURL,
                    linkedInURL: v.linkedInURL,
                    taxNumber: v.taxNumber
                  };
                  updateCompanyMutation.mutate(payload);
                }}
              >
                {({ submitForm, resetForm, values }) => (
                  <Form>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item size={{ xs: 12, sm: 6 }}>
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
                              )
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
                      <Grid item size={{ xs: 12, sm: 6 }}>
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
                              )
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
                      <Grid item size={{ xs: 12 }}>
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
                              )
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
                      {/* Address: remove label & icon when editing */}
                      <Grid item size={{ xs: 12 }}>
                        {editingCompany ? (
                          <Typography variant="body1">
                            {values.address}
                          </Typography>
                        ) : (
                          <>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mb: 0.5, display: "block" }}
                            >
                              Address
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <LocationOnIcon fontSize="small" />
                              <Typography variant="body1">
                                {values.address}
                              </Typography>
                            </Stack>
                          </>
                        )}
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 6 }}>
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
                              )
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
                      <Grid item size={{ xs: 12, sm: 6 }}>
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
                              )
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
                      <Grid item size={{ xs: 12, sm: 6 }}>
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
                              )
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
                      <Grid item size={{ xs: 12, sm: 6 }}>
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
                              )
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
                      <Grid item size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          Social Profiles
                        </Typography>
                        {editingCompany ? (
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid item size={{ xs: 12, sm: 6 }}>
                              <TextFieldWrapper
                                name="facebookURL"
                                label="Facebook"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <FacebookIcon fontSize="small" />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }}>
                              <TextFieldWrapper
                                name="twitterURL"
                                label="Twitter"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <TwitterIcon fontSize="small" />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }}>
                              <TextFieldWrapper
                                name="instagramURL"
                                label="Instagram"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <InstagramIcon fontSize="small" />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }}>
                              <TextFieldWrapper
                                name="linkedInURL"
                                label="LinkedIn"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <LinkedInIcon fontSize="small" />
                                    </InputAdornment>
                                  )
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
                        <Grid item size={{ xs: 12 }}>
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
          </Grid>

          <Grid item size={{ xs: 12, md: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }} elevation={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Quick Actions
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Button variant="contained" sx={gradientButtonSx}>
                  Manage Users
                </Button>
                <Button variant="outlined">Company Settings</Button>
                <Button variant="text">View Activity</Button>
              </Stack>
            </Paper>
            <Paper sx={{ p: 2, borderRadius: 2, mt: 3 }} elevation={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Stats
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Paper sx={{ p: 1, flex: 1, textAlign: "center" }}>
                  <Typography variant="h6">24</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active Listings
                  </Typography>
                </Paper>
                <Paper sx={{ p: 1, flex: 1, textAlign: "center" }}>
                  <Typography variant="h6">8</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pending Ads
                  </Typography>
                </Paper>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            localStorage.removeItem("access_token");
            queryClient.clear();
            navigate("/login", { replace: true });
          }}
          title="Sign out"
          description="Are you sure you want to sign out?"
          confirmText="Sign out"
          confirmColor="error"
        />
      </Container>
    </Box>
  );
}
