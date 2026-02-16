import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TextFieldWrapper from "../components/forms/TextFieldWrapper";
import SelectFieldWrapper from "../components/forms/SelectFieldWrapper";
import { SERVICES, PRODUCTS, toOptions } from "../constants/categories";
import ToastAlert from "../components/alerts/ToastAlert";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { gradientPrimary } from "../theme/theme";

import { getSubscriptions } from "../services/subscriptionService";
import {
  createListing as createItem,
  updateListing as updateItem,
  getListing as getItem,
} from "../services/listingService";

const sectionTitleSx = {
  fontWeight: 700,
  color: "text.primary",
};

const sectionCaptionSx = {
  color: "text.secondary",
};

const resolveImageUrl = (raw) => {
  if (!raw || typeof raw !== "string") return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const base = apiBase.replace(/\/api\/v1\/?$/, "");
  if (!base) return raw;

  if (raw.includes("/")) {
    return raw.startsWith("/") ? `${base}${raw}` : `${base}/${raw}`;
  }

  return `${base}/${raw}`;
};

const getImageName = (raw) => {
  if (typeof raw !== "string") return "image";
  const clean = raw.split("?")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] || "image";
};

const toPreviewItem = (img, index) => {
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
  const resolved = resolveImageUrl(raw);

  return {
    key: `existing-${index}-${raw}`,
    file: null,
    raw,
    url: resolved || raw,
    isObjectUrl: false,
    name: (typeof img === "object" && img?.name) || getImageName(raw),
  };
};

