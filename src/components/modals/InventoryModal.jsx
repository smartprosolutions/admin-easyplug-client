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
import { SERVICES, PRODUCTS, toOptions } from "../../constants/categories";
import ToastAlert from "../../components/alerts/ToastAlert";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { gradientPrimary } from "../../theme/theme";

import {
  createListing as createItem,
  updateListing as updateItem,
  getListing as getItem,
} from "../../services/listingService";
import { addListingToAdvert } from "../../services/advertService";
import { useUserProfileQuery } from "../../services/queries";
import {
  isOwnedByUser,
  resolveUserId,
} from "../../utils/accessControl";

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
    const target = resolveRedirect();
    if (target) {
      navigate(target);
    }
  };

  const createMut = useMutation({
    mutationFn: (vals) =>
      advertId
        ? addListingToAdvert(advertId, vals, (pct) => setUploadProgress(pct))
        : createItem(vals, (pct) => setUploadProgress(pct)),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["inventory"] });
        if (advertId) {
          await queryClient.invalidateQueries({
            queryKey: ["advert", advertId],
          });
          await queryClient.invalidateQueries({ queryKey: ["adverts"] });
        }
      } catch {
        // ignore
      }
      // keep success toast and return to inventory
      setToast({
        open: true,
        severity: "success",
        message: advertId ? "Catalogue item added" : "Item created",
      });
      if (resolveRedirect() || onClose) {
        setTimeout(() => closeAfterSuccess(), 700);
      }
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
        await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      } catch {
        // ignore
      }
      setToast({ open: true, severity: "success", message: "Item updated" });
      if (resolveRedirect() || onClose) {
        setTimeout(() => closeAfterSuccess(), 700);
      }
    },
    onError: (err) =>
      setToast({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || err.message || "Update failed",
      }),
  });

  const itemData = isEdit
    ? existing?.listing ||
      existing?.item ||
      existing?.data ||
      (existing?.subscription ? existing.subscription : existing) ||
      null
    : null;
  const canEditItem = isOwnedByUser(itemData, currentUserId);

  const resolvedType = itemData?.type || presetType || "PRODUCTS";
  const resolvedCategory = itemData?.category || presetCategory || "";
  const isTypeCategoryLocked = Boolean(lockTypeCategory);

  const initialValues = {
    title: itemData?.title || "",
    description: itemData?.description || "",
    keyFeatures: itemData?.keyFeatures || [],
    price: itemData?.price || "",
    category: resolvedCategory,
    type: resolvedType,
    images: itemData?.images || [],
    status: itemData?.status || "active",
    expires_at: itemData?.expires_at || "",
  };

  const submitRef = React.useRef(null);
  const submittingRef = React.useRef(false);
  const [previews, setPreviews] = React.useState([]);
  const inputRef = React.useRef(null);
  const [imageHelper, setImageHelper] = React.useState("");

  React.useEffect(() => {
    return () => {
      // revoke created object URLs on unmount
      previews.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
        } catch {
          /* ignore */
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
      {(createMut.isPending || updateMut.isPending) && (
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
                {isEdit ? "Edit Item" : "Add Item"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {isEdit
                  ? "Update inventory listing details"
                  : "Create a new inventory listing"}
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              disabled={createMut.isPending || updateMut.isPending}
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
          {(createMut.isPending || updateMut.isPending) && (
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
                price: Yup.number()
                  .typeError("Must be a number")
                  .min(0, "Must be >= 0")
                  .required("Required"),
                images: Yup.array().max(6, "Maximum 6 images allowed"),
                description: Yup.string(),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  const normalizedKeyFeatures = Array.isArray(
                    values.keyFeatures,
                  )
                    ? values.keyFeatures
                    : String(values.keyFeatures || "")
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);
                  const toSend = {
                    ...values,
                    keyFeatures: normalizedKeyFeatures,
                  };

                  // convert values to FormData so files are sent correctly
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
                submittingRef.current = isSubmitting;
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
                              const existingFiles =
                                (values && values.images) || [];
                              const combined = existingFiles.concat(picked);
                              const MAX = 6;
                              const limited = combined.slice(0, MAX);
                              if (combined.length > MAX) {
                                setImageHelper(`Maximum ${MAX} images allowed`);
                              }
                              setFieldValue("images", limited);
                              previews.forEach((p) => {
                                try {
                                  URL.revokeObjectURL(p.url);
                                } catch {
                                  /* ignore */
                                }
                              });
                              const next = limited.map((f) => ({
                                file: f,
                                url: URL.createObjectURL(f),
                              }));
                              setPreviews(next);
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
                            disabled={
                              ((values &&
                                values.images &&
                                values.images.length) ||
                                previews.length) >= 6
                            }
                          >
                            Upload images
                          </Button>

                          {previews && previews.length > 0 && (
                            <Grid container spacing={1} sx={{ mt: 1 }}>
                              {previews.map((p, idx) => (
                                <Grid item key={idx}>
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
                                          setPreviews(remaining);
                                          setFieldValue(
                                            "images",
                                            remaining.map((r) => r.file),
                                          );
                                          setImageHelper("");
                                          try {
                                            URL.revokeObjectURL(p.url);
                                          } catch {
                                            /* ignore */
                                          }
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
                                      {p.file.name}
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
            disabled={
              createMut.isPending ||
              updateMut.isPending ||
              submittingRef.current
            }
            sx={{
              color: "#fff",
              background: gradientPrimary,
              "&:hover": {
                background: gradientPrimary,
                filter: "brightness(1.05)",
              },
            }}
          >
            {createMut.isPending || updateMut.isPending
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
      </Box>
    </Dialog>
  );
}
