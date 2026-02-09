/* eslint-disable no-unused-vars */
import React, { useState, useMemo } from "react";
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
  Avatar
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingIcon from "@mui/icons-material/Pending";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";
import { gradientPrimary } from "../theme/theme";

// Dummy seller data
const dummySellers = [
  {
    id: 1,
    businessName: "Bright Auto Parts",
    email: "auto@bright.co.za",
    reg: "2023/123456/07",
    verified: true,
    status: "active",
    joinDate: "2024-06-15",
    totalSales: 156
  },
  {
    id: 2,
    businessName: "Green Farms SA",
    email: "info@greenfarms.co.za",
    reg: "2022/987654/07",
    verified: false,
    status: "pending",
    joinDate: "2025-01-10",
    totalSales: 0
  },
  {
    id: 3,
    businessName: "Tech Hub Africa",
    email: "hello@techhub.africa",
    reg: "K2021/111222/07",
    verified: true,
    status: "active",
    joinDate: "2023-11-20",
    totalSales: 432
  },
  {
    id: 4,
    businessName: "Fashion Forward",
    email: "sales@fashionforward.co.za",
    reg: "2024/555666/07",
    verified: true,
    status: "active",
    joinDate: "2024-03-08",
    totalSales: 89
  },
  {
    id: 5,
    businessName: "Home Essentials",
    email: "contact@homeessentials.co.za",
    reg: "2023/777888/07",
    verified: false,
    status: "suspended",
    joinDate: "2024-01-25",
    totalSales: 12
  },
  {
    id: 6,
    businessName: "Gadget Zone",
    email: "support@gadgetzone.co.za",
    reg: "2024/999000/07",
    verified: true,
    status: "active",
    joinDate: "2024-09-12",
    totalSales: 267
  }
];

