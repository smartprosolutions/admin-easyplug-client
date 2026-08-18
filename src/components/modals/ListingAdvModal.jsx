import React from "react";
import {
  Dialog,
  DialogContent,
  Divider,
  Button,
  IconButton,
  Stack,
  CircularProgress,
  Box,
  Typography,
  Grid,
  Avatar,
  Autocomplete,
  TextField,
  Chip,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SelectFieldWrapper from "../../components/forms/SelectFieldWrapper";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import RichTextEditor from "../../components/forms/RichTextEditor";
import ToastAlert from "../../components/alerts/ToastAlert";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { gradientPrimary } from "../../theme/theme";
import {
  createAdvert,
  getAdvert,
  updateAdvert,
} from "../../services/advertService";
import {
  getMyListings,
} from "../../services/listingService";
import { resolveListingImagePath } from "../../utils/listingImages";
import {
  compressListingImages,
  listingUploadErrorMessage,
  appendImagesToFormData,
} from "../../utils/compressImage";
import { useUserProfileQuery } from "../../services/queries";
import {
  canManageRecord,
  needsAdminPasswordForRecord,
  isOwnedByUser,
  resolveUserId,
  resolveUserRole,
} from "../../utils/accessControl";
import AdminPasswordDialog from "../../components/modals/AdminPasswordDialog";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Checkbox from "@mui/material/Checkbox";

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

const getImageRef = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img instanceof File) return "";
  return img?.url || img?.path || img?.name || "";
};

const unique = (arr = []) => [...new Set(arr.filter(Boolean))];

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const startOfLocalDay = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const isStartDayInPast = (value) => {
  const startDay = startOfLocalDay(value);
  const today = startOfLocalDay(new Date());
  if (!startDay || !today) return false;
  return startDay.getTime() < today.getTime();
};

const appendAdvertToCachedList = (cached, advert) => {
  if (!advert) return cached;

  if (Array.isArray(cached)) {
    return [advert, ...cached];
  }

  if (cached && Array.isArray(cached.listings)) {
    return { ...cached, listings: [advert, ...cached.listings] };
  }

  if (cached && Array.isArray(cached.adverts)) {
    return { ...cached, adverts: [advert, ...cached.adverts] };
  }

  if (cached && Array.isArray(cached.items)) {
    return { ...cached, items: [advert, ...cached.items] };
  }

  if (cached && Array.isArray(cached.data)) {
    return { ...cached, data: [advert, ...cached.data] };
  }

  return cached;
};

