/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
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
  Tabs
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PeopleIcon from "@mui/icons-material/People";
import VerifiedIcon from "@mui/icons-material/Verified";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";
import { gradientPrimary } from "../theme/theme";

// Dummy data for Admins
const dummyAdmins = [
  {
    id: 1,
    firstName: "Themba",
    lastName: "Makamu",
    email: "themba@easyplug.co.za",
    role: "Super Admin",
    status: "active",
    dateCreated: "2024-01-15",
    dateUpdated: "2025-01-20"
  },
  {
    id: 2,
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah@easyplug.co.za",
    role: "Admin",
    status: "active",
    dateCreated: "2024-03-10",
    dateUpdated: "2025-01-18"
  },
  {
    id: 3,
    firstName: "Michael",
    lastName: "Peters",
    email: "michael@easyplug.co.za",
    role: "Admin",
    status: "inactive",
    dateCreated: "2024-06-20",
    dateUpdated: "2024-12-01"
  }
];

// Dummy data for Sellers
const dummySellers = [
  {
    id: 1,
    businessName: "Bright Auto Parts",
    firstName: "John",
    lastName: "Mensah",
    email: "john@brightauto.co.za",
    verified: true,
    status: "active",
    listings: 45,
    dateCreated: "2024-02-10"
  },
  {
    id: 2,
    businessName: "Green Electronics",
    firstName: "Emma",
    lastName: "Davis",
    email: "emma@greenelec.co.za",
    verified: true,
    status: "active",
    listings: 32,
    dateCreated: "2024-04-15"
  },
  {
    id: 3,
    businessName: "Tech Hub SA",
    firstName: "David",
    lastName: "Brown",
    email: "david@techhub.co.za",
    verified: false,
    status: "pending",
    listings: 12,
    dateCreated: "2024-08-20"
  },
  {
    id: 4,
    businessName: "Fashion Forward",
    firstName: "Lisa",
    lastName: "Smith",
    email: "lisa@fashionforward.co.za",
    verified: true,
    status: "suspended",
    listings: 8,
    dateCreated: "2024-05-05"
  }
];

// Dummy data for Users (Buyers)
const dummyUsers = [
  {
    id: 1,
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@gmail.com",
    phone: "+27 82 123 4567",
    status: "active",
    orders: 15,
    dateCreated: "2024-01-20"
  },
  {
    id: 2,
    firstName: "Bob",
    lastName: "Williams",
    email: "bob@outlook.com",
    phone: "+27 83 234 5678",
    status: "active",
    orders: 8,
    dateCreated: "2024-03-12"
  },
  {
    id: 3,
    firstName: "Carol",
    lastName: "Lee",
    email: "carol@yahoo.com",
    phone: "+27 84 345 6789",
    status: "inactive",
    orders: 3,
    dateCreated: "2024-06-18"
  },
  {
    id: 4,
    firstName: "Daniel",
    lastName: "Garcia",
    email: "daniel@gmail.com",
    phone: "+27 85 456 7890",
    status: "active",
    orders: 22,
    dateCreated: "2024-02-28"
  }
];