export default function InventoryForm() {
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
    queryKey: ["inventoryItem", id],
    queryFn: () => getItem(id),
    enabled: fetchItemEnabled,
    retry: false,
  });

  const queryClient = useQueryClient();

  const [activeStep, setActiveStep] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("mastercard");
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const [cardNumber, setCardNumber] = React.useState("");
  const [cardName, setCardName] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvv, setCardCvv] = React.useState("");

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

  const onlyDigits = (s = "") => (s || "").replace(/\D+/g, "");

  const formatCardNumber = (value = "") => {
    const digits = onlyDigits(value).slice(0, 20);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const luhnCheck = (num = "") => {
    const digits = onlyDigits(num);
    if (digits.length !== 16 && digits.length !== 20) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits.charAt(i), 10);
      if (shouldDouble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const formatExpiry = (value = "") => {
    const digits = onlyDigits(value).slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + "/" + digits.slice(2);
  };

  const validateExpiry = (value = "") => {
    const m = value.split("/");
    if (m.length !== 2) return false;
    const mm = parseInt(m[0], 10);
    const yy = parseInt(m[1], 10);
    if (!mm || !yy) return false;
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (yy < currentYear) return false;
    if (yy === currentYear && mm < currentMonth) return false;
    return true;
  };

  const validateCvv = (value = "") => {
    const d = onlyDigits(value);
    return d.length === 3 || d.length === 4;
  };

  const isCardComplete = () => {
    const digits = onlyDigits(cardNumber);
    const okLength = digits.length === 16 || digits.length === 20;
    return (
      okLength &&
      luhnCheck(cardNumber) &&
      validateExpiry(cardExpiry) &&
      validateCvv(cardCvv) &&
      cardName.trim().length > 0
    );
  };

  const { data: subsData } = useQuery({
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

  const createMut = useMutation({
    mutationFn: (vals) => createItem(vals, (pct) => setUploadProgress(pct)),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      } catch {
        // ignore
      }
      setToast({
        open: true,
        severity: "success",
        message: "Item created - continue to payment",
      });
      setActiveStep(1);
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
      setTimeout(() => navigate("/inventory"), 700);
    },
    onError: (err) =>
      setToast({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || err.message || "Update failed",
      }),
  });

  const itemData =
    existing && existing.subscription ? existing.subscription : existing;
  const initialKeyFeatures = Array.isArray(itemData?.keyFeatures)
    ? itemData.keyFeatures.join(", ")
    : itemData?.keyFeatures || "";

  const initialValues = {
    title: itemData?.title || "",
    description: itemData?.description || "",
    keyFeatures: initialKeyFeatures,
    price: itemData?.price || "",
    category: itemData?.category || "",
    type: itemData?.type || "PRODUCTS",
    images: itemData?.images || [],
    subscriptionId: itemData?.subscriptionId || "",
    condition: itemData?.condition || "New",
    status: itemData?.status || "active",
    expires_at: itemData?.expires_at || "",
  };

  const submitRef = React.useRef(null);
  const prevSubRef = React.useRef();
  const submittingRef = React.useRef(false);
  const [previews, setPreviews] = React.useState([]);
  const inputRef = React.useRef(null);
  const [imageHelper, setImageHelper] = React.useState("");

  const revokeObjectUrls = React.useCallback((items = []) => {
    items.forEach((item) => {
      if (!item?.isObjectUrl) return;
      try {
        URL.revokeObjectURL(item.url);
      } catch {
        /* ignore */
      }
    });
  }, []);

  React.useEffect(() => {
    return () => {
      revokeObjectUrls(previews);
    };
  }, [previews, revokeObjectUrls]);

  React.useEffect(() => {
    if (!isEdit) return;
    const existingImages = Array.isArray(itemData?.images) ? itemData.images : [];
    if (!existingImages.length) {
      setPreviews([]);
      return;
    }
    const next = existingImages.map((img, index) => toPreviewItem(img, index));
    setPreviews(next);
  }, [isEdit, itemData]);

  const handleClose = () => {
    navigate("/inventory");
  };

  const isLoading = createMut.isPending || updateMut.isPending;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: "100%",
        background:
          "linear-gradient(160deg, rgba(246,248,255,0.7) 0%, rgba(255,255,255,1) 55%)",
      }}
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              background: gradientPrimary,
              color: "#fff",
            }}
          >
            <Stack spacing={2}>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ lineHeight: 1.1 }}
              >
                {isEdit ? "Edit Item" : "Create Listing"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {isEdit
                  ? "Keep details accurate and ready for review."
                  : "Build a clean listing in minutes, then complete payment."}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  size="small"
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
                >
                  Back
                </Button>
                <IconButton
                  onClick={handleClose}
                  aria-label="close"
                  size="small"
                  sx={{ color: "#fff" }}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.paper",
            }}
          >
            <Typography variant="subtitle2" sx={sectionTitleSx} mb={1}>
              Checklist
            </Typography>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" sx={sectionCaptionSx}>
                  Step 1
                </Typography>
                <Typography fontWeight={600}>Details</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={sectionCaptionSx}>
                  Step 2
                </Typography>
                <Typography fontWeight={600}>Payment</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          position: "relative",
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        {isLoading && (
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
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              zIndex: 2,
              borderRadius: 3,
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

        {fetchItemEnabled && isFetching ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={Yup.object({
              title: Yup.string()
                .required("Required")
                .test(
                  "standard-title",
                  "When using the Standard subscription you may only list OLD items. Remove mentions of 'new' or 'refurbished' or choose another subscription.",
                  function (value) {
                    const { subscriptionId } = this.parent || {};
                    if (!subscriptionId) return true;
                    const selected = subscriptionList.find(
                      (s) => s.subscriptionId === subscriptionId,
                    );
                    if (!selected || !selected.name) return true;
                    if (selected.name.toLowerCase() !== "standard") return true;
                    const forbidden =
                      /\b(new|brand new|refurb(?:ished)?|refurbunished)\b/i;
                    return !forbidden.test(value || "");
                  },
                ),
              price: Yup.number()
                .typeError("Must be a number")
                .min(0, "Must be >= 0")
                .required("Required"),
              images: Yup.array().max(6, "Maximum 6 images allowed"),
              description: Yup.string().test(
                "standard-description",
                "When using the Standard subscription you may only list OLD items. Remove mentions of 'new' or 'refurbished' or choose another subscription.",
                function (value) {
                  const { subscriptionId } = this.parent || {};
                  if (!subscriptionId) return true;
                  const selected = subscriptionList.find(
                    (s) => s.subscriptionId === subscriptionId,
                  );
                  if (!selected || !selected.name) return true;
                  if (selected.name.toLowerCase() !== "standard") return true;
                  const forbidden =
                    /\b(new|brand new|refurb(?:ished)?|refurbunished)\b/i;
                  return !forbidden.test(value || "");
                },
              ),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const normalizedKeyFeatures = Array.isArray(values.keyFeatures)
                  ? values.keyFeatures
                  : String(values.keyFeatures || "")
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean);
                const toSend = {
                  ...values,
                  keyFeatures: normalizedKeyFeatures,
                };

                const payload = buildFormData(toSend);
                setUploadProgress(0);
                if (isEdit) await updateMut.mutateAsync(payload);
                else await createMut.mutateAsync(payload);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, submitForm, values, setFieldValue, errors }) => {
              submitRef.current = submitForm;
              submittingRef.current = isSubmitting;
              if (prevSubRef.current !== values.subscriptionId) {
                prevSubRef.current = values.subscriptionId;
                if (values.subscriptionId) {
                  const selected = subscriptionList.find(
                    (s) => s.subscriptionId === values.subscriptionId,
                  );
                  if (
                    selected &&
                    selected.name &&
                    selected.name.toLowerCase() === "standard"
                  ) {
                    setFieldValue("condition", "Old");
                  }
                }
              }
              const currentSelected = subscriptionList.find(
                (s) => s.subscriptionId === values.subscriptionId,
              );
              const isConditionDisabled = Boolean(
                currentSelected &&
                currentSelected.name &&
                currentSelected.name.toLowerCase() === "standard",
              );

              return (
                <Form>
                  {isLoading && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption">
                        {`Uploading... ${uploadProgress || 0}%`}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      border: "1px dashed",
                      borderColor: "divider",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor:
                              activeStep >= 0 ? "primary.main" : "grey.400",
                          }}
                        />
                        <Typography variant="subtitle2" sx={sectionTitleSx}>
                          Details
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          height: 2,
                          bgcolor: "divider",
                          display: { xs: "none", sm: "block" },
                        }}
                      />
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor:
                              activeStep >= 1 ? "primary.main" : "grey.400",
                          }}
                        />
                        <Typography variant="subtitle2" sx={sectionTitleSx}>
                          Payment
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Stack spacing={2}>
                    {activeStep === 0 ? (
                      <>
                        <Box>
                          <Typography variant="subtitle2" sx={sectionTitleSx}>
                            Listing Details
                          </Typography>
                          <Typography variant="caption" sx={sectionCaptionSx}>
                            Core listing information and pricing.
                          </Typography>
                        </Box>
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
                        <SelectFieldWrapper
                          name="subscriptionId"
                          label="Subscription"
                          options={subscriptionOptions}
                        />
                        <SelectFieldWrapper
                          name="condition"
                          label="Condition"
                          options={[
                            { value: "Old", label: "Old" },
                            { value: "New", label: "New" },
                          ]}
                          disabled={isConditionDisabled}
                        />
                        <TextFieldWrapper name="title" label="Title" />
                        <TextFieldWrapper
                          name="description"
                          label="Description"
                          multiline
                          rows={3}
                        />
                        <TextFieldWrapper
                          name="keyFeatures"
                          label="Key Features"
                          helperText="Comma-separated values"
                          multiline
                          rows={3}
                        />
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
                        <Divider sx={{ my: 1 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={sectionTitleSx}>
                            Media
                          </Typography>
                          <Typography variant="caption" sx={sectionCaptionSx}>
                            Upload up to 6 images for the listing.
                          </Typography>
                        </Box>
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
                                  setImageHelper(
                                    `Maximum ${MAX} images allowed`,
                                  );
                                }
                                setFieldValue("images", limited);
                                revokeObjectUrls(previews);
                                const next = limited.map((img, index) =>
                                  toPreviewItem(img, index),
                                );
                                setPreviews(next);
                                if (inputRef.current)
                                  inputRef.current.value = "";
                              }}
                            />

                            <Button
                              variant="outlined"
                              fullWidth
                              sx={{ height: 40 }}
                              size="small"
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
                                            setPreviews(remaining);
                                            setFieldValue(
                                              "images",
                                              remaining.map((r) => r.file ?? r.raw),
                                            );
                                            setImageHelper("");
                                            revokeObjectUrls([p]);
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
                      </>
                    ) : (
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Complete payment for subscription
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          Subscription:{" "}
                          {subscriptionList.find(
                            (s) => s.subscriptionId === values.subscriptionId,
                          )?.name || values.subscriptionId}
                        </Typography>

                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <Button
                            variant={
                              paymentMethod === "mastercard"
                                ? "contained"
                                : "outlined"
                            }
                            size="small"
                            onClick={() => setPaymentMethod("mastercard")}
                          >
                            MasterCard
                          </Button>
                          <Button
                            variant={
                              paymentMethod === "capitec"
                                ? "contained"
                                : "outlined"
                            }
                            size="small"
                            onClick={() => setPaymentMethod("capitec")}
                          >
                            Capitec Pay
                          </Button>
                        </Stack>

                        {paymentMethod === "mastercard" ? (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item size={{ xs: 12, md: 6 }}>
                              <Box
                                sx={{
                                  bgcolor:
                                    "linear-gradient(180deg,#6a0f3a,#8d214d)",
                                  color: "#fff",
                                  borderRadius: 2,
                                  p: 2,
                                  minHeight: 120,
                                  width: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  boxShadow: 6,
                                  backgroundSize: "cover",
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      alignItems: "center",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 28,
                                        borderRadius: 0.8,
                                        bgcolor: "#f4d35e",
                                      }}
                                    />
                                    <Typography
                                      sx={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        opacity: 0.95,
                                      }}
                                    >
                                      BANK
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      width: 72,
                                      height: 28,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    <Typography
                                      sx={{ fontSize: 12, fontWeight: 700 }}
                                    >
                                      {" "}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Typography
                                  sx={{
                                    mt: 1.5,
                                    fontSize: 18,
                                    letterSpacing: 2,
                                    fontVariantNumeric: "tabular-nums",
                                    textShadow: "0 1px 0 rgba(0,0,0,0.6)",
                                  }}
                                >
                                  {cardNumber || "0000 1234 0000 0000"}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mt: 1,
                                  }}
                                >
                                  <Box>
                                    <Typography
                                      sx={{ fontSize: 10, opacity: 0.85 }}
                                    >
                                      VALID THRU
                                    </Typography>
                                    <Typography sx={{ fontSize: 12 }}>
                                      {cardExpiry || "10/24"}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography
                                      sx={{ fontSize: 12, fontWeight: 700 }}
                                    >
                                      {cardName || "OWNER"}
                                    </Typography>
                                    <Box
                                      sx={{
                                        width: 84,
                                        height: 20,
                                        bgcolor: "#fff",
                                        borderRadius: 0.5,
                                        mt: 0.5,
                                      }}
                                    />
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid item size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                label="Card Number"
                                value={cardNumber}
                                onChange={(e) =>
                                  setCardNumber(
                                    formatCardNumber(e.target.value),
                                  )
                                }
                              />
                              <TextField
                                fullWidth
                                label="Name on Card"
                                sx={{ mt: 1 }}
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                              />
                              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                <TextField
                                  label="Expiry (MM/YY)"
                                  value={cardExpiry}
                                  onChange={(e) =>
                                    setCardExpiry(formatExpiry(e.target.value))
                                  }
                                />
                                <TextField
                                  label="CVV"
                                  value={cardCvv}
                                  onChange={(e) =>
                                    setCardCvv(
                                      onlyDigits(e.target.value).slice(0, 4),
                                    )
                                  }
                                />
                              </Box>
                            </Grid>
                            <Grid item size={{ xs: 12 }}>
                              <Button
                                variant="contained"
                                disabled={!isCardComplete()}
                                size="small"
                                sx={{
                                  color: "#fff",
                                  background: gradientPrimary,
                                  "&:hover": {
                                    background: gradientPrimary,
                                    filter: "brightness(1.05)",
                                  },
                                }}
                                onClick={() => {
                                  setToast({
                                    open: true,
                                    severity: "success",
                                    message: "Payment successful",
                                  });
                                  setTimeout(() => navigate("/inventory"), 700);
                                }}
                              >
                                Pay{" "}
                                {subscriptionList.find(
                                  (s) =>
                                    s.subscriptionId === values.subscriptionId,
                                )?.price || "Now"}
                              </Button>
                            </Grid>
                          </Grid>
                        ) : (
                          <Box sx={{ mt: 2 }}>
                            <Box
                              sx={{
                                width: 180,
                                height: 180,
                                bgcolor: "#f5f5f5",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mb: 2,
                              }}
                            >
                              <Typography>QR Code</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              Open Capitec Pay and scan the QR code above to
                              pay.
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                setToast({
                                  open: true,
                                  severity: "success",
                                  message: "Capitec Pay simulated",
                                });
                                setTimeout(() => navigate("/inventory"), 700);
                              }}
                            >
                              I have paid
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    )}
                  </Stack>
                  <Divider sx={{ my: 3 }} />
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    flexWrap="wrap"
                  >
                    <Button onClick={handleClose} color="inherit" size="small">
                      Cancel
                    </Button>
                    {activeStep === 1 && (
                      <Button onClick={() => setActiveStep(0)} size="small">
                        Back to details
                      </Button>
                    )}
                    {activeStep === 0 && (
                      <Button
                        onClick={() => setActiveStep(1)}
                        color="primary"
                        size="small"
                      >
                        Next
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={() => submitRef.current && submitRef.current()}
                      disabled={isLoading || submittingRef.current}
                      size="small"
                      sx={{
                        color: "#fff",
                        background: gradientPrimary,
                        "&:hover": {
                          background: gradientPrimary,
                          filter: "brightness(1.05)",
                        },
                      }}
                    >
                      {isLoading
                        ? `${isEdit ? "Updating" : "Creating"}... ${
                            uploadProgress || 0
                          }%`
                        : isEdit
                          ? "Update"
                          : "Create"}
                    </Button>
                  </Stack>
                </Form>
              );
            }}
          </Formik>
        )}
      </Paper>

      <ToastAlert
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />
    </Box>
  );
}
