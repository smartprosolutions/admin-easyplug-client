import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Button,
  IconButton,
  Stack,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  CircularProgress,
  useMediaQuery,
  useTheme,
  TextField,
  Paper,
  Tooltip
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CategoryIcon from "@mui/icons-material/Category";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import LayersIcon from "@mui/icons-material/Layers";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TextFieldWrapper from "../../components/forms/TextFieldWrapper";
import SelectFieldWrapper from "../../components/forms/SelectFieldWrapper";
import ToastAlert from "../../components/alerts/ToastAlert";
import {
  createSubscription,
  updateSubscription,
  getSubscription
} from "../../services/subscriptionService";
import { gradientPrimary } from "../../theme/theme";

// Format number with K/M suffix
const formatUsers = (num) => {
  if (!num) return "0";
  if (num >= 1000000)
    return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return num.toString();
};

export default function SubscriptionModal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [toast, setToast] = React.useState({
    open: false,
    severity: "info",
    message: ""
  });

  const { data: existing, isLoading: isFetching } = useQuery({
    queryKey: ["subscription", id],
    queryFn: () => getSubscription(id),
    enabled: isEdit,
    retry: false
  });

  // Only show loading when editing and actually fetching
  const showLoading = isEdit && isFetching;

  const subscriptionData =
    existing && existing.subscription ? existing.subscription : existing;

  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: (vals) => createSubscription(vals),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      } catch {
        // ignore
      }
      setToast({
        open: true,
        severity: "success",
        message: "Subscription created successfully!"
      });
      setTimeout(() => navigate("/subscriptions"), 700);
    },
    onError: (err) =>
      setToast({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || err.message || "Create failed"
      })
  });

  const updateMut = useMutation({
    mutationFn: (vals) => updateSubscription(id, vals),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      } catch {
        // ignore
      }
      setToast({
        open: true,
        severity: "success",
        message: "Subscription updated successfully!"
      });
      setTimeout(() => navigate("/subscriptions"), 1500);
    },
    onError: (err) =>
      setToast({
        open: true,
        severity: "error",
        message: err?.response?.data?.message || err.message || "Update failed"
      })
  });

  const initialValues = {
    name: subscriptionData?.name || "",
    durationInHours: subscriptionData?.durationInHours ?? 1,
    description: subscriptionData?.description || "",
    status: subscriptionData?.status || "active",
    // Pricing tiers: array of { usersPerHour, price }
    pricingTiers:
      subscriptionData?.pricingTiers?.length > 0
        ? subscriptionData.pricingTiers
        : [{ usersPerHour: 10000, price: 16 }]
  };

  const submitRef = React.useRef(null);
  const submittingRef = React.useRef(false);

  const handleClose = () => {
    navigate("/subscriptions");
  };

  const formatDuration = (hours) => {
    if (!hours) return "-";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""}`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "1 day" : `${days} days`;
  };

  // Tier colors for visual distinction
  const tierColors = [
    { bg: "#667eea", light: alpha("#667eea", 0.1) },
    { bg: "#4caf50", light: alpha("#4caf50", 0.1) },
    { bg: "#ff9800", light: alpha("#ff9800", 0.1) },
    { bg: "#e91e63", light: alpha("#e91e63", 0.1) },
    { bg: "#00bcd4", light: alpha("#00bcd4", 0.1) },
    { bg: "#9c27b0", light: alpha("#9c27b0", 0.1) }
  ];

  return (
    <Dialog
      open
      onClose={handleClose}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          background: `linear-gradient(135deg, ${alpha("#fff", 0.98)} 0%, ${alpha("#f8f9fa", 0.98)} 100%)`,
          backdropFilter: "blur(20px)",
          overflow: "hidden"
        }
      }}
    >
      {/* Header with Gradient */}
      <DialogTitle
        sx={{
          p: 3,
          pb: 2.5,
          background: gradientPrimary,
          color: "white",
          position: "relative"
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: "white",
            "&:hover": {
              background: alpha("#fff", 0.1)
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              background: alpha("#fff", 0.2),
              color: "white",
              backdropFilter: "blur(10px)"
            }}
          >
            <SubscriptionsIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              {isEdit ? "Edit Subscription" : "Create New Subscription"}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
                label={isEdit ? "Editing Plan" : "New Plan"}
                size="small"
                sx={{
                  background: alpha("#fff", 0.2),
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  "& .MuiChip-icon": { color: "white" }
                }}
              />
              <Chip
                icon={<LayersIcon sx={{ fontSize: 16 }} />}
                label="Tiered Pricing"
                size="small"
                sx={{
                  background: alpha("#fff", 0.2),
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  "& .MuiChip-icon": { color: "white" }
                }}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {showLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={8}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={Yup.object({
              name: Yup.string().required("Required"),
              durationInHours: Yup.number()
                .typeError("Must be a number")
                .integer("Must be an integer")
                .min(1, "Must be >= 1")
                .required("Required"),
              description: Yup.string().nullable(),
              status: Yup.string()
                .oneOf(["active", "draft", "inactive"])
                .required("Required"),
              pricingTiers: Yup.array()
                .of(
                  Yup.object({
                    usersPerHour: Yup.number()
                      .typeError("Must be a number")
                      .min(1, "Min 1")
                      .required("Required"),
                    price: Yup.number()
                      .typeError("Must be a number")
                      .min(0, "Min 0")
                      .required("Required")
                  })
                )
                .min(1, "At least one pricing tier required")
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                if (isEdit) await updateMut.mutateAsync(values);
                else await createMut.mutateAsync(values);
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
              touched
            }) => {
              submitRef.current = submitForm;
              submittingRef.current = isSubmitting;
              return (
                <Form>
                  <Stack spacing={0}>
                    {/* Basic Info Section */}
                    <Box sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ mb: 2.5 }}
                      >
                        Basic Information
                      </Typography>

                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Stack spacing={2.5}>
                            {/* Name Field */}
                            <Box>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ mb: 1 }}
                              >
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: alpha("#667eea", 0.1)
                                  }}
                                >
                                  <SubscriptionsIcon
                                    sx={{ fontSize: 14, color: "#667eea" }}
                                  />
                                </Avatar>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="text.secondary"
                                >
                                  Subscription Name
                                </Typography>
                              </Stack>
                              <TextFieldWrapper
                                name="name"
                                placeholder="e.g., Basic Plan, Premium Plan"
                                size="medium"
                                fullWidth
                              />
                            </Box>

                            {/* Duration Field */}
                            <Box>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ mb: 1 }}
                              >
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: alpha("#2196f3", 0.1)
                                  }}
                                >
                                  <AccessTimeIcon
                                    sx={{ fontSize: 14, color: "#2196f3" }}
                                  />
                                </Avatar>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="text.secondary"
                                >
                                  Duration (hours)
                                </Typography>
                              </Stack>
                              <TextFieldWrapper
                                name="durationInHours"
                                placeholder="e.g., 1, 24, 48"
                                type="number"
                                size="medium"
                                fullWidth
                              />
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <Stack spacing={2.5}>
                            {/* Status Field */}
                            <Box>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ mb: 1 }}
                              >
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: alpha("#ff9800", 0.1)
                                  }}
                                >
                                  <CategoryIcon
                                    sx={{ fontSize: 14, color: "#ff9800" }}
                                  />
                                </Avatar>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="text.secondary"
                                >
                                  Status
                                </Typography>
                              </Stack>
                              <SelectFieldWrapper
                                name="status"
                                size="medium"
                                fullWidth
                                options={[
                                  { value: "active", label: "Active" },
                                  { value: "draft", label: "Draft" },
                                  { value: "inactive", label: "Inactive" }
                                ]}
                              />
                            </Box>

                            {/* Description Field */}
                            <Box>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ mb: 1 }}
                              >
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: alpha("#9c27b0", 0.1)
                                  }}
                                >
                                  <DescriptionIcon
                                    sx={{ fontSize: 14, color: "#9c27b0" }}
                                  />
                                </Avatar>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="text.secondary"
                                >
                                  Description
                                </Typography>
                              </Stack>
                              <TextFieldWrapper
                                name="description"
                                placeholder="Describe this subscription plan..."
                                multiline
                                rows={3}
                                size="medium"
                                fullWidth
                              />
                            </Box>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    {/* Pricing Tiers Section */}
                    <Box sx={{ p: 3, bgcolor: alpha("#667eea", 0.02) }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 2 }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                        >
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: alpha("#667eea", 0.1)
                            }}
                          >
                            <LayersIcon
                              sx={{ fontSize: 18, color: "#667eea" }}
                            />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              Pricing Tiers
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Define user limits and prices per hour
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>

                      <FieldArray name="pricingTiers">
                        {({ push, remove }) => (
                          <Stack spacing={2}>
                            {values.pricingTiers.map((tier, index) => {
                              const color =
                                tierColors[index % tierColors.length];
                              return (
                                <Paper
                                  key={index}
                                  elevation={0}
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(color.bg, 0.3)}`,
                                    bgcolor: "white",
                                    position: "relative",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                      borderColor: color.bg,
                                      boxShadow: `0 4px 12px ${alpha(color.bg, 0.15)}`
                                    }
                                  }}
                                >
                                  {/* Tier Badge */}
                                  <Chip
                                    label={`Tier ${index + 1}`}
                                    size="small"
                                    sx={{
                                      position: "absolute",
                                      top: -10,
                                      left: 16,
                                      bgcolor: color.bg,
                                      color: "white",
                                      fontWeight: 600,
                                      fontSize: 11
                                    }}
                                  />

                                  <Grid
                                    container
                                    spacing={2}
                                    alignItems="center"
                                  >
                                    {/* Users Per Hour */}
                                    <Grid size={{ xs: 12, sm: 5 }}>
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        sx={{ mb: 0.5 }}
                                      >
                                        <PeopleIcon
                                          sx={{ fontSize: 16, color: color.bg }}
                                        />
                                        <Typography
                                          variant="caption"
                                          fontWeight={600}
                                          color="text.secondary"
                                        >
                                          Users per hour
                                        </Typography>
                                      </Stack>
                                      <TextField
                                        type="number"
                                        size="medium"
                                        fullWidth
                                        placeholder="e.g., 10000"
                                        value={tier.usersPerHour}
                                        onChange={(e) =>
                                          setFieldValue(
                                            `pricingTiers.${index}.usersPerHour`,
                                            Number(e.target.value)
                                          )
                                        }
                                        error={
                                          touched.pricingTiers?.[index]
                                            ?.usersPerHour &&
                                          Boolean(
                                            errors.pricingTiers?.[index]
                                              ?.usersPerHour
                                          )
                                        }
                                        helperText={
                                          touched.pricingTiers?.[index]
                                            ?.usersPerHour &&
                                          errors.pricingTiers?.[index]
                                            ?.usersPerHour
                                        }
                                        InputProps={{
                                          endAdornment: (
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ ml: 1 }}
                                            >
                                              = {formatUsers(tier.usersPerHour)}
                                            </Typography>
                                          )
                                        }}
                                        sx={{
                                          "& .MuiOutlinedInput-root": {
                                            bgcolor: alpha(color.bg, 0.03)
                                          }
                                        }}
                                      />
                                    </Grid>

                                    {/* Price */}
                                    <Grid size={{ xs: 12, sm: 5 }}>
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        sx={{ mb: 0.5 }}
                                      >
                                        <AttachMoneyIcon
                                          sx={{
                                            fontSize: 16,
                                            color: "#4caf50"
                                          }}
                                        />
                                        <Typography
                                          variant="caption"
                                          fontWeight={600}
                                          color="text.secondary"
                                        >
                                          Price (ZAR)
                                        </Typography>
                                      </Stack>
                                      <TextField
                                        type="number"
                                        size="medium"
                                        fullWidth
                                        placeholder="e.g., 16"
                                        value={tier.price}
                                        onChange={(e) =>
                                          setFieldValue(
                                            `pricingTiers.${index}.price`,
                                            Number(e.target.value)
                                          )
                                        }
                                        error={
                                          touched.pricingTiers?.[index]
                                            ?.price &&
                                          Boolean(
                                            errors.pricingTiers?.[index]?.price
                                          )
                                        }
                                        helperText={
                                          touched.pricingTiers?.[index]
                                            ?.price &&
                                          errors.pricingTiers?.[index]?.price
                                        }
                                        InputProps={{
                                          startAdornment: (
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ mr: 0.5 }}
                                            >
                                              R
                                            </Typography>
                                          )
                                        }}
                                        sx={{
                                          "& .MuiOutlinedInput-root": {
                                            bgcolor: alpha("#4caf50", 0.03)
                                          }
                                        }}
                                      />
                                    </Grid>

                                    {/* Delete Button */}
                                    <Grid size={{ xs: 12, sm: 2 }}>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          justifyContent: "center",
                                          pt: { xs: 0, sm: 2.5 }
                                        }}
                                      >
                                        {values.pricingTiers.length > 1 && (
                                          <Tooltip title="Remove tier">
                                            <IconButton
                                              onClick={() => remove(index)}
                                              sx={{
                                                color: "#ef5350",
                                                bgcolor: alpha("#ef5350", 0.1),
                                                "&:hover": {
                                                  bgcolor: alpha("#ef5350", 0.2)
                                                }
                                              }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </Paper>
                              );
                            })}

                            {/* Add Tier Button */}
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() =>
                                push({ usersPerHour: "", price: "" })
                              }
                              sx={{
                                borderStyle: "dashed",
                                borderWidth: 2,
                                borderColor: alpha("#667eea", 0.3),
                                color: "#667eea",
                                py: 1.5,
                                borderRadius: 2,
                                "&:hover": {
                                  borderColor: "#667eea",
                                  bgcolor: alpha("#667eea", 0.05)
                                }
                              }}
                            >
                              Add Another Tier
                            </Button>
                          </Stack>
                        )}
                      </FieldArray>
                    </Box>

                    <Divider />

                    {/* Preview Section */}
                    <Box sx={{ p: 3 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ mb: 2 }}
                      >
                        Plan Preview
                      </Typography>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          border: `1px solid ${alpha("#667eea", 0.2)}`,
                          bgcolor: "white"
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={2}
                          sx={{ mb: 2 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "#667eea",
                              width: 44,
                              height: 44,
                              background: gradientPrimary
                            }}
                          >
                            <SubscriptionsIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={700}>
                              {values.name || "Subscription Name"}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <AccessTimeIcon
                                sx={{ fontSize: 14, color: "#2196f3" }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatDuration(values.durationInHours)}
                              </Typography>
                            </Stack>
                          </Box>
                          <Chip
                            label={values.status || "active"}
                            size="small"
                            color={
                              values.status === "active"
                                ? "success"
                                : values.status === "draft"
                                  ? "info"
                                  : "error"
                            }
                            sx={{ fontWeight: 600 }}
                          />
                        </Stack>

                        {values.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {values.description}
                          </Typography>
                        )}

                        {/* Pricing Tiers Preview */}
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          sx={{ mb: 1.5 }}
                        >
                          Pricing Tiers
                        </Typography>
                        <Grid container spacing={1.5}>
                          {values.pricingTiers.map((tier, index) => {
                            const color = tierColors[index % tierColors.length];
                            return (
                              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: color.light,
                                    border: `1px solid ${alpha(color.bg, 0.2)}`,
                                    textAlign: "center"
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{ color: color.bg }}
                                  >
                                    {formatUsers(tier.usersPerHour)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    users/hour
                                  </Typography>
                                  <Divider sx={{ my: 1 }} />
                                  <Typography
                                    variant="body1"
                                    fontWeight={700}
                                    color="#4caf50"
                                  >
                                    R{tier.price || 0}
                                  </Typography>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    </Box>

                    {/* Benefits Section */}
                    <Box sx={{ p: 3, pt: 0 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ mb: 2 }}
                      >
                        What&apos;s Included
                      </Typography>
                      <Grid container spacing={1}>
                        {[
                          "Access to all listings",
                          "Priority placement",
                          "Analytics dashboard",
                          "Customer support",
                          "Verified seller badge",
                          "Promotional tools"
                        ].map((benefit, index) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={index}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                py: 0.5
                              }}
                            >
                              <CheckIcon
                                sx={{ fontSize: 16, color: "success.main" }}
                              />
                              <Typography variant="body2">{benefit}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Stack>
                </Form>
              );
            }}
          </Formik>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 3, pt: 2, borderTop: `1px solid ${alpha("#000", 0.08)}` }}
      >
        <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{
              borderRadius: 2,
              flex: 1,
              py: 1.25,
              fontWeight: 600
            }}
          >
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
            startIcon={
              createMut.isPending || updateMut.isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              borderRadius: 2,
              flex: 2,
              py: 1.25,
              fontWeight: 600,
              background: gradientPrimary,
              "&:hover": {
                background: gradientPrimary,
                filter: "brightness(1.05)"
              }
            }}
          >
            {isEdit ? "Update Subscription" : "Create Subscription"}
          </Button>
        </Stack>
      </DialogActions>

      <ToastAlert
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />
    </Dialog>
  );
}