export default function UserManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeTab, setActiveTab] = useState(0);
  const [adminQuery, setAdminQuery] = useState("");
  const [sellerQuery, setSellerQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");

  // Dialog states
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Filter data based on search queries
  const filteredAdmins = useMemo(() => {
    return dummyAdmins.filter(
      (admin) =>
        admin.firstName.toLowerCase().includes(adminQuery.toLowerCase()) ||
        admin.lastName.toLowerCase().includes(adminQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(adminQuery.toLowerCase())
    );
  }, [adminQuery]);

  const filteredSellers = useMemo(() => {
    return dummySellers.filter(
      (seller) =>
        seller.businessName.toLowerCase().includes(sellerQuery.toLowerCase()) ||
        seller.firstName.toLowerCase().includes(sellerQuery.toLowerCase()) ||
        seller.lastName.toLowerCase().includes(sellerQuery.toLowerCase()) ||
        seller.email.toLowerCase().includes(sellerQuery.toLowerCase())
    );
  }, [sellerQuery]);

  const filteredUsers = useMemo(() => {
    return dummyUsers.filter(
      (user) =>
        user.firstName.toLowerCase().includes(userQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(userQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userQuery.toLowerCase())
    );
  }, [userQuery]);

  // Action handlers
  const handleToggleStatus = useCallback((user, entityType) => {
    setSelectedUser({ ...user, entityType });
    setDeactivateDialogOpen(true);
  }, []);

  const handleConfirmToggle = useCallback(() => {
    if (selectedUser) {
      const action =
        selectedUser.status === "active" ? "deactivated" : "activated";
      showSnackbar(
        `${selectedUser.firstName} ${selectedUser.lastName} has been ${action}`,
        "success"
      );
    }
    setDeactivateDialogOpen(false);
    setSelectedUser(null);
  }, [selectedUser, showSnackbar]);

  const handleView = useCallback((user) => {
    showSnackbar(
      `Viewing ${user.firstName} ${user.lastName}'s profile`,
      "info"
    );
  }, [showSnackbar]);

  const handleEdit = useCallback((user) => {
    showSnackbar(`Editing ${user.firstName} ${user.lastName}`, "info");
  }, [showSnackbar]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric"
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
        flex: 1,
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
        )
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
              fontWeight: 600
            }}
          />
        )
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
        )
      },
      {
        field: "dateCreated",
        headerName: "Date Created",
        width: 130,
        renderCell: (params) => formatDate(params.value)
      },
      {
        field: "dateUpdated",
        headerName: "Last Updated",
        width: 130,
        renderCell: (params) => formatDate(params.value)
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 140,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="primary"
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
                onClick={() => handleToggleStatus(params.row, "Admin")}
              >
                {params.row.status === "active" ? (
                  <BlockIcon fontSize="small" />
                ) : (
                  <CheckCircleIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ],
    [formatDate, handleEdit, handleToggleStatus]
  );

  // Seller columns
  const sellerColumns = useMemo(
    () => [
      {
        field: "businessName",
        headerName: "Business",
        flex: 1.2,
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
        )
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
        )
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
              fontWeight: 700
            }}
          />
        )
      },
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
        }
      },
      {
        field: "dateCreated",
        headerName: "Joined",
        width: 120,
        renderCell: (params) => formatDate(params.value)
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
                onClick={() => handleView(params.row)}
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
              title={params.row.status === "active" ? "Suspend" : "Activate"}
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
          </Stack>
        )
      }
    ],
    [formatDate, handleEdit, handleToggleStatus, handleView]
  );

  // User columns
  const userColumns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
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
        )
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
              fontWeight: 700
            }}
          />
        )
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
        )
      },
      {
        field: "dateCreated",
        headerName: "Joined",
        width: 120,
        renderCell: (params) => formatDate(params.value)
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 140,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleView(params.row)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={params.row.status === "active" ? "Deactivate" : "Activate"}
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
          </Stack>
        )
      }
    ],
    [formatDate, handleToggleStatus, handleView]
  );

  const tabPanelStyle = { mt: 3 };

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage admins, sellers, and users
          </Typography>
        </Box>
      </Stack>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}
      >
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
            "& .MuiTabs-indicator": { bgcolor: "#667eea" }
          }}
        >
          <Tab
            icon={<AdminPanelSettingsIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={`Admins (${filteredAdmins.length})`}
          />
          <Tab
            icon={<StorefrontIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={`Sellers (${filteredSellers.length})`}
          />
          <Tab
            icon={<PeopleIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={`Users (${filteredUsers.length})`}
          />
        </Tabs>

        {/* Admins Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
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
                  sx: { borderRadius: 2, bgcolor: alpha("#667eea", 0.04) }
                }}
              />
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                sx={{
                  backgroundImage: gradientPrimary,
                  color: "#fff",
                  minWidth: { xs: "100%", sm: 160 },
                  whiteSpace: "nowrap",
                  borderRadius: 2,
                  px: 3
                }}
              >
                Add Admin
              </Button>
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
                          sx={{ width: 34, height: 34, bgcolor: "#667eea", fontSize: 13 }}
                        >
                          {admin.firstName?.charAt(0)}
                          {admin.lastName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontWeight={600} fontSize={14} noWrap>
                            {admin.firstName} {admin.lastName}
                          </Typography>
                          <Typography fontSize={12} color="text.secondary" noWrap>
                            {admin.email}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                        <Chip
                          size="small"
                          label={admin.role}
                          sx={{ bgcolor: alpha("#667eea", 0.1), color: "#667eea", fontWeight: 600 }}
                        />
                        <Chip
                          size="small"
                          color={admin.status === "active" ? "success" : "default"}
                          label={admin.status}
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>

                      <Typography fontSize={12} color="text.secondary">
                        Joined: {formatDate(admin.dateCreated)}
                      </Typography>

                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(admin)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color={admin.status === "active" ? "error" : "success"}
                          onClick={() => handleToggleStatus(admin, "Admin")}
                        >
                          {admin.status === "active" ? (
                            <BlockIcon fontSize="small" />
                          ) : (
                            <CheckCircleIcon fontSize="small" />
                          )}
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
              />
            )}
          </Box>
        )}

        {/* Sellers Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 3 }}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                value={sellerQuery}
                onChange={(e) => setSellerQuery(e.target.value)}
                placeholder="Search seller name, business or email..."
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: alpha("#667eea", 0.04) }
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
                  sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
                >
                  Export
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  sx={{
                    backgroundImage: gradientPrimary,
                    color: "#fff",
                    minWidth: { xs: "100%", sm: 160 },
                    whiteSpace: "nowrap",
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Add Seller
                </Button>
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
                          sx={{ width: 34, height: 34, bgcolor: "#9c27b0", fontSize: 13 }}
                        >
                          {seller.businessName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography fontWeight={600} fontSize={14} noWrap>
                              {seller.businessName}
                            </Typography>
                            {seller.verified && (
                              <VerifiedIcon sx={{ fontSize: 14, color: "#667eea" }} />
                            )}
                          </Stack>
                          <Typography fontSize={12} color="text.secondary" noWrap>
                            {seller.firstName} {seller.lastName}
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography fontSize={12} color="text.secondary" noWrap>
                        {seller.email}
                      </Typography>

                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                        <Chip
                          size="small"
                          color={seller.verified ? "success" : "default"}
                          label={seller.verified ? "Verified" : "Unverified"}
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          size="small"
                          label={`${seller.listings} Listings`}
                          sx={{ bgcolor: alpha("#4caf50", 0.1), color: "#4caf50", fontWeight: 700 }}
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

                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton size="small" color="primary" onClick={() => handleView(seller)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="info" onClick={() => handleEdit(seller)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color={seller.status === "active" ? "error" : "success"}
                          onClick={() => handleToggleStatus(seller, "Seller")}
                        >
                          {seller.status === "active" ? (
                            <BlockIcon fontSize="small" />
                          ) : (
                            <CheckCircleIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                {filteredSellers.length === 0 && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography color="text.secondary" fontSize={13}>
                      No sellers found.
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
              />
            )}
          </Box>
        )}

        {/* Users Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
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
                  sx: { borderRadius: 2, bgcolor: alpha("#667eea", 0.04) }
                }}
              />
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
              >
                Export
              </Button>
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
                          sx={{ width: 34, height: 34, bgcolor: "#00bcd4", fontSize: 13 }}
                        >
                          {user.firstName?.charAt(0)}
                          {user.lastName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontWeight={600} fontSize={14} noWrap>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography fontSize={12} color="text.secondary" noWrap>
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography fontSize={12} color="text.secondary" noWrap>
                        {user.phone}
                      </Typography>

                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                        <Chip
                          size="small"
                          label={`${user.orders} Orders`}
                          sx={{ bgcolor: alpha("#ff9800", 0.1), color: "#ff9800", fontWeight: 700 }}
                        />
                        <Chip
                          size="small"
                          color={user.status === "active" ? "success" : "default"}
                          label={user.status}
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>

                      <Typography fontSize={12} color="text.secondary">
                        Joined: {formatDate(user.dateCreated)}
                      </Typography>

                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton size="small" color="primary" onClick={() => handleView(user)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color={user.status === "active" ? "error" : "success"}
                          onClick={() => handleToggleStatus(user, "User")}
                        >
                          {user.status === "active" ? (
                            <BlockIcon fontSize="small" />
                          ) : (
                            <CheckCircleIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                {filteredUsers.length === 0 && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography color="text.secondary" fontSize={13}>
                      No users found.
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
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Deactivate/Activate Dialog */}
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
            {selectedUser?.status === "active" ? "deactivate" : "activate"}{" "}
            <strong>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </strong>
            ?
            {selectedUser?.status === "active" &&
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
            sx={{
              borderRadius: 2,
              width: { xs: "100%", sm: "auto" },
              bgcolor:
                selectedUser?.status === "active" ? "#f44336" : "#4caf50",
              "&:hover": {
                bgcolor:
                  selectedUser?.status === "active" ? "#d32f2f" : "#43a047"
              }
            }}
          >
            {selectedUser?.status === "active" ? "Deactivate" : "Activate"}
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
