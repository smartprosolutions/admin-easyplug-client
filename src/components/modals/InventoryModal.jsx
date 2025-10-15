import React from "react";
import {
  Drawer,
  Divider,
  Button,
  IconButton,
  Stack,
  CircularProgress,
  Box,
  Typography,
  Slide,
  Grid,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import SelectFieldWrapper from "../../components/forms/SelectFieldWrapper";
import { SERVICES, PRODUCTS, toOptions } from "../../constants/categories";
import ToastAlert from "../../components/alerts/ToastAlert";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

// Use listing service for inventory CRUD; keep subscriptionService for subscription options
import { getSubscriptions } from "../../services/subscriptionService";
import {
  createListing as createItem,
  updateListing as updateItem,
  getListing as getItem
} from "../../services/listingService";

export default function InventoryModal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [toast, setToast] = React.useState({
    open: false,
    severity: "info",
    message: ""
  });

  const { data: existing, isLoading: isFetching } = useQuery({
    queryKey: ["inventoryItem", id],
    queryFn: () => getItem(id),
    enabled: isEdit,
    retry: false
  });

  const queryClient = useQueryClient();

  // UI step: 0 = form, 1 = payment
  const [activeStep, setActiveStep] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("mastercard");

  // card state (for MasterCard mock)
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardName, setCardName] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvv, setCardCvv] = React.useState("");

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

  // --- Card formatting & validation helpers (MasterCard mock) ---
  const onlyDigits = (s = "") => (s || "").replace(/\D+/g, "");

  const formatCardNumber = (value = "") => {
    // allow up to 20 digits (some cards / tokenized formats) but prefer 16
    const digits = onlyDigits(value).slice(0, 20);
    // group in fours for readability: 4 4 4 4 4 (last group may be shorter)
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
    // assume year in YY format
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

  // fetch available subscriptions for selection
  const { data: subsData } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getSubscriptions(),
    enabled: true,
    retry: false
  });
  const subscriptionList =
    subsData && subsData.subscriptions
      ? subsData.subscriptions
      : Array.isArray(subsData)
      ? subsData
      : subsData?.data || [];
  const subscriptionOptions = subscriptionList.map((s) => ({
    value: s.subscriptionId,
    label: s.name
  }));

  const createMut = useMutation({
    mutationFn: (vals) => createItem(vals),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      } catch {
        // ignore
      }
      // keep success toast but instead of navigating, show payment step
      setToast({
        open: true,
        severity: "success",
        message: "Item created - continue to payment"
      });
      setActiveStep(1);
    },
    onError: (err) =>
      setToast({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || err.message || "Create failed"
      })
  });

  const updateMut = useMutation({
    mutationFn: (vals) => updateItem(id, vals),
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
        message: err?.response?.data?.message || err.message || "Update failed"
      })
  });

  const itemData =
    existing && existing.subscription ? existing.subscription : existing;

  const initialValues = {
    title: itemData?.title || "",
    description: itemData?.description || "",
    price: itemData?.price || "",
    category: itemData?.category || "",
    type: itemData?.type || "PRODUCTS",
    images: itemData?.images || [],
    isAdvertisement: itemData?.isAdvertisement ?? false,
    subscriptionId: itemData?.subscriptionId || "",
    condition: itemData?.condition || "New",
    status: itemData?.status || "active",
    expires_at: itemData?.expires_at || ""
  };

  const [closing, setClosing] = React.useState(false);
  const submitRef = React.useRef(null);
  const prevSubRef = React.useRef();
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
    setClosing(true);
    setTimeout(() => navigate("/inventory"), 320);
  };

  return (
    <Drawer
      anchor="right"
      open
      onClose={handleClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}
    >
      <Slide
        direction="left"
        in={!closing}
        mountOnEnter
        unmountOnExit
        timeout={320}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <Typography variant="h6">
              {isEdit ? "Edit Item" : "Add Item"}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />

          <Box sx={{ p: 2, overflow: "auto", flex: 1 }}>
            {isFetching ? (
              <Box display="flex" justifyContent="center" py={4}>
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
                          (s) => s.subscriptionId === subscriptionId
                        );
                        if (!selected || !selected.name) return true;
                        if (selected.name.toLowerCase() !== "standard")
                          return true;
                        const forbidden =
                          /\b(new|brand new|refurb(?:ished)?|refurbunished)\b/i;
                        return !forbidden.test(value || "");
                      }
                    ),
                  price: Yup.number()
                    .typeError("Must be a number")
                    .min(0, "Must be >= 0")
                    .required("Required"),
                  images: Yup.array().min(3, "At least 3 images required"),
                  description: Yup.string().test(
                    "standard-description",
                    "When using the Standard subscription you may only list OLD items. Remove mentions of 'new' or 'refurbished' or choose another subscription.",
                    function (value) {
                      const { subscriptionId } = this.parent || {};
                      if (!subscriptionId) return true;
                      const selected = subscriptionList.find(
                        (s) => s.subscriptionId === subscriptionId
                      );
                      if (!selected || !selected.name) return true;
                      if (selected.name.toLowerCase() !== "standard")
                        return true;
                      // for Standard subscription, reject descriptions that indicate New/Refurbished
                      const forbidden =
                        /\b(new|brand new|refurb(?:ished)?|refurbunished)\b/i;
                      return !forbidden.test(value || "");
                    }
                  )
                })}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    // For create: omit isAdvertisement from payload so the API can set it server-side
                    const toSend = isEdit
                      ? values
                      : Object.fromEntries(
                          Object.entries(values).filter(
                            ([k]) => k !== "isAdvertisement"
                          )
                        );

                    // convert values to FormData so files are sent correctly
                    const payload = buildFormData(toSend);
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
                  errors
                }) => {
                  submitRef.current = submitForm;
                  submittingRef.current = isSubmitting;
                  // track previous subscriptionId to react to changes without hooks
                  if (prevSubRef.current !== values.subscriptionId) {
                    prevSubRef.current = values.subscriptionId;
                    if (values.subscriptionId) {
                      const selected = subscriptionList.find(
                        (s) => s.subscriptionId === values.subscriptionId
                      );
                      if (
                        selected &&
                        selected.name &&
                        selected.name.toLowerCase() === "standard"
                      ) {
                        // auto-set condition to Old for Standard subscription
                        setFieldValue("condition", "Old");
                        // For Standard subscription, make this NOT an advertisement
                        setFieldValue("isAdvertisement", false);
                      } else {
                        // Non-Standard subscriptions should default to advertisement
                        setFieldValue("isAdvertisement", true);
                      }
                    }
                  }
                  const currentSelected = subscriptionList.find(
                    (s) => s.subscriptionId === values.subscriptionId
                  );
                  const isConditionDisabled = Boolean(
                    currentSelected &&
                      currentSelected.name &&
                      currentSelected.name.toLowerCase() === "standard"
                  );
                  return (
                    <Form>
                      {/* Stepper at top of form/payment area */}
                      <Box sx={{ mb: 2 }}>
                        <Stepper activeStep={activeStep} alternativeLabel>
                          <Step>
                            <StepLabel>Details</StepLabel>
                          </Step>
                          <Step>
                            <StepLabel>Payment</StepLabel>
                          </Step>
                        </Stepper>
                      </Box>
                      <Stack spacing={2} sx={{ pt: 1 }}>
                        {activeStep === 0 ? (
                          <>
                            <SelectFieldWrapper
                              name="type"
                              label="Type"
                              options={[
                                { value: "SERVICES", label: "Services" },
                                { value: "PRODUCTS", label: "Products" }
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
                                { value: "New", label: "New" }
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
                            <TextFieldWrapper name="price" label="Price" />
                            <SelectFieldWrapper
                              name="status"
                              label="Status"
                              options={[
                                { value: "active", label: "Active" },
                                { value: "draft", label: "Draft" },
                                { value: "sold", label: "Sold" },
                                { value: "expired", label: "Expired" }
                              ]}
                            />
                            {/* Images input + previews */}
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
                                    const picked = Array.from(
                                      e.target.files || []
                                    );
                                    const existingFiles =
                                      (values && values.images) || [];
                                    const combined =
                                      existingFiles.concat(picked);
                                    const MAX = 6;
                                    const limited = combined.slice(0, MAX);
                                    if (combined.length > MAX) {
                                      setImageHelper(
                                        `Maximum ${MAX} images allowed`
                                      );
                                    }
                                    setFieldValue("images", limited);
                                    // revoke old previews
                                    previews.forEach((p) => {
                                      try {
                                        URL.revokeObjectURL(p.url);
                                      } catch {
                                        /* ignore */
                                      }
                                    });
                                    const next = limited.map((f) => ({
                                      file: f,
                                      url: URL.createObjectURL(f)
                                    }));
                                    setPreviews(next);
                                    if (inputRef.current)
                                      inputRef.current.value = "";
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
                                              boxShadow: 1
                                            }}
                                          >
                                            <img
                                              src={p.url}
                                              alt={`preview-${idx}`}
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover"
                                              }}
                                            />
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                const remaining =
                                                  previews.filter(
                                                    (_, i) => i !== idx
                                                  );
                                                setPreviews(remaining);
                                                setFieldValue(
                                                  "images",
                                                  remaining.map((r) => r.file)
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
                                                color: "#fff"
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
                                              whiteSpace: "nowrap"
                                            }}
                                          >
                                            {p.file.name}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    ))}
                                  </Grid>
                                )}
                                {/* show helper message (overflow) or validation error from Formik */}
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
                          // Payment step UI (mock)
                          <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Complete payment for subscription
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              Subscription:{" "}
                              {subscriptionList.find(
                                (s) =>
                                  s.subscriptionId === values.subscriptionId
                              )?.name || values.subscriptionId}
                            </Typography>

                            <RadioGroup
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                              <FormControlLabel
                                value="mastercard"
                                control={<Radio />}
                                label="MasterCard"
                              />
                              <FormControlLabel
                                value="capitec"
                                control={<Radio />}
                                label="Capitec Pay"
                              />
                            </RadioGroup>

                            {paymentMethod === "mastercard" ? (
                              <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6}>
                                  {/* Card visual */}
                                  {/* Maroon card placeholder (embossed style) */}
                                  <Box
                                    sx={{
                                      bgcolor:
                                        "linear-gradient(180deg,#6a0f3a,#8d214d)",
                                      color: "#fff",
                                      borderRadius: 2,
                                      p: 2,
                                      minHeight: 120,
                                      width: 360,
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "space-between",
                                      boxShadow: 6,
                                      backgroundSize: "cover",
                                      position: "relative",
                                      overflow: "hidden"
                                    }}
                                  >
                                    {/* top row: chip + bank text */}
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          gap: 1,
                                          alignItems: "center"
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            width: 40,
                                            height: 28,
                                            borderRadius: 0.8,
                                            bgcolor: "#f4d35e"
                                          }}
                                        />
                                        <Typography
                                          sx={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            opacity: 0.95
                                          }}
                                        >
                                          BANK
                                        </Typography>
                                      </Box>
                                      {/* decorative arcs */}
                                      <Box
                                        sx={{
                                          width: 72,
                                          height: 28,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "flex-end"
                                        }}
                                      >
                                        <Typography
                                          sx={{ fontSize: 12, fontWeight: 700 }}
                                        >
                                          {" "}
                                        </Typography>
                                      </Box>
                                    </Box>

                                    {/* embossed number */}
                                    <Typography
                                      sx={{
                                        mt: 1.5,
                                        fontSize: 18,
                                        letterSpacing: 2,
                                        fontVariantNumeric: "tabular-nums",
                                        textShadow: "0 1px 0 rgba(0,0,0,0.6)"
                                      }}
                                    >
                                      {cardNumber || "0000 1234 0000 0000"}
                                    </Typography>

                                    {/* bottom row: valid/thru + owner + signature block */}
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mt: 1
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
                                            mt: 0.5
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Card Number"
                                    value={cardNumber}
                                    onChange={(e) =>
                                      setCardNumber(
                                        formatCardNumber(e.target.value)
                                      )
                                    }
                                  />
                                  <TextField
                                    fullWidth
                                    label="Name on Card"
                                    sx={{ mt: 1 }}
                                    value={cardName}
                                    onChange={(e) =>
                                      setCardName(e.target.value)
                                    }
                                  />
                                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                    <TextField
                                      label="Expiry (MM/YY)"
                                      value={cardExpiry}
                                      onChange={(e) =>
                                        setCardExpiry(
                                          formatExpiry(e.target.value)
                                        )
                                      }
                                    />
                                    <TextField
                                      label="CVV"
                                      value={cardCvv}
                                      onChange={(e) =>
                                        setCardCvv(
                                          onlyDigits(e.target.value).slice(0, 4)
                                        )
                                      }
                                    />
                                  </Box>
                                </Grid>
                                <Grid item xs={12}>
                                  <Button
                                    variant="contained"
                                    disabled={!isCardComplete()}
                                    onClick={() => {
                                      // simulate payment success
                                      setToast({
                                        open: true,
                                        severity: "success",
                                        message: "Payment successful"
                                      });
                                      setTimeout(
                                        () => navigate("/inventory"),
                                        700
                                      );
                                    }}
                                  >
                                    Pay{" "}
                                    {subscriptionList.find(
                                      (s) =>
                                        s.subscriptionId ===
                                        values.subscriptionId
                                    )?.price || "Now"}
                                  </Button>
                                </Grid>
                              </Grid>
                            ) : (
                              // Capitec Pay mock
                              <Box sx={{ mt: 2 }}>
                                <Box
                                  sx={{
                                    width: 180,
                                    height: 180,
                                    bgcolor: "#f5f5f5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2
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
                                  onClick={() => {
                                    setToast({
                                      open: true,
                                      severity: "success",
                                      message: "Capitec Pay simulated"
                                    });
                                    setTimeout(
                                      () => navigate("/inventory"),
                                      700
                                    );
                                  }}
                                >
                                  I have paid
                                </Button>
                              </Box>
                            )}
                          </Paper>
                        )}
                      </Stack>
                    </Form>
                  );
                }}
              </Formik>
            )}
          </Box>

          <Divider />
          <Box
            sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            {isEdit && activeStep === 0 && (
              <Button onClick={() => setActiveStep(1)} color="primary">
                Next
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => submitRef.current && submitRef.current()}
              disabled={
                createMut.isLoading ||
                updateMut.isLoading ||
                submittingRef.current
              }
            >
              {isEdit ? "Update" : "Create"}
            </Button>
          </Box>

          <ToastAlert
            open={toast.open}
            severity={toast.severity}
            message={toast.message}
            onClose={() => setToast((s) => ({ ...s, open: false }))}
          />
        </Box>
      </Slide>
    </Drawer>
  );
}
