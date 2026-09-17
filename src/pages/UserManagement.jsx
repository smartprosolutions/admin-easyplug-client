import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Grid,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Navigate } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PeopleIcon from "@mui/icons-material/People";
import VerifiedIcon from "@mui/icons-material/Verified";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CampaignIcon from "@mui/icons-material/Campaign";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";
import ReferralQrCodes from "../components/ReferralQrCodes";
import TextFieldWrapper from "../components/forms/TextFieldWrapper";
import SelectFieldWrapper from "../components/forms/SelectFieldWrapper";
import AdminPasswordDialog from "../components/modals/AdminPasswordDialog";
import { gradientPrimary } from "../theme/theme";
import {
  getUserManagementData,
  updateUserStatus,
  createUserByAdmin,
  updateUserByAdmin,
  suspendUserByAdmin,
  cascadeDeleteUser,
} from "../services/userManagementService";
import { useUserProfileQuery } from "../services/queries";
import {
  isAmbassadorRole,
  isAdminRole,
  isSellerRole,
  hasReferralPowers,
  resolveUserRole,
} from "../utils/accessControl";
import { buildReferralShareLinks } from "../utils/referral";
import {
  createNameFieldSchema,
  sanitizeNameInput,
} from "../utils/nameValidation";
import {
  createPhoneFieldSchema,
  sanitizePhoneInput,
} from "../utils/phoneValidation";
import {
  downloadCsv,
  formatExportDate,
  rowsToCsv,
} from "../utils/csvExport";

const TITLE_OPTIONS = [
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
  { value: "Dr", label: "Dr" },
  { value: "Prof", label: "Prof" },
];

const ADD_USER_LABELS = {
  admin: "Admin",
  seller: "Lister",
  user: "User",
  ambassador: "Referral partner",
};

const createUserValidationSchema = Yup.object({
  title: Yup.string()
    .required("Title is required")
    .test(
      "valid-title",
      "Select a valid title",
      (value) =>
        !value || TITLE_OPTIONS.some((option) => option.value === value),
    ),
  firstName: createNameFieldSchema("First name"),
  lastName: createNameFieldSchema("Last name"),
  email: Yup.string()
    .transform((value) =>
      typeof value === "string" ? value.trim().toLowerCase() : value,
    )
    .required("Email is required")
    .email("Enter a valid email")
    .max(255, "Email must be at most 255 characters"),
  phone: createPhoneFieldSchema({ required: false, label: "Cellphone" }),
});

