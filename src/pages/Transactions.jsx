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
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentsIcon from "@mui/icons-material/Payments";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";
import { gradientPrimary } from "../theme/theme";

// Dummy transaction data
const dummyTransactions = [
  {
    id: 1,
    ref: "TXN-2025-001",
    buyer: "Alice Johnson",
    seller: "Bright Auto Parts",
    amount: 1249.99,
    method: "Card",
    status: "completed",
    date: "2025-01-25"
  },
  {
    id: 2,
    ref: "TXN-2025-002",
    buyer: "Bob Williams",
    seller: "Green Electronics",
    amount: 599.0,
    method: "Capitec Pay",
    status: "pending",
    date: "2025-01-24"
  },
  {
    id: 3,
    ref: "TXN-2025-003",
    buyer: "Carol Lee",
    seller: "Tech Hub SA",
    amount: 2349.0,
    method: "EFT",
    status: "completed",
    date: "2025-01-23"
  },
  {
    id: 4,
    ref: "TXN-2025-004",
    buyer: "Daniel Garcia",
    seller: "Fashion Forward",
    amount: 450.0,
    method: "Card",
    status: "failed",
    date: "2025-01-22"
  },
  {
    id: 5,
    ref: "TXN-2025-005",
    buyer: "Emma Davis",
    seller: "Bright Auto Parts",
    amount: 875.5,
    method: "Capitec Pay",
    status: "refunded",
    date: "2025-01-21"
  },
  {
    id: 6,
    ref: "TXN-2025-006",
    buyer: "Frank Miller",
    seller: "Green Electronics",
    amount: 1599.0,
    method: "Card",
    status: "completed",
    date: "2025-01-20"
  }
];

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    return dummyTransactions.filter(
      (txn) =>
        txn.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.seller.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    const completed = filteredTransactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);
    const pending = filteredTransactions
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + t.amount, 0);
    const failed = filteredTransactions
      .filter((t) => t.status === "failed")
      .reduce((sum, t) => sum + t.amount, 0);
    const refunded = filteredTransactions
      .filter((t) => t.status === "refunded")
      .reduce((sum, t) => sum + t.amount, 0);
    return { completed, pending, failed, refunded, total: completed + pending };
  }, [filteredTransactions]);

  const formatCurrency = (value) => {
    const n = Number(value);
    return `R ${Number.isFinite(n) ? n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}`;
  };

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

  const getMethodIcon = (method) => {
    switch (method) {
      case "Card":
        return <CreditCardIcon sx={{ fontSize: 16 }} />;
      case "EFT":
        return <AccountBalanceIcon sx={{ fontSize: 16 }} />;
      default:
        return <PaymentsIcon sx={{ fontSize: 16 }} />;
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "ref",
        headerName: "Reference",
        width: 150,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1}>
            <ReceiptLongIcon sx={{ fontSize: 18, color: "#667eea" }} />
            <Typography fontSize={13} fontWeight={600}>
              {params.value}
            </Typography>
          </Stack>
        )
      },
      {
        field: "buyer",
        headerName: "Buyer",
        flex: 1,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{ width: 28, height: 28, bgcolor: "#00bcd4", fontSize: 12 }}
            >
              {params.value
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </Avatar>
            <Typography fontSize={13}>{params.value}</Typography>
          </Stack>
        )
      },
      {
        field: "seller",
        headerName: "Seller",
        flex: 1,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{ width: 28, height: 28, bgcolor: "#9c27b0", fontSize: 12 }}
            >
              {params.value?.charAt(0)}
            </Avatar>
            <Typography fontSize={13}>{params.value}</Typography>
          </Stack>
        )
      },
      {
        field: "amount",
        headerName: "Amount",
        width: 140,
        renderCell: (params) => (
          <Typography fontSize={13} fontWeight={700} color="text.primary">
            {formatCurrency(params.value)}
          </Typography>
        )
      },
      {
        field: "method",
        headerName: "Method",
        width: 140,
        renderCell: (params) => (
          <Chip
            icon={getMethodIcon(params.value)}
            label={params.value}
            size="small"
            sx={{
              bgcolor: alpha("#667eea", 0.1),
              color: "#667eea",
              fontWeight: 600,
              "& .MuiChip-icon": { color: "#667eea" }
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
            completed: "success",
            pending: "warning",
            failed: "error",
            refunded: "info"
          };
          return (
            <Chip
              color={colorMap[params.value] || "default"}
              label={params.value}
              size="small"
              sx={{ fontWeight: 600, textTransform: "capitalize" }}
            />
          );
        }
      },
      {
        field: "date",
        headerName: "Date",
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
        width: 100,
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="View Details">
            <IconButton size="small" color="primary">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
            Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage all platform transactions
          </Typography>
        </Box>
      </Stack>

      {/* Stats Cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 2,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            bgcolor: alpha("#4caf50", 0.04)
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                Completed
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#4caf50">
                {formatCurrency(totals.completed)}
              </Typography>
            </Box>
            <TrendingUpIcon sx={{ fontSize: 32, color: "#4caf50" }} />
          </Stack>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 2,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            bgcolor: alpha("#ff9800", 0.04)
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                Pending
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#ff9800">
                {formatCurrency(totals.pending)}
              </Typography>
            </Box>
            <PaymentsIcon sx={{ fontSize: 32, color: "#ff9800" }} />
          </Stack>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 2,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            bgcolor: alpha("#f44336", 0.04)
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                Failed
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#f44336">
                {formatCurrency(totals.failed)}
              </Typography>
            </Box>
            <TrendingDownIcon sx={{ fontSize: 32, color: "#f44336" }} />
          </Stack>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 2,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            bgcolor: alpha("#2196f3", 0.04)
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                Refunded
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#2196f3">
                {formatCurrency(totals.refunded)}
              </Typography>
            </Box>
            <ReceiptLongIcon sx={{ fontSize: 32, color: "#2196f3" }} />
          </Stack>
        </Paper>
      </Stack>

      {/* Data Table */}
      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}
      >
        <Box sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 3 }}
            alignItems="center"
          >
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference, buyer or seller..."
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
              sx={{ borderRadius: 2, minWidth: 120 }}
            >
              Export
            </Button>
          </Stack>
          <MetricsDataGrid
            rows={filteredTransactions}
            columns={columns}
            autoHeight
            pageSize={10}
          />
        </Box>
      </Paper>
    </Box>
  );
}