export default function ListingAdvModal() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const fetchItemEnabled = Boolean(
    isEdit && typeof id === "string" && id.trim().length > 0,
  );

  const [toast, setToast] = React.useState({
    open: false,
    severity: "info",
    message: "",
  });
  const { data: profileData, isLoading: isProfileLoading } = useUserProfileQuery({
    retry: false,
  });
  const currentUserId = resolveUserId(profileData);
  const userRole = resolveUserRole(profileData);
  const [adminPasswordOpen, setAdminPasswordOpen] = React.useState(false);
  const [adminPasswordError, setAdminPasswordError] = React.useState("");
  const pendingPayloadRef = React.useRef(null);
  const submitLockRef = React.useRef(false);
  const [saving, setSaving] = React.useState(false);

  const { data: existing, isPending: isFetching } = useQuery({
    queryKey: ["advertisementItem", id],
    queryFn: () => getAdvert(id),
    enabled: fetchItemEnabled,
    retry: false,
  });

  const { data: inventoryData, isPending: isInventoryLoading } = useQuery({
    queryKey: ["myInventoryForFeature", currentUserId],
    queryFn: () => getMyListings(),
    enabled: Boolean(currentUserId),
    retry: false,
  });

  const inventoryOptions = React.useMemo(() => {
    const rows =
      inventoryData?.listings ||
      inventoryData?.data ||
      inventoryData?.items ||
      (Array.isArray(inventoryData) ? inventoryData : []);
    return (rows || [])
      .filter((row) => !row?.isAdvertisement)
      .filter((row) => isOwnedByUser(row, currentUserId))
      .sort((a, b) =>
        String(a?.title || "").localeCompare(String(b?.title || "")),
      );
  }, [inventoryData, currentUserId]);

  const itemData =
    existing?.advert ||
    existing?.advertisement ||
    existing?.listing ||
    existing?.data ||
    existing ||
    null;
  const canEditAdvert = canManageRecord(itemData, currentUserId, userRole);
  const needsAdminPassword = needsAdminPasswordForRecord(
    itemData,
    currentUserId,
    userRole,
  );

  const previewSellerEmail =
    itemData?.seller?.email || itemData?.sellerEmail || "";

  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const MAX_IMAGES = 6;

  const imageResolveOptions = React.useMemo(
    () => ({
      sellerEmail: previewSellerEmail,
      isAdvertisement: true,
      variant: "advert",
    }),
    [previewSellerEmail],
  );

  const getImageName = React.useCallback((raw) => {
    if (typeof raw !== "string") return "image";
    const clean = raw.split("?")[0];
    const parts = clean.split("/");
    return parts[parts.length - 1] || "image";
  }, []);

  const toPreviewItem = React.useCallback(
    (img, index) => {
      if (img instanceof File) {
        return {
          key: `file-${index}-${img.name}-${img.size}`,
          file: img,
          raw: img,
          url: URL.createObjectURL(img),
          isObjectUrl: true,
          name: img.name,
        };
      }

      const raw = typeof img === "string" ? img : img?.url || img?.path || "";
      const resolved = resolveListingImagePath(raw, imageResolveOptions);

      return {
        key: `existing-${index}-${raw}`,
        file: null,
        raw,
        url: resolved || raw,
        isObjectUrl: false,
        name: (typeof img === "object" && img?.name) || getImageName(raw),
      };
    },
    [getImageName, imageResolveOptions],
  );

  const buildFormData = (vals) => {
    const fd = new FormData();
    Object.entries(vals || {}).forEach(([key, value]) => {
      if (key === "images" && Array.isArray(value)) {
        appendImagesToFormData(fd, value);
      } else if (value !== undefined && value !== null) {
        if (typeof value === "object" && !(value instanceof File) && !(value instanceof Blob)) {
          fd.append(key, JSON.stringify(value));
        } else if (value instanceof Blob) {
          fd.append(key, value, value.name || key);
        } else {
          fd.append(key, String(value));
        }
      }
    });
    return fd;
  };

  const createMut = useMutation({
    mutationFn: (vals) => createAdvert(vals),
    onSuccess: async (result) => {
      const createdAdvert =
        result?.advert || result?.listing || result?.data || result || null;

      if (createdAdvert) {
        queryClient.setQueryData(["adverts"], (cached) =>
          appendAdvertToCachedList(cached, createdAdvert),
        );
        queryClient.setQueryData(["sellerAdverts", currentUserId], (cached) =>
          appendAdvertToCachedList(cached, createdAdvert),
        );
      }

      try {
        await queryClient.invalidateQueries({ queryKey: ["advertCatalogue"] });
        await queryClient.invalidateQueries({ queryKey: ["adverts"] });
        await queryClient.invalidateQueries({
          queryKey: ["sellerAdverts", currentUserId],
        });
      } catch {
        // ignore
      }
      setToast({
        open: true,
        severity: "success",
        message: "Campaign created",
      });
      setTimeout(() => navigate("/advertisements"), 700);
    },
    onError: (err) =>
      setToast({
        open: true,
        severity: "error",
        message: listingUploadErrorMessage(err, "Create failed"),
      }),
  });

  const updateMut = useMutation({
    mutationFn: (vals) => updateAdvert(id, vals),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["advertCatalogue"] });
        await queryClient.invalidateQueries({ queryKey: ["adverts"] });
        await queryClient.invalidateQueries({ queryKey: ["advert", id] });
        await queryClient.invalidateQueries({
          queryKey: ["advertisementItem", id],
        });
      } catch {
        // ignore
      }
      setAdminPasswordOpen(false);
      setAdminPasswordError("");
      pendingPayloadRef.current = null;
      setToast({
        open: true,
        severity: "success",
        message: "Campaign updated",
      });
      setTimeout(() => navigate("/advertisements"), 700);
    },
    onError: (err) => {
      const message = listingUploadErrorMessage(err, "Update failed");
      const code = err?.response?.data?.code;
      if (
        code === "ADMIN_PASSWORD_REQUIRED" ||
        code === "ADMIN_PASSWORD_INVALID" ||
        /admin password/i.test(message)
      ) {
        setAdminPasswordError(message);
        setAdminPasswordOpen(true);
        submitLockRef.current = false;
        setSaving(false);
        return;
      }
      setToast({
        open: true,
        severity: "error",
        message,
      });
    },
  });

  const isSaving = createMut.isPending || updateMut.isPending;
  const isBusy = saving || isSaving;

  const initialUrl =
    itemData?.url ||
    itemData?.advertUrl ||
    itemData?.websiteURL ||
    itemData?.link ||
    "";

  const initialImages = React.useMemo(
    () => (Array.isArray(itemData?.images) ? itemData.images : []),
    [itemData?.images],
  );

  const initialFeaturedIds = React.useMemo(() => {
    if (Array.isArray(itemData?.featuredListingIds)) {
      return itemData.featuredListingIds.map(String);
    }
    if (Array.isArray(existing?.featuredListings)) {
      return existing.featuredListings
        .map((row) => row?.listingId || row?.id)
        .filter(Boolean)
        .map(String);
    }
    return [];
  }, [itemData?.featuredListingIds, existing?.featuredListings]);

  const initialValues = {
    title: itemData?.title || "",
    description: itemData?.description || "",
    url: initialUrl,
    images: initialImages,
    status: itemData?.status || "active",
    startsAt: toDateInputValue(itemData?.startsAt || itemData?.starts_at),
    expiresAt: toDateInputValue(
      itemData?.expiresAt || itemData?.expires_at,
    ),
    featuredListingIds: initialFeaturedIds,
  };

  const originalImageRefs = React.useMemo(
    () => unique((itemData?.images || []).map((img) => getImageRef(img))),
    [itemData?.images],
  );

  const submitRef = React.useRef(null);
  const [previews, setPreviews] = React.useState([]);
  const inputRef = React.useRef(null);
  const [imageHelper, setImageHelper] = React.useState("");

  React.useEffect(() => {
    const next = Array.isArray(initialImages)
      ? initialImages.map((img, idx) => toPreviewItem(img, idx))
      : [];
    setPreviews(next);
  }, [initialImages, toPreviewItem]);

  React.useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p?.isObjectUrl && p?.url) {
          try {
            URL.revokeObjectURL(p.url);
          } catch {
            /* ignore */
          }
        }
      });
    };
  }, [previews]);

  const handleClose = () => {
    navigate("/advertisements");
  };

  if (isEdit && !isFetching && !isProfileLoading && itemData && !canEditAdvert) {
    return (
      <Dialog open onClose={handleClose} fullScreen={fullScreen} fullWidth>
        <Stack spacing={2} sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h6" fontWeight={700}>
            Access restricted
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can only edit adverts that belong to your account.
          </Typography>
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" onClick={handleClose}>
              Back to adverts
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={isBusy ? undefined : handleClose}
      fullScreen={fullScreen}
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          maxHeight: fullScreen ? "100dvh" : "calc(100vh - 64px)",
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
          backdropFilter: "blur(20px)",
        },
      }}
      sx={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {isBusy && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 1200,
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              {isEdit ? "Updating..." : "Creating..."}
            </Typography>
          </Stack>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box
          sx={{
            background: (t) =>
              `linear-gradient(120deg, ${t.palette.primary.main} 0%, ${t.palette.secondary.main} 100%)`,
            color: "#fff",
            p: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                background: alpha("#fff", 0.2),
                color: "#fff",
              }}
            >
              <CloudUploadIcon />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{
                  color: "#fff !important",
                  WebkitTextFillColor: "#fff",
                  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
                }}
              >
                {isEdit ? "Edit Campaign" : "Create Campaign"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  color: "#fff !important",
                  WebkitTextFillColor: "#fff",
                  opacity: 0.95,
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                Promote inventory items and/or link to your website
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              disabled={isBusy}
              sx={{
                color: "#fff",
                background: alpha("#fff", 0.1),
                "&:hover": {
                  background: alpha("#fff", 0.2),
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent
          dividers
          sx={{
            p: 3,
            pt: 4,
            position: "relative",
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
          {isBusy && (
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0 }}>
              <Box sx={{ px: 0.5, py: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  {`Uploading... ${uploadProgress || 0}%`}
                </Typography>
              </Box>
              <Box sx={{ width: "100%", height: 3, bgcolor: "divider" }}>
                <Box
                  sx={{
                    width: `${uploadProgress || 0}%`,
                    height: "100%",
                    bgcolor: "primary.main",
                    transition: "width 120ms linear",
                  }}
                />
              </Box>
            </Box>
          )}
          {fetchItemEnabled && isFetching ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Formik
              enableReinitialize
              initialValues={initialValues}
              validationSchema={Yup.object({
                title: Yup.string().trim().required("Campaign title is required"),
                images: Yup.array().max(6, "Maximum 6 images allowed"),
                description: Yup.string(),
                url: Yup.string()
                  .trim()
                  .nullable()
                  .test(
                    "is-url",
                    "Enter a valid URL, e.g. https://example.com",
                    (value) => {
                      if (!value) return true;
                      try {
                        // eslint-disable-next-line no-new
                        new URL(value);
                        return true;
                      } catch {
                        return false;
                      }
                    },
                  ),
                startsAt: Yup.string()
                  .nullable()
                  .test(
                    "not-in-past",
                    "Start date cannot be in the past",
                    function notInPast(value) {
                      if (!value) return true;
                      if (!isStartDayInPast(value)) return true;
                      // Keep an existing campaign's original start day when editing
                      const originalStart = toDateInputValue(
                        itemData?.startsAt || itemData?.starts_at,
                      );
                      return (
                        isEdit &&
                        Boolean(originalStart) &&
                        toDateInputValue(value) === originalStart
                      );
                    },
                  )
                  .test(
                    "not-after-end",
                    "Start date cannot be greater than end date",
                    function notAfterEnd(value) {
                      const { expiresAt } = this.parent;
                      if (!value || !expiresAt) return true;
                      const start = new Date(value);
                      const end = new Date(expiresAt);
                      if (
                        Number.isNaN(start.getTime()) ||
                        Number.isNaN(end.getTime())
                      ) {
                        return true;
                      }
                      return start.getTime() <= end.getTime();
                    },
                  ),
                expiresAt: Yup.string()
                  .nullable()
                  .test(
                    "after-start",
                    "End date cannot be earlier than start date",
                    function afterStart(value) {
                      const { startsAt } = this.parent;
                      if (!value || !startsAt) return true;
                      const start = new Date(startsAt);
                      const end = new Date(value);
                      if (
                        Number.isNaN(start.getTime()) ||
                        Number.isNaN(end.getTime())
                      ) {
                        return true;
                      }
                      return end.getTime() >= start.getTime();
                    },
                  ),
                featuredListingIds: Yup.array().of(Yup.string()),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                if (submitLockRef.current) return;
                submitLockRef.current = true;
                setSaving(true);
                try {
                  const currentExistingRefs = unique(
                    (values.images || [])
                      .filter((img) => !(img instanceof File))
                      .map((img) => getImageRef(img)),
                  );
                  const removedImages = originalImageRefs.filter(
                    (img) => !currentExistingRefs.includes(img),
                  );
                  const toSend = {
                    title: String(values.title || "").trim(),
                    description: values.description || "",
                    url: String(values.url || "").trim(),
                    status: values.status || "active",
                    startsAt: values.startsAt || null,
                    expiresAt: values.expiresAt || null,
                    featuredListingIds: Array.isArray(values.featuredListingIds)
                      ? values.featuredListingIds
                      : [],
                    images: values.images,
                  };

                  if (isEdit) {
                    toSend.existingImages = currentExistingRefs;
                    toSend.retainedImages = currentExistingRefs;
                    toSend.removedImages = removedImages;
                  }

                  toSend.images = await compressListingImages(toSend.images);
                  const payload = buildFormData(toSend);
                  setUploadProgress(0);
                  if (isEdit) {
                    if (needsAdminPassword) {
                      pendingPayloadRef.current = payload;
                      setAdminPasswordError("");
                      setAdminPasswordOpen(true);
                      submitLockRef.current = false;
                      setSaving(false);
                      return;
                    }
                    await updateMut.mutateAsync(payload);
                  } else {
                    await createMut.mutateAsync(payload);
                  }
                } catch (err) {
                  submitLockRef.current = false;
                  setSaving(false);
                  if (!err?.response && err?.name !== "ApiNetworkError") {
                    setToast({
                      open: true,
                      severity: "error",
                      message: listingUploadErrorMessage(err, "Save failed"),
                    });
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({
                submitForm,
                values,
                setFieldValue,
                errors,
                touched,
                setFieldTouched,
                validateField,
              }) => {
                submitRef.current = submitForm;
                const selectedFeatured = inventoryOptions.filter((row) =>
                  (values.featuredListingIds || []).includes(
                    String(row.listingId || row.id),
                  ),
                );

                return (
                  <Form>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                      <TextFieldWrapper
                        name="title"
                        label="Campaign title"
                        placeholder="e.g. Summer sale"
                      />
                      <RichTextEditor
                        label="Promo copy"
                        value={values.description || ""}
                        onChange={(nextValue) =>
                          setFieldValue("description", nextValue)
                        }
                        onBlur={() =>
                          setFieldTouched("description", true, true)
                        }
                        error={Boolean(
                          touched.description && errors.description,
                        )}
                        helperText={
                          touched.description ? errors.description : ""
                        }
                        minHeight={180}
                      />
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                      >
                        <TextFieldWrapper
                          name="startsAt"
                          label="Start date"
                          type="datetime-local"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{
                            min:
                              isEdit &&
                              isStartDayInPast(initialValues.startsAt)
                                ? undefined
                                : toDateInputValue(startOfLocalDay()),
                            max: values.expiresAt || undefined,
                          }}
                          onChange={() => {
                            window.setTimeout(() => {
                              validateField("expiresAt");
                            }, 0);
                          }}
                        />
                        <TextFieldWrapper
                          name="expiresAt"
                          label="End date"
                          type="datetime-local"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{
                            min: values.startsAt || undefined,
                          }}
                          onChange={() => {
                            window.setTimeout(() => {
                              validateField("startsAt");
                            }, 0);
                          }}
                        />
                      </Stack>
                      <TextFieldWrapper
                        name="url"
                        label="Website URL (optional)"
                        placeholder="https://example.com"
                      />
                      <Autocomplete
                        multiple
                        disableCloseOnSelect
                        options={inventoryOptions}
                        loading={isInventoryLoading}
                        value={selectedFeatured}
                        noOptionsText={
                          isInventoryLoading
                            ? "Loading inventory..."
                            : "No inventory items available to promote"
                        }
                        getOptionLabel={(option) =>
                          option?.title ||
                          option?.name ||
                          String(option?.listingId || option?.id || "")
                        }
                        isOptionEqualToValue={(option, value) =>
                          String(option?.listingId || option?.id) ===
                          String(value?.listingId || value?.id)
                        }
                        onChange={(_, selected) => {
                          setFieldValue(
                            "featuredListingIds",
                            selected.map((row) =>
                              String(row.listingId || row.id),
                            ),
                          );
                        }}
                        renderOption={(props, option, { selected }) => {
                          const { key, ...optionProps } = props;
                          return (
                            <li key={key} {...optionProps}>
                              <Checkbox
                                icon={checkboxIcon}
                                checkedIcon={checkboxCheckedIcon}
                                style={{ marginRight: 8 }}
                                checked={selected}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" noWrap>
                                  {option?.title || option?.name || "Untitled"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {[option?.category, option?.type]
                                    .filter(Boolean)
                                    .join(" · ") || "Inventory item"}
                                </Typography>
                              </Box>
                            </li>
                          );
                        }}
                        renderTags={(tagValue, getTagProps) =>
                          tagValue.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={option.listingId || option.id}
                              label={option.title || option.name}
                              size="small"
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Items to promote"
                            placeholder={
                              selectedFeatured.length
                                ? "Add another item..."
                                : "Pick one or more inventory items"
                            }
                            helperText={
                              inventoryOptions.length
                                ? `${selectedFeatured.length} selected · Optional — leave empty for website/brand-only`
                                : isInventoryLoading
                                  ? "Loading your inventory..."
                                  : "Create inventory items first, then you can promote them here"
                            }
                          />
                        )}
                      />
                      <SelectFieldWrapper
                        name="status"
                        label="Status"
                        options={[
                          { value: "active", label: "Active" },
                          { value: "draft", label: "Draft" },
                          { value: "expired", label: "Expired" },
                        ]}
                      />
                      <div>
                        <input
                          ref={inputRef}
                          id="images"
                          name="images"
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const picked = Array.from(e.target.files || []);
                            const pickedPreviewItems = picked.map(
                              (file, idx) =>
                                toPreviewItem(file, idx + previews.length),
                            );
                            const combined =
                              previews.concat(pickedPreviewItems);
                            const limited = combined.slice(0, MAX_IMAGES);

                            if (combined.length > MAX_IMAGES) {
                              setImageHelper(
                                `Maximum ${MAX_IMAGES} images allowed`,
                              );
                            } else {
                              setImageHelper("");
                            }

                            setPreviews(limited);
                            setFieldValue(
                              "images",
                              limited.map((item) => item.file || item.raw),
                            );

                            if (combined.length > MAX_IMAGES) {
                              combined.slice(MAX_IMAGES).forEach((item) => {
                                if (item?.isObjectUrl && item?.url) {
                                  try {
                                    URL.revokeObjectURL(item.url);
                                  } catch {
                                    /* ignore */
                                  }
                                }
                              });
                            }

                            if (inputRef.current) inputRef.current.value = "";
                          }}
                        />

                        <Button
                          variant="outlined"
                          fullWidth
                          sx={{ height: 40 }}
                          startIcon={<CloudUploadIcon />}
                          onClick={() =>
                            inputRef.current && inputRef.current.click()
                          }
                        >
                          Upload campaign images
                        </Button>

                        {previews && previews.length > 0 && (
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            {previews.map((p, idx) => (
                              <Grid item key={p.key || idx}>
                                <Box component="div">
                                  <Box
                                    component="div"
                                    sx={{
                                      width: 100,
                                      height: 100,
                                      borderRadius: 1,
                                      overflow: "hidden",
                                      position: "relative",
                                      boxShadow: 1,
                                    }}
                                  >
                                    <img
                                      src={p.url}
                                      alt={`preview-${idx}`}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        const remaining = previews.filter(
                                          (_, i) => i !== idx,
                                        );
                                        const removed = previews[idx];
                                        if (
                                          removed?.isObjectUrl &&
                                          removed?.url
                                        ) {
                                          try {
                                            URL.revokeObjectURL(removed.url);
                                          } catch {
                                            /* ignore */
                                          }
                                        }
                                        setPreviews(remaining);
                                        setFieldValue(
                                          "images",
                                          remaining.map(
                                            (item) => item.file || item.raw,
                                          ),
                                        );
                                        setImageHelper("");
                                      }}
                                      sx={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        bgcolor: "rgba(0,0,0,0.5)",
                                        color: "#fff",
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: "block",
                                      mt: 0.5,
                                      maxWidth: 100,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {p.name || "image"}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                        {imageHelper ? (
                          <Typography
                            variant="caption"
                            sx={{ color: "warning.main", mt: 0.5 }}
                          >
                            {imageHelper}
                          </Typography>
                        ) : errors.images ? (
                          <Typography
                            variant="caption"
                            sx={{ color: "error.main", mt: 0.5 }}
                          >
                            {errors.images}
                          </Typography>
                        ) : null}
                      </div>
                    </Stack>
                  </Form>
                );
              }}
            </Formik>
          )}
        </DialogContent>

        <Divider />
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button onClick={handleClose} color="inherit" disabled={isBusy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (isBusy || !submitRef.current) return;
              submitRef.current();
            }}
            disabled={isBusy}
            sx={{
              color: "#fff",
              background: gradientPrimary,
              "&:hover": {
                background: gradientPrimary,
                filter: "brightness(1.05)",
              },
            }}
          >
            {isBusy
              ? `${isEdit ? "Updating" : "Creating"}... ${uploadProgress || 0}%`
              : isEdit
                ? "Save"
                : "Create"}
          </Button>
        </Box>

        <ToastAlert
          open={toast.open}
          severity={toast.severity}
          message={toast.message}
          onClose={() => setToast((s) => ({ ...s, open: false }))}
        />
        <AdminPasswordDialog
          open={adminPasswordOpen}
          title="Save campaign changes"
          description="Enter your admin password to edit this campaign."
          confirmText="Save changes"
          loading={updateMut.isPending}
          error={adminPasswordError}
          onClose={() => {
            setAdminPasswordOpen(false);
            setAdminPasswordError("");
            pendingPayloadRef.current = null;
            submitLockRef.current = false;
            setSaving(false);
          }}
          onConfirm={async (adminPassword) => {
            const payload = pendingPayloadRef.current;
            if (!payload) return;
            payload.append("adminPassword", adminPassword);
            submitLockRef.current = true;
            setSaving(true);
            try {
              await updateMut.mutateAsync(payload);
            } catch {
              submitLockRef.current = false;
              setSaving(false);
            }
          }}
        />
      </Box>
    </Dialog>
  );
}