export default function UserManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const queryClient = useQueryClient();
  const { data: profileData } = useUserProfileQuery({ retry: false });
  const role = resolveUserRole(profileData);
  const canMutateUsers = isAdminRole(role);
  const isReferralViewer =
    hasReferralPowers(profileData) && !canMutateUsers;
  const tabUserTypes = isReferralViewer
    ? ["seller", "user"]
    : ["admin", "seller", "user", "ambassador"];
  const [activeTab, setActiveTab] = useState(0);
  const [adminQuery, setAdminQuery] = useState("");
  const [sellerQuery, setSellerQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [ambassadorQuery, setAmbassadorQuery] = useState("");

  // Dialog states
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteAdminPasswordError, setDeleteAdminPasswordError] = useState("");
  const [editAdminPasswordOpen, setEditAdminPasswordOpen] = useState(false);
  const [editAdminPasswordError, setEditAdminPasswordError] = useState("");
  const [pendingEditPayload, setPendingEditPayload] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [referralsAmbassador, setReferralsAmbassador] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { data, isPending, error } = useQuery({
    queryKey: ["user-management"],
    queryFn: getUserManagementData,
  });

  const ambassadorMe = data?.data?.me || null;
  const ambassadorLinks =
    ambassadorMe?.referralLinks || ambassadorMe?.ambassadorLinks || null;

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const copyText = useCallback(
    async (value, label) => {
      try {
        await navigator.clipboard.writeText(String(value || ""));
        showSnackbar(`${label} copied`, "success");
      } catch {
        showSnackbar(`Could not copy ${label}`, "warning");
      }
    },
    [showSnackbar],
  );

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      showSnackbar(
        `${variables.name} has been ${variables.status === "active" ? "activated" : "deactivated"}`,
        "success",
      );
    },
    onError: (mutationError) => {
      showSnackbar(
        mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Failed to update user status",
        "error",
      );
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUserByAdmin,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      setAddDialogOpen(false);
      showSnackbar(
        response?.message ||
          "Account created and login details emailed",
        response?.credentialsEmailed === false ? "warning" : "success",
      );
    },
    onError: (mutationError) => {
      showSnackbar(
        mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Failed to create user",
        "error",
      );
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, payload }) => updateUserByAdmin(userId, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      setEditDialogOpen(false);
      setEditUser(null);
      showSnackbar(response?.message || "User updated successfully", "success");
    },
    onError: (mutationError) => {
      showSnackbar(
        mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Failed to update user",
        "error",
      );
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (userId) => suspendUserByAdmin(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      queryClient.invalidateQueries({ queryKey: ["adminListings"] });
      const name =
        `${selectedUser?.firstName || ""} ${selectedUser?.lastName || ""}`.trim() ||
        selectedUser?.businessName ||
        "User";
      showSnackbar(
        `${name} has been suspended. Their listings are now hidden.`,
        "warning",
      );
      setDeactivateDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (mutationError) => {
      showSnackbar(
        mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Failed to suspend user",
        "error",
      );
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId, adminPassword }) =>
      cascadeDeleteUser(userId, adminPassword),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-management"] });
      queryClient.invalidateQueries({ queryKey: ["adminListings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-insights"] });
      const name =
        `${deleteUser?.firstName || ""} ${deleteUser?.lastName || ""}`.trim() ||
        deleteUser?.businessName ||
        "User";
      const hadErrors = data?.cascadeErrors?.length > 0;
      showSnackbar(
        hadErrors
          ? `${name} deleted. Some associated items could not be removed — check listings manually.`
          : `${name} and all their data have been permanently deleted.`,
        hadErrors ? "warning" : "success",
      );
      setDeleteDialogOpen(false);
      setDeleteUser(null);
      setDeleteAdminPasswordError("");
    },
    onError: (mutationError) => {
      const message =
        mutationError?.response?.data?.message ||
        mutationError?.message ||
        "Failed to delete user";
      setDeleteAdminPasswordError(message);
      showSnackbar(message, "error");
    },
  });

  const adminRows = useMemo(() => data?.data?.admins || [], [data]);
  const sellerRows = useMemo(() => data?.data?.sellers || [], [data]);
  const buyerRows = useMemo(() => data?.data?.users || [], [data]);
  const ambassadorRows = useMemo(
    () => data?.data?.ambassadors || [],
    [data],
  );

  const getReferredPeople = useCallback(
    (ambassador) => {
      const ambassadorId = String(
        ambassador?.userId || ambassador?.id || "",
      );
      if (!ambassadorId) return [];
      const listers = sellerRows
        .filter(
          (row) =>
            String(row.registeredByUserId || row.registeredBy?.userId || "") ===
            ambassadorId,
        )
        .map((row) => ({
          ...row,
          referralKind: "Lister",
        }));
      const shoppers = buyerRows
        .filter(
          (row) =>
            String(row.registeredByUserId || row.registeredBy?.userId || "") ===
            ambassadorId,
        )
        .map((row) => ({
          ...row,
          referralKind: "User",
        }));
      return [...listers, ...shoppers].sort((a, b) => {
        const aDate = new Date(a.dateCreated || 0).getTime();
        const bDate = new Date(b.dateCreated || 0).getTime();
        return bDate - aDate;
      });
    },
    [buyerRows, sellerRows],
  );

  const referralsList = useMemo(
    () =>
      referralsAmbassador ? getReferredPeople(referralsAmbassador) : [],
    [getReferredPeople, referralsAmbassador],
  );

  const activeUserType = tabUserTypes[activeTab] || "user";
  const addUserLabel = ADD_USER_LABELS[activeUserType] || "User";

  // Filter data based on search queries
  const filteredAdmins = useMemo(() => {
    return adminRows.filter(
      (admin) =>
        String(admin.firstName || "")
          .toLowerCase()
          .includes(adminQuery.toLowerCase()) ||
        String(admin.lastName || "")
          .toLowerCase()
          .includes(adminQuery.toLowerCase()) ||
        String(admin.email || "").toLowerCase().includes(adminQuery.toLowerCase()),
    );
  }, [adminQuery, adminRows]);

  const filteredSellers = useMemo(() => {
    return sellerRows.filter(
      (seller) =>
        String(seller.businessName || "")
          .toLowerCase()
          .includes(sellerQuery.toLowerCase()) ||
        String(seller.firstName || "")
          .toLowerCase()
          .includes(sellerQuery.toLowerCase()) ||
        String(seller.lastName || "")
          .toLowerCase()
          .includes(sellerQuery.toLowerCase()) ||
        String(seller.email || "")
          .toLowerCase()
          .includes(sellerQuery.toLowerCase()),
    );
  }, [sellerQuery, sellerRows]);

  const filteredUsers = useMemo(() => {
    return buyerRows.filter(
      (user) =>
        String(user.firstName || "")
          .toLowerCase()
          .includes(userQuery.toLowerCase()) ||
        String(user.lastName || "")
          .toLowerCase()
          .includes(userQuery.toLowerCase()) ||
        String(user.email || "").toLowerCase().includes(userQuery.toLowerCase()),
    );
  }, [buyerRows, userQuery]);

  const filteredAmbassadors = useMemo(() => {
    return ambassadorRows.filter(
      (ambassador) =>
        String(ambassador.firstName || "")
          .toLowerCase()
          .includes(ambassadorQuery.toLowerCase()) ||
        String(ambassador.lastName || "")
          .toLowerCase()
          .includes(ambassadorQuery.toLowerCase()) ||
        String(ambassador.email || "")
          .toLowerCase()
          .includes(ambassadorQuery.toLowerCase()) ||
        String(ambassador.referralCode || "")
          .toLowerCase()
          .includes(ambassadorQuery.toLowerCase()),
    );
  }, [ambassadorQuery, ambassadorRows]);

  // Action handlers
  const handleToggleStatus = useCallback((user, entityType) => {
    if (!canMutateUsers) return;
    setSelectedUser({ ...user, entityType });
    setDeactivateDialogOpen(true);
  }, [canMutateUsers]);

  const handleConfirmToggle = useCallback(() => {
    if (!selectedUser) return;
    const isActive = selectedUser.status === "active";
    const isSeller = selectedUser.entityType === "Seller";
    const fullName =
      `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() ||
      selectedUser.businessName ||
      "User";

    if (isActive && isSeller) {
      // Sellers get "suspended" so the backend can hide their listings
      suspendMutation.mutate(selectedUser.id || selectedUser.userId);
    } else {
      const nextStatus = isActive ? "inactive" : "active";
      toggleStatusMutation.mutate({
        userId: selectedUser.id || selectedUser.userId,
        status: nextStatus,
        name: fullName,
      });
      setDeactivateDialogOpen(false);
      setSelectedUser(null);
    }
  }, [selectedUser, toggleStatusMutation, suspendMutation]);

  const handleOpenDeleteDialog = useCallback((user) => {
    setDeleteUser(user);
    setDeleteAdminPasswordError("");
    setDeleteDialogOpen(true);
  }, []);

  const handleView = useCallback((user, entityType) => {
    setViewUser({ ...user, entityType });
    setViewDialogOpen(true);
  }, []);

  const handleViewReferrals = useCallback((ambassador) => {
    setReferralsAmbassador(ambassador);
  }, []);

  const handleEdit = useCallback((user) => {
    setEditUser(user);
    setEditDialogOpen(true);
  }, []);

  const handleOpenAddDialog = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

  const handleCreateUser = useCallback(
    async (values, helpers) => {
      try {
        await createUserMutation.mutateAsync({
          title: values.title,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone?.trim() || undefined,
          userType: activeUserType,
          ...(activeUserType === "seller"
            ? { referralsEnabled: Boolean(values.referralsEnabled) }
            : {}),
        });
        helpers.resetForm();
      } catch {
        // Error toast handled by mutation
      } finally {
        helpers.setSubmitting(false);
      }
    },
    [activeUserType, createUserMutation],
  );

  const handleUpdateUser = useCallback(
    async (values, helpers) => {
      if (!editUser) return;
      const userId = editUser.userId || editUser.id;
      const currentRole = (editUser.userType || editUser.entityType || "").toLowerCase();
      const newRole = (values.userType || "").toLowerCase();
      const roleChanged = newRole !== currentRole;
      const hadReferrals = Boolean(editUser.referralCode);
      const referralsEnabled = Boolean(values.referralsEnabled);
      const referralsChanged = hadReferrals !== referralsEnabled;

      const payload = {
        title: values.title,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone?.trim() || undefined,
        userType: values.userType,
      };

      if (
        String(values.userType || "").toLowerCase() === "seller" ||
        String(editUser.userType || "").toLowerCase() === "seller" ||
        String(editUser.userType || "").toLowerCase() === "ambassador"
      ) {
        payload.referralsEnabled = referralsEnabled;
      }

      // Require admin password when changing the user's role
      if (roleChanged) {
        setPendingEditPayload({ userId, payload, helpers });
        setEditAdminPasswordError("");
        setEditAdminPasswordOpen(true);
        helpers.setSubmitting(false);
        return;
      }

      try {
        await updateUserMutation.mutateAsync({ userId, payload });
        helpers.resetForm();
        if (referralsChanged) {
          showSnackbar(
            referralsEnabled
              ? "Referral powers enabled"
              : "Referral powers disabled",
            "success",
          );
        }
      } catch {
        // Error toast handled by mutation
      } finally {
        helpers.setSubmitting(false);
      }
    },
    [editUser, showSnackbar, updateUserMutation],
  );

  const handleExport = useCallback(() => {
    const stamp = formatExportDate();
    const formatIsoDate = (value) => {
      if (!value) return "";
      try {
        return new Date(value).toISOString().slice(0, 10);
      } catch {
        return "";
      }
    };

    if (activeUserType === "admin") {
      if (filteredAdmins.length === 0) {
        showSnackbar("No admins to export", "warning");
        return;
      }
      const csv = rowsToCsv(
        [
          { key: "title", label: "Title" },
          { key: "firstName", label: "First Name" },
          { key: "lastName", label: "Last Name" },
          { key: "email", label: "Email" },
          {
            key: "phone",
            label: "Phone",
            getValue: (row) =>
              row.phone && row.phone !== "-" ? row.phone : "",
          },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" },
          {
            key: "dateCreated",
            label: "Date Created",
            getValue: (row) => formatIsoDate(row.dateCreated),
          },
          {
            key: "dateUpdated",
            label: "Last Updated",
            getValue: (row) => formatIsoDate(row.dateUpdated),
          },
        ],
        filteredAdmins,
      );
      downloadCsv(`easyplug-admins-${stamp}.csv`, csv);
      showSnackbar(`Exported ${filteredAdmins.length} admin(s)`, "success");
      return;
    }

    if (activeUserType === "seller") {
      if (filteredSellers.length === 0) {
        showSnackbar("No listers to export", "warning");
        return;
      }
      const csv = rowsToCsv(
        [
          { key: "title", label: "Title" },
          { key: "firstName", label: "First Name" },
          { key: "lastName", label: "Last Name" },
          { key: "email", label: "Email" },
          {
            key: "phone",
            label: "Phone",
            getValue: (row) =>
              row.phone && row.phone !== "-" ? row.phone : "",
          },
          { key: "businessName", label: "Business Name" },
          { key: "businessEmail", label: "Business Email" },
          {
            key: "verified",
            label: "Verified",
            getValue: (row) => (row.verified ? "Yes" : "No"),
          },
          { key: "listings", label: "Listings" },
          {
            key: "registeredBy",
            label: "Registered By",
            getValue: (row) =>
              row.registeredBy?.name ||
              row.registeredBy?.email ||
              "",
          },
          { key: "status", label: "Status" },
          {
            key: "dateCreated",
            label: "Joined",
            getValue: (row) => formatIsoDate(row.dateCreated),
          },
          {
            key: "dateUpdated",
            label: "Last Updated",
            getValue: (row) => formatIsoDate(row.dateUpdated),
          },
        ],
        filteredSellers,
      );
      downloadCsv(`easyplug-sellers-${stamp}.csv`, csv);
      showSnackbar(`Exported ${filteredSellers.length} lister(s)`, "success");
      return;
    }

    if (activeUserType === "ambassador") {
      if (filteredAmbassadors.length === 0) {
        showSnackbar("No referral partners to export", "warning");
        return;
      }
      const csv = rowsToCsv(
        [
          { key: "title", label: "Title" },
          { key: "firstName", label: "First Name" },
          { key: "lastName", label: "Last Name" },
          { key: "email", label: "Email" },
          { key: "referralCode", label: "Referral Code" },
          { key: "referralsCount", label: "Referrals" },
          { key: "status", label: "Status" },
          {
            key: "dateCreated",
            label: "Joined",
            getValue: (row) => formatIsoDate(row.dateCreated),
          },
        ],
        filteredAmbassadors,
      );
      downloadCsv(`easyplug-referral-partners-${stamp}.csv`, csv);
      showSnackbar(
        `Exported ${filteredAmbassadors.length} referral partner(s)`,
        "success",
      );
      return;
    }

    if (filteredUsers.length === 0) {
      showSnackbar(
        isReferralViewer ? "No shoppers to export" : "No users to export",
        "warning",
      );
      return;
    }
    const csv = rowsToCsv(
      [
        { key: "title", label: "Title" },
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "email", label: "Email" },
        {
          key: "phone",
          label: "Phone",
          getValue: (row) =>
            row.phone && row.phone !== "-" ? row.phone : "",
        },
        { key: "orders", label: "Orders" },
        {
          key: "registeredBy",
          label: "Registered By",
          getValue: (row) =>
            row.registeredBy?.name ||
            row.registeredBy?.email ||
            "",
        },
        { key: "status", label: "Status" },
        {
          key: "dateCreated",
          label: "Joined",
          getValue: (row) => formatIsoDate(row.dateCreated),
        },
        {
          key: "dateUpdated",
          label: "Last Updated",
          getValue: (row) => formatIsoDate(row.dateUpdated),
        },
      ],
      filteredUsers,
    );
    downloadCsv(
      isReferralViewer
        ? `easyplug-shoppers-${stamp}.csv`
        : `easyplug-users-${stamp}.csv`,
      csv,
    );
    showSnackbar(
      isReferralViewer
        ? `Exported ${filteredUsers.length} shopper(s)`
        : `Exported ${filteredUsers.length} user(s)`,
      "success",
    );
  }, [
    activeUserType,
    filteredAdmins,
    filteredAmbassadors,
    filteredSellers,
    filteredUsers,
    isReferralViewer,
    showSnackbar,
  ]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  }, []);

  // Admin columns
  const adminColumns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1.25,
        minWidth: 220,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: "#667eea", fontSize: 14 }}
            >
              {params.row.firstName?.charAt(0)}
              {params.row.lastName?.charAt(0)}
            </Avatar>
            <Typography fontSize={13} fontWeight={500}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
          </Stack>
        ),
      },
      { field: "email", headerName: "Email", flex: 1.2 },
      {
        field: "role",
        headerName: "Role",
        width: 140,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            sx={{
              bgcolor: alpha("#667eea", 0.1),
              color: "#667eea",
              fontWeight: 600,
            }}
          />
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (params) => (
          <Chip
            color={params.value === "active" ? "success" : "default"}
            label={params.value}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        ),
      },
      {
        field: "dateCreated",
        headerName: "Date Created",
        width: 130,
        renderCell: (params) => formatDate(params.value),
      },
      {
        field: "dateUpdated",
        headerName: "Last Updated",
        width: 130,
        renderCell: (params) => formatDate(params.value),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: canMutateUsers ? 160 : 80,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleView(params.row, "Admin")}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canMutateUsers ? (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => handleEdit(params.row)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title={
                    params.row.status === "active" ? "Deactivate" : "Activate"
                  }
                >
                  <IconButton
                    size="small"
                    color={params.row.status === "active" ? "error" : "success"}
                    onClick={() => handleToggleStatus(params.row, "Admin")}
                  >
                    {params.row.status === "active" ? (
                      <BlockIcon fontSize="small" />
                    ) : (
                      <CheckCircleIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleOpenDeleteDialog(params.row)}
                  >
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : null}
          </Stack>
        ),
      },
    ],
    [
      canMutateUsers,
      formatDate,
      handleEdit,
      handleToggleStatus,
      handleView,
      handleOpenDeleteDialog,
    ],
  );

  // Seller columns
  const sellerColumns = useMemo(
    () => [
      {
        field: "businessName",
        headerName: "Business",
        flex: 1.35,
        minWidth: 260,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: "#9c27b0", fontSize: 14 }}
            >
              {params.value?.charAt(0)}
            </Avatar>
            <Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography fontSize={13} fontWeight={500}>
                  {params.value}
                </Typography>
                {params.row.verified && (
                  <VerifiedIcon sx={{ fontSize: 14, color: "#667eea" }} />
                )}
              </Stack>
              <Typography fontSize={11} color="text.secondary">
                {params.row.firstName} {params.row.lastName}
              </Typography>
            </Stack>
          </Stack>
        ),
      },
      { field: "email", headerName: "Email", flex: 1 },
      {
        field: "verified",
        headerName: "Verified",
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            color={params.value ? "success" : "default"}
            label={params.value ? "Yes" : "No"}
            sx={{ fontWeight: 600 }}
          />
        ),
      },
      {
        field: "listings",
        headerName: "Listings",
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            sx={{
              bgcolor: alpha("#4caf50", 0.1),
              color: "#4caf50",
              fontWeight: 700,
            }}
          />
        ),
      },
      ...(!isReferralViewer
        ? [
            {
              field: "registeredBy",
              headerName: "Registered By",
              flex: 1,
              minWidth: 160,
              valueGetter: (_value, row) =>
                row.registeredBy?.name ||
                row.registeredBy?.email ||
                "—",
            },
          ]
        : []),
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (params) => {
          const color =
            params.value === "active"
              ? "success"
              : params.value === "pending"
                ? "warning"
                : "error";
          return (
            <Chip
              color={color}
              label={params.value}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        field: "dateCreated",
        headerName: "Joined",
        width: 120,
        renderCell: (params) => formatDate(params.value),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: canMutateUsers ? 160 : 80,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleView(params.row, "Seller")}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canMutateUsers ? (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => handleEdit(params.row)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title={
                    params.row.status === "active" ? "Suspend" : "Activate"
                  }
                >
                  <IconButton
                    size="small"
                    color={params.row.status === "active" ? "error" : "success"}
                    onClick={() => handleToggleStatus(params.row, "Seller")}
                  >
                    {params.row.status === "active" ? (
                      <BlockIcon fontSize="small" />
                    ) : (
                      <CheckCircleIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleOpenDeleteDialog(params.row)}
                  >
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : null}
          </Stack>
        ),
      },
    ],
    [
      canMutateUsers,
      formatDate,
      handleEdit,
      handleToggleStatus,
      handleView,
      handleOpenDeleteDialog,
      isReferralViewer,
    ],
  );

  // User columns
  const userColumns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1.25,
        minWidth: 220,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: "#00bcd4", fontSize: 14 }}
            >
              {params.row.firstName?.charAt(0)}
              {params.row.lastName?.charAt(0)}
            </Avatar>
            <Typography fontSize={13} fontWeight={500}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
          </Stack>
        ),
      },
      { field: "email", headerName: "Email", flex: 1 },
      { field: "phone", headerName: "Phone", width: 150 },
      {
        field: "orders",
        headerName: "Orders",
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            sx={{
              bgcolor: alpha("#ff9800", 0.1),
              color: "#ff9800",
              fontWeight: 700,
            }}
          />
        ),
      },
      ...(!isReferralViewer
        ? [
            {
              field: "registeredBy",
              headerName: "Registered By",
              flex: 1,
              minWidth: 160,
              valueGetter: (_value, row) =>
                row.registeredBy?.name ||
                row.registeredBy?.email ||
                "—",
            },
          ]
        : []),
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (params) => (
          <Chip
            color={params.value === "active" ? "success" : "default"}
            label={params.value}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        ),
      },
      {
        field: "dateCreated",
        headerName: "Joined",
        width: 120,
        renderCell: (params) => formatDate(params.value),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: canMutateUsers ? 140 : 80,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleView(params.row, "User")}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canMutateUsers ? (
              <>
                <Tooltip
                  title={
                    params.row.status === "active" ? "Deactivate" : "Activate"
                  }
                >
                  <IconButton
                    size="small"
                    color={params.row.status === "active" ? "error" : "success"}
                    onClick={() => handleToggleStatus(params.row, "User")}
                  >
                    {params.row.status === "active" ? (
                      <BlockIcon fontSize="small" />
                    ) : (
                      <CheckCircleIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleOpenDeleteDialog(params.row)}
                  >
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : null}
          </Stack>
        ),
      },
    ],
    [
      canMutateUsers,
      formatDate,
      handleToggleStatus,
      handleView,
      handleOpenDeleteDialog,
      isReferralViewer,
    ],
  );

  const ambassadorColumns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1.25,
        minWidth: 220,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: "#ff7043", fontSize: 14 }}
            >
              {params.row.firstName?.charAt(0)}
              {params.row.lastName?.charAt(0)}
            </Avatar>
            <Typography fontSize={13} fontWeight={500}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
          </Stack>
        ),
      },
      { field: "email", headerName: "Email", flex: 1.2 },
      {
        field: "referralCode",
        headerName: "Referral Code",
        width: 140,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value || "—"}
            sx={{
              bgcolor: alpha("#ff7043", 0.12),
              color: "#e64a19",
              fontWeight: 700,
            }}
          />
        ),
      },
      {
        field: "referralsCount",
        headerName: "Referrals",
        width: 130,
        renderCell: (params) => {
          const count = Number(params.value ?? 0);
          return (
            <Chip
              size="small"
              clickable={count > 0}
              onClick={(event) => {
                event.stopPropagation();
                if (count > 0) handleViewReferrals(params.row);
              }}
              label={count}
              title={count > 0 ? "View referred people" : undefined}
              sx={{
                bgcolor: alpha("#667eea", 0.1),
                color: "#667eea",
                fontWeight: 700,
                cursor: count > 0 ? "pointer" : "default",
              }}
            />
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (params) => (
          <Chip
            color={params.value === "active" ? "success" : "default"}
            label={params.value}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        ),
      },
      {
        field: "dateCreated",
        headerName: "Joined",
        width: 120,
        renderCell: (params) => formatDate(params.value),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 160,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleView(params.row, "Referral partner")}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleEdit(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={params.row.status === "active" ? "Deactivate" : "Activate"}
            >
              <IconButton
                size="small"
                color={params.row.status === "active" ? "error" : "success"}
                onClick={() => handleToggleStatus(params.row, "Referral partner")}
              >
                {params.row.status === "active" ? (
                  <BlockIcon fontSize="small" />
                ) : (
                  <CheckCircleIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleOpenDeleteDialog(params.row)}
              >
                <DeleteForeverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [formatDate, handleEdit, handleToggleStatus, handleView, handleOpenDeleteDialog, handleViewReferrals],
  );

  const activeAdminsCount = adminRows.filter(
    (admin) => String(admin.status || "").toLowerCase() === "active",
  ).length;
  const activeSellersCount = sellerRows.filter(
    (seller) => String(seller.status || "").toLowerCase() === "active",
  ).length;
  const verifiedSellersCount = sellerRows.filter((seller) =>
    Boolean(seller.verified),
  ).length;
  const activeUsersCount = buyerRows.filter(
    (user) => String(user.status || "").toLowerCase() === "active",
  ).length;
  const activeAmbassadorsCount = ambassadorRows.filter(
    (ambassador) =>
      String(ambassador.status || "").toLowerCase() === "active",
  ).length;

  const totalBuyerOrders = buyerRows.reduce(
    (sum, user) => sum + Number(user.orders || 0),
    0,
  );

  const userOverviewCards = isReferralViewer
    ? [
        {
          label: "Referred Listers",
          value: `${sellerRows.length}`,
          sub: `${activeSellersCount} active`,
          accent: "success.main",
        },
        {
          label: "Referred Shoppers",
          value: `${buyerRows.length}`,
          sub: `${activeUsersCount} active`,
          accent: "secondary.main",
        },
        {
          label: "Buyer Orders",
          value: totalBuyerOrders.toLocaleString("en-ZA"),
          sub: "From referred users",
          accent: "info.main",
        },
      ]
    : [
        {
          label: "Admin Accounts",
          value: `${adminRows.length}`,
          sub: `${activeAdminsCount} active admins`,
          accent: "primary.main",
        },
        {
          label: "Lister Accounts",
          value: `${sellerRows.length}`,
          sub: `${activeSellersCount} active listers`,
          accent: "success.main",
        },
        {
          label: "Verified Listers",
          value: `${verifiedSellersCount}`,
          sub: "Trusted and verified businesses",
          accent: "warning.main",
        },
        {
          label: "Buyer Accounts",
          value: `${buyerRows.length}`,
          sub: `${activeUsersCount} active buyers`,
          accent: "secondary.main",
        },
        {
          label: "Referral Partners",
          value: `${ambassadorRows.length}`,
          sub: `${activeAmbassadorsCount} active`,
          accent: "error.main",
        },
        {
          label: "Buyer Orders",
          value: totalBuyerOrders.toLocaleString("en-ZA"),
          sub: "Combined order activity",
          accent: "info.main",
        },
      ];

  const loadErrorMessage =
    error?.response?.data?.message ||
    error?.message ||
    "Failed to load user management data";

  // Sellers without referral powers cannot use this page
  if (
    (isSellerRole(role) || isAmbassadorRole(role)) &&
    !canMutateUsers &&
    !hasReferralPowers(profileData) &&
    !isPending
  ) {
    return <Navigate to="/inventory" replace />;
  }

  return (
    <Box sx={{ py: { xs: 1.25, sm: 2, md: 3 }, px: { xs: 1.25, sm: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: 22, sm: 28 } }}>
            {isReferralViewer ? "Referrals" : "User Management"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isReferralViewer
              ? "View shoppers and listers you referred"
              : "Manage admins, referral partners, listers, and users"}
          </Typography>
        </Box>
      </Stack>

      {isReferralViewer && ambassadorLinks ? (
        <Paper
          variant="outlined"
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha("#667eea", 0.04),
          }}
        >
          <Typography fontWeight={700} sx={{ mb: 1 }}>
            Your referral links
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Code:{" "}
            <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              {ambassadorMe?.referralCode || ambassadorLinks.referralCode || "—"}
            </Box>
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            flexWrap="wrap"
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() =>
                copyText(
                  ambassadorMe?.referralCode || ambassadorLinks.referralCode,
                  "Referral code",
                )
              }
              sx={{ borderRadius: 2 }}
            >
              Copy code
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() =>
                copyText(
                  ambassadorLinks.shopper || ambassadorLinks.shopperLink,
                  "Shopper referral link",
                )
              }
              sx={{ borderRadius: 2 }}
            >
              Copy shopper link
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() =>
                copyText(
                  ambassadorLinks.lister || ambassadorLinks.listerLink,
                  "Lister referral link",
                )
              }
              sx={{ borderRadius: 2 }}
            >
              Copy lister link
            </Button>
          </Stack>
          <ReferralQrCodes
            shopperUrl={
              ambassadorLinks.shopper || ambassadorLinks.shopperLink
            }
            listerUrl={ambassadorLinks.lister || ambassadorLinks.listerLink}
          />
        </Paper>
      ) : null}

      {isPending && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {loadErrorMessage}
        </Alert>
      )}

      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.2 }}>
          {isReferralViewer ? "Referrals overview" : "User Overview"}
        </Typography>
        <Grid container spacing={1.5}>
          {userOverviewCards.map((card) => (
            <Grid key={card.label} size={{ xs: 6, sm: 6, md: 4, lg: 2.4 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.8,
                  height: "100%",
                  borderLeft: "4px solid",
                  borderLeftColor: card.accent,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {card.label}
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ lineHeight: 1.2, my: 0.4 }}
                >
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.sub}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tabs */}
      <Box>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, sm: 2 },
            borderBottom: "1px solid #e0e0e0",
            "& .MuiTab-root": {
              fontWeight: 600,
              textTransform: "none",
              minHeight: 56,
              minWidth: isMobile ? 120 : undefined,
            },
            "& .Mui-selected": { color: "#667eea" },
            "& .MuiTabs-indicator": { bgcolor: "#667eea" },
          }}
        >
          {tabUserTypes.includes("admin") ? (
            <Tab
              icon={<AdminPanelSettingsIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`Admins (${filteredAdmins.length})`}
            />
          ) : null}
          <Tab
            icon={<StorefrontIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={`Listers (${filteredSellers.length})`}
          />
          <Tab
            icon={<PeopleIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={`${isReferralViewer ? "Shoppers" : "Users"} (${filteredUsers.length})`}
          />
          {tabUserTypes.includes("ambassador") ? (
            <Tab
              icon={<CampaignIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`Referral partners (${filteredAmbassadors.length})`}
            />
          ) : null}
        </Tabs>

        {/* Admins Tab */}
        {activeUserType === "admin" && (
          <Box
            sx={{
              p: { xs: 1.5, sm: 3 },
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.015),
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 3 }}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                value={adminQuery}
                onChange={(e) => setAdminQuery(e.target.value)}
                placeholder="Search admin name or email..."
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: alpha("#667eea", 0.04) },
                }}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
                >
                  Export
                </Button>
                {canMutateUsers ? (
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenAddDialog}
                    sx={{
                      backgroundImage: gradientPrimary,
                      color: "#fff",
                      minWidth: { xs: "100%", sm: 160 },
                      whiteSpace: "nowrap",
                      borderRadius: 2,
                      px: 3,
                    }}
                  >
                    Add Admin
                  </Button>
                ) : null}
              </Stack>
            </Stack>
            {isMobile ? (
              <Stack spacing={1.25}>
                {filteredAdmins.map((admin) => (
                  <Paper
                    key={admin.id}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2 }}
                  >
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: "#667eea",
                            fontSize: 13,
                          }}
                        >
                          {admin.firstName?.charAt(0)}
                          {admin.lastName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontWeight={600} fontSize={14} noWrap>
                            {admin.firstName} {admin.lastName}
                          </Typography>
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            noWrap
                          >
                            {admin.email}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ flexWrap: "wrap", rowGap: 0.75 }}
                      >
                        <Chip
                          size="small"
                          label={admin.role}
                          sx={{
                            bgcolor: alpha("#667eea", 0.1),
                            color: "#667eea",
                            fontWeight: 600,
                          }}
                        />
                        <Chip
                          size="small"
                          color={
                            admin.status === "active" ? "success" : "default"
                          }
                          label={admin.status}
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>

                      <Typography fontSize={12} color="text.secondary">
                        Joined: {formatDate(admin.dateCreated)}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleView(admin, "Admin")}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleEdit(admin)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color={
                            admin.status === "active" ? "error" : "success"
                          }
                          onClick={() => handleToggleStatus(admin, "Admin")}
                        >
                          {admin.status === "active" ? (
                            <BlockIcon fontSize="small" />
                          ) : (
                            <CheckCircleIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(admin)}
                        >
                          <DeleteForeverIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                {filteredAdmins.length === 0 && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography color="text.secondary" fontSize={13}>
                      No admins found.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            ) : (
              <MetricsDataGrid
                rows={filteredAdmins}
                columns={adminColumns}
                autoHeight
                pageSize={10}
                sx={{
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              />
            )}
          </Box>
        )}

        {/* Sellers Tab */}
        {activeUserType === "seller" && (
          <Box
            sx={{
              p: { xs: 1.5, sm: 3 },
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.015),
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 3 }}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                value={sellerQuery}
                onChange={(e) => setSellerQuery(e.target.value)}
                placeholder="Search lister name, business or email..."
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: alpha("#667eea", 0.04) },
                }}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
                >
                  Export
                </Button>
                {canMutateUsers ? (
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenAddDialog}
                    sx={{
                      backgroundImage: gradientPrimary,
                      color: "#fff",
                      minWidth: { xs: "100%", sm: 160 },
                      whiteSpace: "nowrap",
                      borderRadius: 2,
                      px: 3,
                    }}
                  >
                    Add Lister
                  </Button>
                ) : null}
              </Stack>
            </Stack>
            {isMobile ? (
              <Stack spacing={1.25}>
                {filteredSellers.map((seller) => (
                  <Paper
                    key={seller.id}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2 }}
                  >
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: "#9c27b0",
                            fontSize: 13,
                          }}
                        >
                          {seller.businessName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <Typography fontWeight={600} fontSize={14} noWrap>
                              {seller.businessName}
                            </Typography>
                            {seller.verified && (
                              <VerifiedIcon
                                sx={{ fontSize: 14, color: "#667eea" }}
                              />
                            )}
                          </Stack>
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            noWrap
                          >
                            {seller.firstName} {seller.lastName}
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography fontSize={12} color="text.secondary" noWrap>
                        {seller.email}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ flexWrap: "wrap", rowGap: 0.75 }}
                      >
                        <Chip
                          size="small"
                          color={seller.verified ? "success" : "default"}
                          label={seller.verified ? "Verified" : "Unverified"}
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          size="small"
                          label={`${seller.listings} Listings`}
                          sx={{
                            bgcolor: alpha("#4caf50", 0.1),
                            color: "#4caf50",
                            fontWeight: 700,
                          }}
                        />
                        <Chip
                          size="small"
                          color={
                            seller.status === "active"
                              ? "success"
                              : seller.status === "pending"
                                ? "warning"
                                : "error"
                          }
                          label={seller.status}
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>

                      <Typography fontSize={12} color="text.secondary">
                        Joined: {formatDate(seller.dateCreated)}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleView(seller, "Seller")}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {canMutateUsers ? (
                          <>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleEdit(seller)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color={
                                seller.status === "active" ? "error" : "success"
                              }
                              onClick={() =>
                                handleToggleStatus(seller, "Seller")
                              }
                            >
                              {seller.status === "active" ? (
                                <BlockIcon fontSize="small" />
                              ) : (
                                <CheckCircleIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteDialog(seller)}
                            >
                              <DeleteForeverIcon fontSize="small" />
                            </IconButton>
                          </>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                {filteredSellers.length === 0 && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography color="text.secondary" fontSize={13}>
                      No listers found.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            ) : (
              <MetricsDataGrid
                rows={filteredSellers}
                columns={sellerColumns}
                autoHeight
                pageSize={10}
                sx={{
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              />
            )}
          </Box>
        )}

        {/* Users Tab */}
        {activeUserType === "user" && (
          <Box
            sx={{
              p: { xs: 1.5, sm: 3 },
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.015),
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 3 }}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search user name or email..."
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: alpha("#667eea", 0.04) },
                }}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
                >
                  Export
                </Button>
                {canMutateUsers ? (
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenAddDialog}
                    sx={{
                      backgroundImage: gradientPrimary,
                      color: "#fff",
                      minWidth: { xs: "100%", sm: 160 },
                      whiteSpace: "nowrap",
                      borderRadius: 2,
                      px: 3,
                    }}
                  >
                    Add User
                  </Button>
                ) : null}
              </Stack>
            </Stack>
            {isMobile ? (
              <Stack spacing={1.25}>
                {filteredUsers.map((user) => (
                  <Paper
                    key={user.id}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2 }}
                  >
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: "#00bcd4",
                            fontSize: 13,
                          }}
                        >
                          {user.firstName?.charAt(0)}
                          {user.lastName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontWeight={600} fontSize={14} noWrap>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            noWrap
                          >
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography fontSize={12} color="text.secondary" noWrap>
                        {user.phone}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ flexWrap: "wrap", rowGap: 0.75 }}
                      >
                        <Chip
                          size="small"
                          label={`${user.orders} Orders`}
                          sx={{
                            bgcolor: alpha("#ff9800", 0.1),
                            color: "#ff9800",
                            fontWeight: 700,
                          }}
                        />
                        <Chip
                          size="small"
                          color={
                            user.status === "active" ? "success" : "default"
                          }
                          label={user.status}
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>

                      <Typography fontSize={12} color="text.secondary">
                        Joined: {formatDate(user.dateCreated)}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleView(user, "User")}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {canMutateUsers ? (
                          <>
                            <IconButton
                              size="small"
                              color={
                                user.status === "active" ? "error" : "success"
                              }
                              onClick={() => handleToggleStatus(user, "User")}
                            >
                              {user.status === "active" ? (
                                <BlockIcon fontSize="small" />
                              ) : (
                                <CheckCircleIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteDialog(user)}
                            >
                              <DeleteForeverIcon fontSize="small" />
                            </IconButton>
                          </>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                {filteredUsers.length === 0 && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography color="text.secondary" fontSize={13}>
                      {isReferralViewer
                        ? "No shoppers found."
                        : "No users found."}
                    </Typography>
                  </Paper>
                )}
              </Stack>
            ) : (
              <MetricsDataGrid
                rows={filteredUsers}
                columns={userColumns}
                autoHeight
                pageSize={10}
                sx={{
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              />
            )}
          </Box>
        )}

        {/* Ambassadors Tab */}
        {activeUserType === "ambassador" && (
          <Box
            sx={{
              p: { xs: 1.5, sm: 3 },
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.015),
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 3 }}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                value={ambassadorQuery}
                onChange={(e) => setAmbassadorQuery(e.target.value)}
                placeholder="Search partner name, email, or code..."
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: alpha("#ff7043", 0.04) },
                }}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
                >
                  Export
                </Button>
              </Stack>
            </Stack>
            {isMobile ? (
              <Stack spacing={1.25}>
                {filteredAmbassadors.map((ambassador) => (
                  <Paper
                    key={ambassador.id || ambassador.userId}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2 }}
                  >
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: "#ff7043",
                            fontSize: 13,
                          }}
                        >
                          {ambassador.firstName?.charAt(0)}
                          {ambassador.lastName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontWeight={600} fontSize={14} noWrap>
                            {ambassador.firstName} {ambassador.lastName}
                          </Typography>
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            noWrap
                          >
                            {ambassador.email}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ flexWrap: "wrap", rowGap: 0.75 }}
                      >
                        <Chip
                          size="small"
                          label={ambassador.referralCode || "—"}
                          sx={{
                            bgcolor: alpha("#ff7043", 0.12),
                            color: "#e64a19",
                            fontWeight: 700,
                          }}
                        />
                        <Chip
                          size="small"
                          clickable={(ambassador.referralsCount ?? 0) > 0}
                          onClick={() => {
                            if ((ambassador.referralsCount ?? 0) > 0) {
                              handleViewReferrals(ambassador);
                            }
                          }}
                          label={`${ambassador.referralsCount ?? 0} referrals`}
                          sx={{
                            bgcolor: alpha("#667eea", 0.1),
                            color: "#667eea",
                            fontWeight: 700,
                            cursor:
                              (ambassador.referralsCount ?? 0) > 0
                                ? "pointer"
                                : "default",
                          }}
                        />
                        <Chip
                          size="small"
                          color={
                            ambassador.status === "active"
                              ? "success"
                              : "default"
                          }
                          label={ambassador.status}
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      <Typography fontSize={12} color="text.secondary">
                        Joined: {formatDate(ambassador.dateCreated)}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            handleView(ambassador, "Referral partner")
                          }
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {canMutateUsers ? (
                          <>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleEdit(ambassador)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color={
                                ambassador.status === "active"
                                  ? "error"
                                  : "success"
                              }
                              onClick={() =>
                                handleToggleStatus(ambassador, "Referral partner")
                              }
                            >
                              {ambassador.status === "active" ? (
                                <BlockIcon fontSize="small" />
                              ) : (
                                <CheckCircleIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleOpenDeleteDialog(ambassador)
                              }
                            >
                              <DeleteForeverIcon fontSize="small" />
                            </IconButton>
                          </>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                {filteredAmbassadors.length === 0 && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography color="text.secondary" fontSize={13}>
                      No referral partners found.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            ) : (
              <MetricsDataGrid
                rows={filteredAmbassadors}
                columns={ambassadorColumns}
                autoHeight
                pageSize={10}
                sx={{
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              />
            )}
          </Box>
        )}
      </Box>
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            {selectedUser?.status === "active" ? (
              <BlockIcon sx={{ color: "#f44336" }} />
            ) : (
              <CheckCircleIcon sx={{ color: "#4caf50" }} />
            )}
            <Typography fontWeight={600}>
              {selectedUser?.status === "active" ? "Deactivate" : "Activate"}{" "}
              {selectedUser?.entityType}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to{" "}
            {selectedUser?.status === "active"
              ? selectedUser?.entityType === "Seller"
                ? "suspend"
                : "deactivate"
              : "activate"}{" "}
            <strong>
              {selectedUser?.firstName} {selectedUser?.lastName ||
                selectedUser?.businessName}
            </strong>
            ?
            {selectedUser?.status === "active" &&
              selectedUser?.entityType === "Seller" && (
                <Box component="span" sx={{ display: "block", mt: 1, color: "warning.main", fontWeight: 600 }}>
                  All their listings will be hidden from the marketplace while suspended.
                </Box>
              )}
            {selectedUser?.status === "active" &&
              selectedUser?.entityType !== "Seller" &&
              " They will no longer be able to access the platform."}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            pt: 1,
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
          }}
        >
          <Button
            onClick={() => setDeactivateDialogOpen(false)}
            sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmToggle}
            disabled={toggleStatusMutation.isPending || suspendMutation.isPending}
            sx={{
              borderRadius: 2,
              width: { xs: "100%", sm: "auto" },
              bgcolor:
                selectedUser?.status === "active" ? "#f44336" : "#4caf50",
              "&:hover": {
                bgcolor:
                  selectedUser?.status === "active" ? "#d32f2f" : "#43a047",
              },
            }}
          >
            {toggleStatusMutation.isPending || suspendMutation.isPending
              ? "Updating..."
              : selectedUser?.status === "active"
                ? selectedUser?.entityType === "Seller"
                  ? "Suspend"
                  : "Deactivate"
                : "Activate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !updateUserMutation.isPending && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EditIcon sx={{ color: "#667eea" }} />
            <Typography fontWeight={600}>Edit User</Typography>
          </Stack>
        </DialogTitle>
        <Formik
          initialValues={{
            title: editUser?.title || "",
            firstName: editUser?.firstName || "",
            lastName: editUser?.lastName || "",
            email: editUser?.email || "",
            phone: editUser?.phone && editUser.phone !== "-" ? editUser.phone : "",
            userType:
              String(editUser?.userType || "").toLowerCase() === "ambassador"
                ? "seller"
                : editUser?.userType ||
                  editUser?.entityType?.toLowerCase() ||
                  "seller",
            referralsEnabled: Boolean(editUser?.referralCode),
          }}
          validationSchema={createUserValidationSchema}
          validateOnBlur
          validateOnChange
          onSubmit={handleUpdateUser}
          enableReinitialize
        >
          {({ isSubmitting, isValid, submitCount, values, setFieldValue }) => (
            <Form noValidate>
              <DialogContent>
                <Stack spacing={2}>
                  <SelectFieldWrapper
                    name="title"
                    label="Title"
                    options={TITLE_OPTIONS}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextFieldWrapper
                      name="firstName"
                      label="First name"
                      sanitize={sanitizeNameInput}
                      blockDigits
                      inputMode="text"
                      autoComplete="given-name"
                    />
                    <TextFieldWrapper
                      name="lastName"
                      label="Last name"
                      sanitize={sanitizeNameInput}
                      blockDigits
                      inputMode="text"
                      autoComplete="family-name"
                    />
                  </Stack>
                  <TextFieldWrapper
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                  />
                  <TextFieldWrapper
                    name="phone"
                    label="Cellphone (optional)"
                    sanitize={sanitizePhoneInput}
                    allowOnlyPattern={/[\d+]/}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0821234567"
                  />
                  <SelectFieldWrapper
                    name="userType"
                    label="Role"
                    options={[
                      { value: "seller", label: "Lister" },
                      { value: "admin", label: "Admin" },
                      { value: "user", label: "User" },
                    ]}
                  />
                  {String(values.userType || "").toLowerCase() === "seller" ? (
                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(values.referralsEnabled)}
                            onChange={(event) =>
                              setFieldValue(
                                "referralsEnabled",
                                event.target.checked,
                              )
                            }
                          />
                        }
                        label="Referrals enabled"
                      />
                      {values.referralsEnabled && editUser?.referralCode ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Code: {editUser.referralCode}
                        </Typography>
                      ) : null}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Lets this lister share referral links and view people
                        they referred.
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
                {submitCount > 0 && !isValid ? (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ display: "block", mt: 1.5 }}
                  >
                    Please fix the highlighted fields before continuing.
                  </Typography>
                ) : null}
              </DialogContent>
              <DialogActions
                sx={{
                  p: 2,
                  pt: 1,
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                }}
              >
                <Button
                  type="button"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSubmitting || updateUserMutation.isPending}
                  sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || updateUserMutation.isPending}
                  sx={{
                    borderRadius: 2,
                    width: { xs: "100%", sm: "auto" },
                    backgroundImage: gradientPrimary,
                    color: "#fff",
                  }}
                >
                  {isSubmitting || updateUserMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Delete User Dialog */}
      {/* Password confirmation for role change */}
      <AdminPasswordDialog
        open={editAdminPasswordOpen}
        title="Change User Role"
        description={`Enter your admin password to change this user's role to "${ADD_USER_LABELS[pendingEditPayload?.payload?.userType] || pendingEditPayload?.payload?.userType}". This affects their access across the platform.`}
        confirmText="Confirm Role Change"
        loading={updateUserMutation.isPending}
        error={editAdminPasswordError}
        onClose={() => {
          setEditAdminPasswordOpen(false);
          setEditAdminPasswordError("");
          setPendingEditPayload(null);
        }}
        onConfirm={async (adminPassword) => {
          if (!pendingEditPayload) return;
          const { userId, payload, helpers } = pendingEditPayload;
          try {
            await updateUserMutation.mutateAsync({ userId, payload: { ...payload, adminPassword } });
            setEditAdminPasswordOpen(false);
            setEditAdminPasswordError("");
            setPendingEditPayload(null);
            helpers?.resetForm();
          } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Incorrect password";
            setEditAdminPasswordError(msg);
          }
        }}
      />

      <AdminPasswordDialog
        open={deleteDialogOpen}
        title="Delete User"
        description={`Enter your admin password to permanently delete ${
          [deleteUser?.firstName, deleteUser?.lastName].filter(Boolean).join(" ") ||
          deleteUser?.businessName ||
          "this user"
        }. All their listings, advertisements, and linked data will be archived and removed from the marketplace. This cannot be undone.`}
        confirmText="Delete Permanently"
        loading={deleteUserMutation.isPending}
        error={deleteAdminPasswordError}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteUser(null);
          setDeleteAdminPasswordError("");
        }}
        onConfirm={(adminPassword) => {
          const userId =
            deleteUser?.id ||
            deleteUser?.userId ||
            deleteUser?._id ||
            deleteUser?.user_id;
          if (!userId) {
            showSnackbar("Cannot identify user — please try again", "error");
            return;
          }
          deleteUserMutation.mutate({ userId, adminPassword });
        }}
      />

      {/* Add User Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => !createUserMutation.isPending && setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAddIcon sx={{ color: "#667eea" }} />
            <Typography fontWeight={600}>Add {addUserLabel}</Typography>
          </Stack>
        </DialogTitle>
        <Formik
          initialValues={{
            title: "",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            referralsEnabled: false,
          }}
          validationSchema={createUserValidationSchema}
          validateOnBlur
          validateOnChange
          onSubmit={handleCreateUser}
          enableReinitialize
        >
          {({ isSubmitting, isValid, submitCount, values, setFieldValue }) => (
            <Form noValidate>
              <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                  A temporary password will be generated and emailed to the
                  new {addUserLabel.toLowerCase()} with their login details.
                </DialogContentText>
                <Stack spacing={2}>
                  <SelectFieldWrapper
                    name="title"
                    label="Title"
                    options={TITLE_OPTIONS}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextFieldWrapper
                      name="firstName"
                      label="First name"
                      sanitize={sanitizeNameInput}
                      blockDigits
                      inputMode="text"
                      autoComplete="given-name"
                    />
                    <TextFieldWrapper
                      name="lastName"
                      label="Last name"
                      sanitize={sanitizeNameInput}
                      blockDigits
                      inputMode="text"
                      autoComplete="family-name"
                    />
                  </Stack>
                  <TextFieldWrapper
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                  />
                  <TextFieldWrapper
                    name="phone"
                    label="Cellphone (optional)"
                    sanitize={sanitizePhoneInput}
                    allowOnlyPattern={/[\d+]/}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0821234567"
                  />
                  {activeUserType === "seller" ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(values.referralsEnabled)}
                          onChange={(event) =>
                            setFieldValue(
                              "referralsEnabled",
                              event.target.checked,
                            )
                          }
                        />
                      }
                      label="Enable referral powers"
                    />
                  ) : null}
                </Stack>
                {submitCount > 0 && !isValid ? (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ display: "block", mt: 1.5 }}
                  >
                    Please fix the highlighted fields before continuing.
                  </Typography>
                ) : null}
              </DialogContent>
              <DialogActions
                sx={{
                  p: 2,
                  pt: 1,
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                }}
              >
                <Button
                  type="button"
                  onClick={() => setAddDialogOpen(false)}
                  disabled={isSubmitting || createUserMutation.isPending}
                  sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || createUserMutation.isPending}
                  sx={{
                    borderRadius: 2,
                    width: { xs: "100%", sm: "auto" },
                    backgroundImage: gradientPrimary,
                    color: "#fff",
                  }}
                >
                  {isSubmitting || createUserMutation.isPending
                    ? "Creating..."
                    : `Create ${addUserLabel}`}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* View User Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor:
                  viewUser?.entityType === "Seller"
                    ? "#9c27b0"
                    : viewUser?.entityType === "User"
                      ? "#00bcd4"
                      : viewUser?.entityType === "Referral partner"
                        ? "#ff7043"
                        : "#667eea",
                fontSize: 14,
              }}
            >
              {viewUser?.firstName?.charAt(0)}
              {viewUser?.lastName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography fontWeight={600}>
                {[viewUser?.title, viewUser?.firstName, viewUser?.lastName]
                  .filter(Boolean)
                  .join(" ") || "User details"}
              </Typography>
              <Typography fontSize={13} color="text.secondary">
                {viewUser?.entityType || "User"} details
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <DetailRow label="Email" value={viewUser?.email} />
            <DetailRow
              label="Phone"
              value={
                viewUser?.phone && viewUser.phone !== "-"
                  ? viewUser.phone
                  : "—"
              }
            />
            <DetailRow
              label="Status"
              value={
                <Chip
                  size="small"
                  color={
                    viewUser?.status === "active" ? "success" : "default"
                  }
                  label={viewUser?.status || "—"}
                  sx={{ fontWeight: 600 }}
                />
              }
            />
            {viewUser?.role && (
              <DetailRow label="Role" value={viewUser.role} />
            )}
            {viewUser?.entityType === "Seller" && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <DetailRow
                  label="Business"
                  value={viewUser?.businessName || "—"}
                />
                <DetailRow
                  label="Business email"
                  value={viewUser?.businessEmail || "—"}
                />
                <DetailRow
                  label="Verified"
                  value={viewUser?.verified ? "Yes" : "No"}
                />
                <DetailRow
                  label="Listings"
                  value={String(viewUser?.listings ?? 0)}
                />
              </>
            )}
            {viewUser?.entityType === "User" && (
              <DetailRow
                label="Orders"
                value={String(viewUser?.orders ?? 0)}
              />
            )}
            {viewUser?.entityType === "Referral partner" && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <DetailRow
                  label="Referral code"
                  value={viewUser?.referralCode || "—"}
                />
                <DetailRow
                  label="Referrals"
                  value={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize={14}>
                        {String(viewUser?.referralsCount ?? 0)}
                      </Typography>
                      {(viewUser?.referralsCount ?? 0) > 0 ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setViewDialogOpen(false);
                            handleViewReferrals(viewUser);
                          }}
                          sx={{ borderRadius: 2, textTransform: "none" }}
                        >
                          View people
                        </Button>
                      ) : null}
                    </Stack>
                  }
                />
                {(() => {
                  const links =
                    viewUser?.ambassadorLinks ||
                    viewUser?.referralLinks ||
                    buildReferralShareLinks(viewUser?.referralCode);
                  if (!links) return null;
                  return (
                    <Box sx={{ width: "100%" }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ mb: 1 }}
                        flexWrap="wrap"
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          onClick={() =>
                            copyText(
                              links.shopper || links.shopperLink,
                              "Shopper referral link",
                            )
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          Copy shopper link
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          onClick={() =>
                            copyText(
                              links.lister || links.listerLink,
                              "Lister referral link",
                            )
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          Copy lister link
                        </Button>
                      </Stack>
                      <ReferralQrCodes
                        shopperUrl={links.shopper || links.shopperLink}
                        listerUrl={links.lister || links.listerLink}
                        size={112}
                      />
                    </Box>
                  );
                })()}
              </>
            )}
            {viewUser?.entityType === "Seller" && viewUser?.referralCode ? (
              <>
                <DetailRow
                  label="Referral code"
                  value={viewUser.referralCode}
                />
                {(() => {
                  const links = buildReferralShareLinks(viewUser.referralCode);
                  if (!links) return null;
                  return (
                    <Box sx={{ width: "100%" }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ mb: 1 }}
                        flexWrap="wrap"
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          onClick={() =>
                            copyText(links.shopper, "Shopper referral link")
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          Copy shopper link
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          onClick={() =>
                            copyText(links.lister, "Lister referral link")
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          Copy lister link
                        </Button>
                      </Stack>
                      <ReferralQrCodes
                        shopperUrl={links.shopper}
                        listerUrl={links.lister}
                        size={112}
                      />
                    </Box>
                  );
                })()}
              </>
            ) : null}
            {!isReferralViewer &&
            (viewUser?.entityType === "Seller" ||
              viewUser?.entityType === "User") ? (
              <DetailRow
                label="Registered by"
                value={
                  viewUser?.registeredBy?.name ||
                  viewUser?.registeredBy?.email ||
                  "—"
                }
              />
            ) : null}
            <Divider sx={{ my: 0.5 }} />
            <DetailRow
              label="Joined"
              value={formatDate(viewUser?.dateCreated)}
            />
            <DetailRow
              label="Last updated"
              value={formatDate(viewUser?.dateUpdated)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setViewDialogOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              backgroundImage: gradientPrimary,
              color: "#fff",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Referred people dialog */}
      <Dialog
        open={Boolean(referralsAmbassador)}
        onClose={() => setReferralsAmbassador(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack spacing={0.5}>
            <Typography fontWeight={700}>
              Referred by{" "}
              {[
                referralsAmbassador?.firstName,
                referralsAmbassador?.lastName,
              ]
                .filter(Boolean)
                .join(" ") || "ambassador"}
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              {referralsAmbassador?.referralCode
                ? `Code ${referralsAmbassador.referralCode} · `
                : ""}
              {referralsList.length}{" "}
              {referralsList.length === 1 ? "person" : "people"}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {referralsList.length === 0 ? (
            <Typography color="text.secondary" fontSize={14}>
              No referred users yet.
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {referralsList.map((person) => (
                <Paper
                  key={`${person.referralKind}-${person.id || person.userId}`}
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2 }}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack
                      direction="row"
                      spacing={1.25}
                      alignItems="center"
                      sx={{ minWidth: 0, flex: 1 }}
                    >
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor:
                            person.referralKind === "Lister"
                              ? "#9c27b0"
                              : "#00bcd4",
                          fontSize: 13,
                        }}
                      >
                        {person.firstName?.charAt(0)}
                        {person.lastName?.charAt(0)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={600} fontSize={14} noWrap>
                          {person.businessName ||
                            `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
                            "User"}
                        </Typography>
                        <Typography
                          fontSize={12}
                          color="text.secondary"
                          noWrap
                        >
                          {person.email}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Chip
                        size="small"
                        label={person.referralKind}
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        size="small"
                        color={
                          person.status === "active" ? "success" : "default"
                        }
                        label={person.status || "—"}
                        sx={{ fontWeight: 600 }}
                      />
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setReferralsAmbassador(null);
                          handleView(
                            person,
                            person.referralKind === "Lister"
                              ? "Seller"
                              : "User",
                          );
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setReferralsAmbassador(null)}
            variant="contained"
            sx={{
              borderRadius: 2,
              backgroundImage: gradientPrimary,
              color: "#fff",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 0.25, sm: 2 }}
      alignItems={{ xs: "flex-start", sm: "center" }}
    >
      <Typography
        fontSize={13}
        color="text.secondary"
        sx={{ minWidth: 120, fontWeight: 600 }}
      >
        {label}
      </Typography>
      {typeof value === "string" || typeof value === "number" ? (
        <Typography fontSize={14}>{value}</Typography>
      ) : (
        value
      )}
    </Stack>
  );
}
