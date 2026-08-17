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
  Chip,
  Typography,
  Grid,
  Avatar,
  TextField,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import SelectFieldWrapper from "../../components/forms/SelectFieldWrapper";
import RichTextEditor from "../../components/forms/RichTextEditor";
import { SERVICES, PRODUCTS, toOptions, OTHER_CATEGORY, resolveCategoryFormValues, resolveCategoryForSubmit } from "../../constants/categories";
import ToastAlert from "../../components/alerts/ToastAlert";
import AdminPasswordDialog from "../../components/modals/AdminPasswordDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { gradientPrimary } from "../../theme/theme";

import {
  createListing as createItem,
  updateListing as updateItem,
  getListing as getItem,
  invalidateListingQueries,
} from "../../services/listingService";
import { addListingToAdvert } from "../../services/advertService";
import { useUserProfileQuery } from "../../services/queries";
import {
  canManageRecord,
  needsAdminPasswordForRecord,
  resolveUserId,
  resolveUserRole,
} from "../../utils/accessControl";
import { resolveListingImagePath } from "../../utils/listingImages";

const getImageRef = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img instanceof File) return "";
  return img?.url || img?.path || img?.name || "";
};

const unique = (arr = []) => [...new Set(arr.filter(Boolean))];

const getImageName = (raw) => {
  if (typeof raw !== "string") return "image";
  const clean = raw.split("?")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] || "image";
};

