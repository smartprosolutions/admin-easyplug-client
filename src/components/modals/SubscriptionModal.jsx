import React from "react";
import {
  Drawer,
  Divider,
  Button,
  IconButton,
  Stack,
  Switch,
  FormControlLabel,
  CircularProgress,
  Box,
  Typography,
  Slide
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
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

export default function SubscriptionModal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

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

  // Some APIs return a wrapper object like { success: true, subscription: { ... } }
  // Normalize to the actual subscription object so form initialValues work.
  const subscriptionData =
    existing && existing.subscription ? existing.subscription : existing;

  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: (vals) => createSubscription(vals),
    onSuccess: async () => {
      // invalidate subscriptions list so the grid refreshes
      try {
        await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      } catch {
        // ignore
      }
      setToast({
        open: true,
        severity: "success",
        message: "Subscription created"
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
      // invalidate subscriptions list so the grid refreshes
      try {
        await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      } catch {
        // ignore
      }
      setToast({
        open: true,
        severity: "success",
        message: "Subscription updated"
      });
      setTimeout(() => navigate("/subscriptions"), 2000);
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
    durationInHours: subscriptionData?.durationInHours ?? 24,
    price: subscriptionData?.price || "",
    description: subscriptionData?.description || "",
    status: subscriptionData?.status || "active"
  };

  const [closing, setClosing] = React.useState(false);
  const submitRef = React.useRef(null);
  const submittingRef = React.useRef(false);

  const handleClose = () => {
    // animate out then navigate after animation finishes
    setClosing(true);
    setTimeout(() => navigate("/subscriptions"), 320);
  };

  return (
    <Drawer
      anchor="right"
      open
      onClose={handleClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 500 } } }}
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
              {isEdit ? "Edit Subscription" : "Add Subscription"}
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
                  name: Yup.string().required("Required"),
                  durationInHours: Yup.number()
                    .typeError("Must be a number")
                    .integer("Must be an integer")
                    .min(1, "Must be >= 1")
                    .required("Required"),
                  price: Yup.number()
                    .typeError("Must be a number")
                    .min(0, "Must be >= 0")
                    .required("Required"),
                  description: Yup.string().nullable(),
                  status: Yup.string()
                    .oneOf(["active", "draft", "inactive"])
                    .required("Required")
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
                {({ isSubmitting, submitForm }) => {
                  submitRef.current = submitForm;
                  submittingRef.current = isSubmitting;
                  return (
                    <Form>
                      <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextFieldWrapper name="name" label="Name" />
                        <TextFieldWrapper
                          name="durationInHours"
                          label="Duration (hours)"
                          type="number"
                        />
                        <TextFieldWrapper name="price" label="Price" />
                        <TextFieldWrapper
                          name="description"
                          label="Description"
                          multiline
                          rows={3}
                        />
                        <SelectFieldWrapper
                          name="status"
                          label="Status"
                          options={[
                            { value: "active", label: "Active" },
                            { value: "draft", label: "Draft" },
                            { value: "inactive", label: "Inactive" }
                          ]}
                        />
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