export default function Sellers() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter sellers based on search
  const filteredSellers = useMemo(() => {
    return dummySellers.filter(
      (seller) =>
        seller.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.reg.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredSellers.length;
    const active = filteredSellers.filter((s) => s.status === "active").length;
    const pending = filteredSellers.filter((s) => s.status === "pending").length;
    const verified = filteredSellers.filter((s) => s.verified).length;
    return { total, active, pending, verified };
  }, [filteredSellers]);

  const formatDate = (dateString) => {
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
  };

  const columns = useMemo(
    () => [
      {
        field: "businessName",
        headerName: "Business",
        flex: 1,
        minWidth: 200,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: alpha("#667eea", 0.1),
                color: "#667eea",
                fontSize: 14,
                fontWeight: 600
              }}
            >
              {params.value?.charAt(0)}
            </Avatar>
            <Box>
              <Typography fontSize={13} fontWeight={600}>
                {params.value}
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                {params.row.totalSales} sales
              </Typography>
            </Box>
          </Stack>
        )
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1}>
            <EmailIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography fontSize={13} color="text.secondary">
              {params.value}
            </Typography>
          </Stack>
        )
      },
      {
        field: "reg",
        headerName: "Registration #",
        width: 160,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1}>
            <BadgeIcon sx={{ fontSize: 16, color: "#9c27b0" }} />
            <Typography fontSize={13} fontWeight={500}>
              {params.value}
            </Typography>
          </Stack>
        )
      },
      {
        field: "verified",
        headerName: "Verified",
        width: 120,
        renderCell: (params) => (
          <Chip
            icon={
              params.value ? (
                <VerifiedIcon sx={{ fontSize: 16 }} />
              ) : (
                <PendingIcon sx={{ fontSize: 16 }} />
              )
            }
            size="small"
            label={params.value ? "Verified" : "Unverified"}
            sx={{
              bgcolor: params.value
                ? alpha("#4caf50", 0.1)
                : alpha("#ff9800", 0.1),
              color: params.value ? "#4caf50" : "#ff9800",
              fontWeight: 600,
              "& .MuiChip-icon": {
                color: params.value ? "#4caf50" : "#ff9800"
              }
            }}
          />
        )
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        renderCell: (params) => {
          const colorMap = {
            active: { bg: "#4caf50", label: "Active" },
            pending: { bg: "#ff9800", label: "Pending" },
            suspended: { bg: "#f44336", label: "Suspended" }
          };
          const config = colorMap[params.value] || colorMap.pending;
          return (
            <Chip
              size="small"
              label={config.label}
              sx={{
                bgcolor: alpha(config.bg, 0.1),
                color: config.bg,
                fontWeight: 600,
                textTransform: "capitalize"
              }}
            />
          );
        }
      },
      {
        field: "joinDate",
        headerName: "Joined",
        width: 130,
        renderCell: (params) => (
          <Typography fontSize={13} color="text.secondary">
            {formatDate(params.value)}
          </Typography>
        )
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 160,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="View Profile">
              <IconButton
                size="small"
                sx={{
                  bgcolor: alpha("#667eea", 0.1),
                  "&:hover": { bgcolor: alpha("#667eea", 0.2) }
                }}
              >
                <VisibilityIcon sx={{ fontSize: 18, color: "#667eea" }} />
              </IconButton>
            </Tooltip>
            {!params.row.verified && (
              <Tooltip title="Verify Seller">
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: alpha("#4caf50", 0.1),
                    "&:hover": { bgcolor: alpha("#4caf50", 0.2) }
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 18, color: "#4caf50" }} />
                </IconButton>
              </Tooltip>
            )}
            {params.row.status !== "suspended" && (
              <Tooltip title="Suspend Seller">
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: alpha("#f44336", 0.1),
                    "&:hover": { bgcolor: alpha("#f44336", 0.2) }
                  }}
                >
                  <BlockIcon sx={{ fontSize: 18, color: "#f44336" }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )
      }
    ],
    []
  );

  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Sellers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and verify platform sellers
          </Typography>
        </Box>
      </Stack>

      {/* Stats Cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            flex: 1,
            borderRadius: 3,
            border: `1px solid ${alpha("#667eea", 0.2)}`,
            background: `linear-gradient(135deg, ${alpha("#667eea", 0.05)} 0%, ${alpha("#764ba2", 0.05)} 100%)`
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: gradientPrimary
              }}
            >
              <StorefrontIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Sellers
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            flex: 1,
            borderRadius: 3,
            border: `1px solid ${alpha("#4caf50", 0.2)}`,
            background: `linear-gradient(135deg, ${alpha("#4caf50", 0.05)} 0%, ${alpha("#81c784", 0.05)} 100%)`
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "#4caf50"
              }}
            >
              <TrendingUpIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Sellers
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            flex: 1,
            borderRadius: 3,
            border: `1px solid ${alpha("#ff9800", 0.2)}`,
            background: `linear-gradient(135deg, ${alpha("#ff9800", 0.05)} 0%, ${alpha("#ffb74d", 0.05)} 100%)`
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "#ff9800"
              }}
            >
              <PendingIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Approval
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            flex: 1,
            borderRadius: 3,
            border: `1px solid ${alpha("#2196f3", 0.2)}`,
            background: `linear-gradient(135deg, ${alpha("#2196f3", 0.05)} 0%, ${alpha("#64b5f6", 0.05)} 100%)`
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "#2196f3"
              }}
            >
              <VerifiedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {stats.verified}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verified Sellers
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      {/* Search and Actions */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <TextField
          placeholder="Search by business, email, or registration..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: { xs: "100%", sm: 350 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "background.paper"
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            background: gradientPrimary,
            fontWeight: 600,
            "&:hover": {
              background: gradientPrimary,
              filter: "brightness(1.05)"
            }
          }}
        >
          Add Seller
        </Button>
      </Stack>

      {/* Data Grid */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha("#000", 0.08)}`,
          overflow: "hidden"
        }}
      >
        <MetricsDataGrid
          rows={filteredSellers}
          columns={columns}
          autoHeight
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25]}
          disableSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: alpha("#667eea", 0.03),
              borderBottom: `1px solid ${alpha("#000", 0.08)}`
            },
            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${alpha("#000", 0.05)}`
            },
            "& .MuiDataGrid-row:hover": {
              bgcolor: alpha("#667eea", 0.02)
            }
          }}
        />
      </Paper>
    </Box>
  );
}