export default function InventoryModal({
  onClose,
  redirectPath,
  presetType,
  presetCategory,
  lockTypeCategory,
  advertId,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id) && !advertId;
  // For edit mode, only fetch when we have a non-empty string id
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

  const { data: existing, isPending: isFetching } = useQuery({
    queryKey: ["inventoryItem", id],
    queryFn: () => getItem(id),
    // Only run when a non-empty id string is available
    enabled: fetchItemEnabled,
    retry: false,
  });

  const queryClient = useQueryClient();

  // upload progress for create/update
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [keyFeatureInput, setKeyFeatureInput] = React.useState("");

  // helper to convert form values to FormData (images[] appended as files)
  const buildFormData = (vals) => {
    const fd = new FormData();
    Object.entries(vals || {}).forEach(([key, value]) => {
      if (key === "images" && Array.isArray(value)) {
        value.forEach((file) => {
          if (file instanceof File) {
            fd.append("images", file);
          }
        });
      } else if (value !== undefined && value !== null) {
        // serialize non-file objects
        if (typeof value === "object" && !(value instanceof File)) {
          fd.append(key, JSON.stringify(value));
        } else {
          fd.append(key, String(value));
        }
      }
    });
    return fd;
  };

  const resolveRedirect = () => {
    if (typeof redirectPath === "string" && redirectPath.length > 0) {
      return redirectPath;
    }
    return null;
  };

  const closeAfterSuccess = () => {
    if (typeof onClose === "function") {
      onClose();
      return;
    }
    navigate(resolveRedirect() || "/inventory");
  };

  const createMut = useMutation({
    mutationFn: (vals) =>
      advertId
        ? addListingToAdvert(advertId, vals, (pct) => setUploadProgress(pct))
        : createItem(vals, (pct) => setUploadProgress(pct)),
    onSuccess: async () => {
      try {
        await invalidateListingQueries(queryClient);
        if (advertId) {
          await queryClient.invalidateQueries({
            queryKey: ["advert", advertId],
          });
          await queryClient.invalidateQueries({ queryKey: ["adverts"] });
        }
      } catch {
        // ignore
      }
      setToast({
        open: true,
        severity: "success",
        message: advertId ? "Catalogue item added" : "Item created",
      });
      setTimeout(() => closeAfterSuccess(), 700);
    },
    onError: (err) =>
      setToast({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || err.message || "Create failed",
      }),
  });

  const updateMut = useMutation({
    mutationFn: (vals) => updateItem(id, vals, (pct) => setUploadProgress(pct)),
    onSuccess: async () => {
      try {
        await invalidateListingQueries(queryClient);
      } catch {
        // ignore
      }
      setAdminPasswordOpen(false);
      setAdminPasswordError("");
      pendingPayloadRef.current = null;
      setToast({ open: true, severity: "success", message: "Item updated" });
      setTimeout(() => closeAfterSuccess(), 700);
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || err.message || "Update failed";
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

  const itemData = isEdit
    ? existing?.listing ||
      existing?.item ||
      existing?.data ||
      (existing?.subscription ? existing.subscription : existing) ||
      null
    : null;
  const canEditItem = canManageRecord(itemData, currentUserId, userRole);
  const needsAdminPassword = needsAdminPasswordForRecord(
    itemData,
    currentUserId,
    userRole,
  );

  const previewSellerEmail =
    itemData?.seller?.email || itemData?.sellerEmail || "";

  const imageResolveOptions = React.useMemo(
    () => ({
      sellerEmail: previewSellerEmail,
      isAdvertisement: Boolean(itemData?.isAdvertisement),
    }),
    [previewSellerEmail, itemData?.isAdvertisement],
  );

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
    [imageResolveOptions],
  );

  const resolvedType = itemData?.type || presetType || "PRODUCTS";
  const resolvedCategoryRaw = itemData?.category || presetCategory || "";
  const resolvedCategory = resolveCategoryFormValues(
    resolvedCategoryRaw,
    resolvedType,
  );
  const isTypeCategoryLocked = Boolean(lockTypeCategory);

  const initialImages = React.useMemo(
    () => (Array.isArray(itemData?.images) ? itemData.images : []),
    [itemData?.images],
  );

  const initialValues = {
    title: itemData?.title || "",
    description: itemData?.description || "",
    keyFeatures: itemData?.keyFeatures || [],
    price: itemData?.price || "",
    category: resolvedCategory.category,
    customCategory: resolvedCategory.customCategory,
    type: resolvedType,
    images: initialImages,
    status: itemData?.status || "active",
    expires_at: itemData?.expires_at || itemData?.expiresAt || "",
  };

  const originalImageRefs = React.useMemo(
    () => unique(initialImages.map((img) => getImageRef(img))),
    [initialImages],
  );

  const submitRef = React.useRef(null);
  const submitLockRef = React.useRef(false);
  const [saving, setSaving] = React.useState(false);
  const [previews, setPreviews] = React.useState([]);
  const inputRef = React.useRef(null);
  const [imageHelper, setImageHelper] = React.useState("");
  const isBusy =
    saving || createMut.isPending || updateMut.isPending;

  React.useEffect(() => {
    const next = initialImages.map((img, idx) => toPreviewItem(img, idx));
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
    if (typeof onClose === "function") {
      onClose();
      return;
    }
    navigate("/inventory");
  };

  if (isEdit && !isFetching && !isProfileLoading && itemData && !canEditItem) {
    return (
      <Dialog open onClose={handleClose} fullScreen={fullScreen} fullWidth>
        <Stack spacing={2} sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h6" fontWeight={700}>
            Access restricted
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can only edit listings that belong to your account.
          </Typography>
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" onClick={handleClose}>
              Back to inventory
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={handleClose}
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
            background: (theme) =>
              `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
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
                {isEdit ? "Edit Item" : "Add Item"}
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
                {isEdit
                  ? "Update inventory listing details"
                  : "Create a new inventory listing"}
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
                title: Yup.string().required("Required"),
                category: Yup.string().required("Required"),
                customCategory: Yup.string().when("category", {
                  is: OTHER_CATEGORY,
                  then: (schema) =>
                    schema
                      .trim()
                      .required("Please specify the product category")
                      .min(2, "Category must be at least 2 characters")
                      .max(80, "Category must be at most 80 characters"),
                  otherwise: (schema) => schema.notRequired(),
                }),
                price: Yup.number()
                  .typeError("Must be a number")
                  .min(0, "Must be >= 0")
                  .required("Required"),
                images: Yup.array().max(6, "Maximum 6 images allowed"),
                description: Yup.string(),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                if (submitLockRef.current) return;
                submitLockRef.current = true;
                setSaving(true);
                try {
                  const normalizedKeyFeatures = Array.isArray(
                    values.keyFeatures,
                  )
                    ? values.keyFeatures
                    : String(values.keyFeatures || "")
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);
                  const { customCategory, ...rest } = values;
                  const currentExistingRefs = unique(
                    (values.images || [])
                      .filter((img) => !(img instanceof File))
                      .map((img) => getImageRef(img)),
                  );
                  const removedImages = originalImageRefs.filter(
                    (img) => !currentExistingRefs.includes(img),
                  );
                  const toSend = {
                    ...rest,
                    keyFeatures: normalizedKeyFeatures,
                    category: resolveCategoryForSubmit(
                      values.category,
                      customCategory,
                    ),
                  };

                  if (isEdit) {
                    toSend.existingImages = currentExistingRefs;
                    toSend.retainedImages = currentExistingRefs;
                    toSend.removedImages = removedImages;
                  }

                  // convert values to FormData so files are sent correctly
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
                } catch {
                  submitLockRef.current = false;
                  setSaving(false);
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
              }) => {
                const handleAddFeature = () => {
                  const trimmed = keyFeatureInput.trim();
                  if (!trimmed) return;
                  const current = Array.isArray(values.keyFeatures)
                    ? values.keyFeatures
                    : [];
                  if (current.includes(trimmed)) {
                    setKeyFeatureInput("");
                    return;
                  }
                  setFieldValue("keyFeatures", [...current, trimmed]);
                  setKeyFeatureInput("");
                };
                submitRef.current = submitForm;
                return (
                  <Form>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                      <SelectFieldWrapper
                        name="type"
                        label="Type"
                        options={[
                          { value: "SERVICES", label: "Services" },
                          { value: "PRODUCTS", label: "Products" },
                        ]}
                        disabled={isTypeCategoryLocked}
                      />
                      <SelectFieldWrapper
                        name="category"
                        label="Category"
                        options={
                          values.type === "SERVICES"
                            ? toOptions(SERVICES)
                            : toOptions(PRODUCTS)
                        }
                        disabled={isTypeCategoryLocked}
                      />
                      {values.category === OTHER_CATEGORY && (
                        <TextFieldWrapper
                          name="customCategory"
                          label="Specify category"
                          placeholder="e.g. Handmade crafts"
                          helperText="Enter the product or service category"
                          disabled={isTypeCategoryLocked}
                        />
                      )}
                      <TextFieldWrapper name="title" label="Title" />
                      <RichTextEditor
                        label="Description"
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
                      <Box>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                        >
                          <TextField
                            label="Key Feature"
                            fullWidth
                            value={keyFeatureInput}
                            onChange={(e) => setKeyFeatureInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddFeature();
                              }
                            }}
                          />
                          <Button
                            variant="outlined"
                            onClick={handleAddFeature}
                            sx={{ minWidth: 120 }}
                          >
                            Add
                          </Button>
                        </Stack>
                        {Array.isArray(values.keyFeatures) &&
                        values.keyFeatures.length > 0 ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            sx={{ mt: 1 }}
                          >
                            {values.keyFeatures.map((feature, index) => (
                              <Chip
                                key={`${feature}-${index}`}
                                label={feature}
                                onDelete={() => {
                                  const next = values.keyFeatures.filter(
                                    (item, idx) => idx !== index,
                                  );
                                  setFieldValue("keyFeatures", next);
                                }}
                                size="small"
                              />
                            ))}
                          </Stack>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: "block" }}
                          >
                            Add key features one by one.
                          </Typography>
                        )}
                      </Box>
                      <TextFieldWrapper name="price" label="Price" />
                      <SelectFieldWrapper
                        name="status"
                        label="Status"
                        options={[
                          { value: "active", label: "Active" },
                          { value: "draft", label: "Draft" },
                          { value: "sold", label: "Sold" },
                          { value: "expired", label: "Expired" },
                        ]}
                      />
                      <div>
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
                              const MAX = 6;
                              const limited = combined.slice(0, MAX);

                              if (combined.length > MAX) {
                                setImageHelper(
                                  `Maximum ${MAX} images allowed`,
                                );
                              } else {
                                setImageHelper("");
                              }

                              setPreviews(limited);
                              setFieldValue(
                                "images",
                                limited.map((item) => item.file || item.raw),
                              );

                              if (combined.length > MAX) {
                                combined.slice(MAX).forEach((item) => {
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
                            disabled={previews.length >= 6}
                          >
                            Upload images
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
                                      {p.name || p.file?.name || "image"}
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
                ? "Update"
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
          title="Save item changes"
          description="Enter your admin password to edit this inventory item."
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
