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
import { SERVICES, PRODUCTS, toOptions } from "../../constants/categories";
import ToastAlert from "../../components/alerts/ToastAlert";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { gradientPrimary } from "../../theme/theme";
import {
  createAdvert,
  getAdvert,
  updateAdvert,
} from "../../services/advertService";
import { resolveListingImagePath } from "../../utils/listingImages";
import { useUserProfileQuery } from "../../services/queries";
import {
  isOwnedByUser,
  resolveUserId,
} from "../../utils/accessControl";

const formatCurrency = (val) => {
  try {
    const n = Number(val);
    return `R ${Number.isFinite(n) ? n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}`;
  } catch {
    return val;
  }
};

const getImageRef = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img instanceof File) return "";
  return img?.url || img?.path || img?.name || "";
};

const unique = (arr = []) => [...new Set(arr.filter(Boolean))];

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

  const { data: existing, isPending: isFetching } = useQuery({
    queryKey: ["advertisementItem", id],
    queryFn: () => getAdvert(id),
    enabled: fetchItemEnabled,
    retry: false,
  });

  const itemData =
    existing?.advert ||
    existing?.advertisement ||
    existing?.listing ||
    existing?.data ||
    existing ||
    null;
  const canEditAdvert = isOwnedByUser(itemData, currentUserId);

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
        value.forEach((file) => {
          if (file instanceof File) {
            fd.append("images", file);
          }
        });
      } else if (value !== undefined && value !== null) {
        if (typeof value === "object" && !(value instanceof File)) {
          fd.append(key, JSON.stringify(value));
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
        message: "Advertisement created",
      });
      setTimeout(() => navigate("/advertisements"), 700);
    },
    onError: (err) =>
      setToast({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || err.message || "Create failed",
      }),
  });

  const updateMut = useMutation({
    mutationFn: (vals) => updateAdvert(id, vals),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["advertCatalogue"] });
        await queryClient.invalidateQueries({ queryKey: ["adverts"] });
        await queryClient.invalidateQueries({ queryKey: ["advert", id] });
      } catch {
        // ignore
      }
      setToast({
        open: true,
        severity: "success",
        message: "Advertisement updated",
      });
      setTimeout(() => navigate("/advertisements"), 700);
    },
    onError: (err) =>
      setToast({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || err.message || "Update failed",
      }),
  });

  const isSaving = createMut.isPending || updateMut.isPending;

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

  const initialValues = {
    description: itemData?.description || "",
    category: itemData?.category || "",
    type: itemData?.type || "PRODUCTS",
    advertSourceType: initialUrl ? "URL" : "CATALOGUE",
    url: initialUrl,
    images: initialImages,
    status: itemData?.status || "active",
    expires_at: itemData?.expires_at || "",
  };

  const originalImageRefs = React.useMemo(
    () => unique((itemData?.images || []).map((img) => getImageRef(img))),
    [itemData?.images],
  );

  const submitRef = React.useRef(null);
  const submittingRef = React.useRef(false);
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
      {isSaving && (
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
            color: "common.white",
            p: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                background: alpha("#fff", 0.2),
                color: "common.white",
              }}
            >
              <CloudUploadIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {isEdit ? "Edit Advertisement" : "Add Advertisement"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {isEdit
                  ? "Update advertisement listing details"
                  : "Create a new advertisement listing"}
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              disabled={isSaving}
              sx={{
                color: "common.white",
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
          {isSaving && (
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
                images: Yup.array().max(6, "Maximum 6 images allowed"),
                description: Yup.string(),
                advertSourceType: Yup.string()
                  .oneOf(["CATALOGUE", "URL"])
                  .required("Required"),
                url: Yup.string().when("advertSourceType", {
                  is: "URL",
                  then: (schema) =>
                    schema
                      .trim()
                      .required("URL is required")
                      .url("Enter a valid URL, e.g. https://example.com"),
                  otherwise: (schema) => schema.notRequired().nullable(),
                }),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  const isUrlSource = values.advertSourceType === "URL";
                  const currentExistingRefs = unique(
                    (values.images || [])
                      .filter((img) => !(img instanceof File))
                      .map((img) => getImageRef(img)),
                  );
                  const removedImages = originalImageRefs.filter(
                    (img) => !currentExistingRefs.includes(img),
                  );
                  const toSend = {
                    ...values,
                    url: isUrlSource ? String(values.url || "").trim() : "",
                  };

                  if (isEdit) {
                    toSend.existingImages = currentExistingRefs;
                    toSend.retainedImages = currentExistingRefs;
                    toSend.removedImages = removedImages;
                  }

                  const payload = buildFormData(toSend);
                  setUploadProgress(0);
                  if (isEdit) await updateMut.mutateAsync(payload);
                  else await createMut.mutateAsync(payload);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({
                isSubmitting,
                submitForm,
                values,
                setFieldValue,
                errors,
                touched,
                setFieldTouched,
              }) => {
                submitRef.current = submitForm;
                submittingRef.current = isSubmitting;

                return (
                  <Form>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                      <SelectFieldWrapper
                        name="advertSourceType"
                        label="Advert Source"
                        options={[
                          { value: "CATALOGUE", label: "Catalogue" },
                          { value: "URL", label: "URL" },
                        ]}
                      />
                      {values.advertSourceType === "URL" ? (
                        <TextFieldWrapper
                          name="url"
                          label="URL"
                          placeholder="https://example.com"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Create this advert now, then add catalogue items on
                          the details page.
                        </Typography>
                      )}
                      <SelectFieldWrapper
                        name="type"
                        label="Type"
                        options={[
                          { value: "SERVICES", label: "Services" },
                          { value: "PRODUCTS", label: "Products" },
                        ]}
                      />
                      <SelectFieldWrapper
                        name="category"
                        label="Category"
                        options={
                          values.type === "SERVICES"
                            ? toOptions(SERVICES)
                            : toOptions(PRODUCTS)
                        }
                      />
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
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => submitRef.current && submitRef.current()}
            disabled={isSaving || submittingRef.current}
            sx={{
              color: "#fff",
              background: gradientPrimary,
              "&:hover": {
                background: gradientPrimary,
                filter: "brightness(1.05)",
              },
            }}
          >
            {isSaving
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
      </Box>
    </Dialog>
  );
}
