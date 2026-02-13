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
import RichTextEditor from "../../components/forms/RichTextEditor";
import { SERVICES, PRODUCTS, toOptions } from "../../constants/categories";
import ToastAlert from "../../components/alerts/ToastAlert";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { gradientPrimary } from "../../theme/theme";
import { getSubscriptions } from "../../services/subscriptionService";
import { createAdvert, getAdvert } from "../../services/advertService";

const formatCurrency = (val) => {
  try {
    const n = Number(val);
    return `R ${Number.isFinite(n) ? n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}`;
  } catch {
    return val;
  }
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

  const { data: existing, isPending: isFetching } = useQuery({
    queryKey: ["advertisementItem", id],
    queryFn: () => getAdvert(id),
    enabled: fetchItemEnabled,
    retry: false,
  });

  const {
    data: subsData,
    isPending: isSubsPending,
    error: subsError,
    refetch: refetchSubs,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getSubscriptions(),
    enabled: true,
    retry: false,
  });

  const subscriptionList =
    subsData && subsData.subscriptions
      ? subsData.subscriptions
      : Array.isArray(subsData)
        ? subsData
        : subsData?.data || [];

  const subscriptionOptions = subscriptionList.map((s) => ({
    value: s.subscriptionId,
    label: s.name,
  }));

  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = React.useState(0);

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
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["advertCatalogue"] });
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

  const itemData =
    existing && existing.subscription ? existing.subscription : existing;

  const initialValues = {
    description: itemData?.description || "",
    category: itemData?.category || "",
    type: itemData?.type || "PRODUCTS",
    images: itemData?.images || [],
    status: itemData?.status || "active",
    expires_at: itemData?.expires_at || "",
    subscriptionId: itemData?.subscriptionId || "",
    subscriptionTierUsersPerHour:
      itemData?.pricingTier?.usersPerHour || itemData?.usersPerHour || "",
  };

  const submitRef = React.useRef(null);
  const submittingRef = React.useRef(false);
  const [previews, setPreviews] = React.useState([]);
  const inputRef = React.useRef(null);
  const [imageHelper, setImageHelper] = React.useState("");

  React.useEffect(() => {
    return () => {
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
    navigate("/advertisements");
  };

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
          maxHeight: "calc(100vh - 64px)",
          borderRadius: 4,
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
      {createMut.isPending && (
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
              {isEdit ? "Loading..." : "Creating..."}
            </Typography>
          </Stack>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box sx={{ background: gradientPrimary, color: "white", p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                background: alpha("#fff", 0.2),
                color: "white",
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
              disabled={createMut.isPending}
              sx={{
                color: "white",
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
          {createMut.isPending && (
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
                images: Yup.array().min(3, "At least 3 images required"),
                description: Yup.string(),
                subscriptionId: Yup.string().required("Required"),
                subscriptionTierUsersPerHour: Yup.string().required("Required"),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  if (isEdit) {
                    setToast({
                      open: true,
                      severity: "info",
                      message: "Editing adverts is not supported yet",
                    });
                    return;
                  }
                  const selectedSubscription = subscriptionList.find(
                    (s) => s.subscriptionId === values.subscriptionId,
                  );
                  const selectedTier = selectedSubscription?.pricingTiers?.find(
                    (tier) =>
                      String(tier.usersPerHour) ===
                      String(values.subscriptionTierUsersPerHour),
                  );
                  if (values.subscriptionId && !selectedTier) {
                    setToast({
                      open: true,
                      severity: "error",
                      message: "Select a valid subscription tier",
                    });
                    return;
                  }
                  const toSend = {
                    ...values,
                    pricingTier: selectedTier || null,
                  };

                  const payload = buildFormData(toSend);
                  setUploadProgress(0);
                  await createMut.mutateAsync(payload);
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
                const selectedSubscription = subscriptionList.find(
                  (s) => s.subscriptionId === values.subscriptionId,
                );

                const tierOptions = (
                  selectedSubscription?.pricingTiers || []
                ).map((tier) => ({
                  value: String(tier.usersPerHour),
                  label: `${formatCurrency(tier.price)} • ${Number(tier.usersPerHour || 0).toLocaleString("en-ZA")} users/hr`,
                }));

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
                        name="subscriptionId"
                        label="Subscription"
                        options={subscriptionOptions}
                        disabled={isSubsPending}
                      />
                      {(subsError ||
                        (!isSubsPending && !subscriptionOptions.length)) && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Typography variant="caption" color="error">
                            {subsError
                              ? "Failed to load subscriptions."
                              : "No subscriptions available."}
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => refetchSubs()}
                            disabled={isSubsPending}
                          >
                            Retry
                          </Button>
                        </Stack>
                      )}
                      <SelectFieldWrapper
                        name="subscriptionTierUsersPerHour"
                        label="Subscription Tier"
                        options={tierOptions}
                        disabled={!values.subscriptionId}
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
            disabled={createMut.isPending || submittingRef.current}
            sx={{
              color: "#fff",
              background: gradientPrimary,
              "&:hover": {
                background: gradientPrimary,
                filter: "brightness(1.05)",
              },
            }}
          >
            {createMut.isPending
              ? `Creating... ${uploadProgress || 0}%`
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
