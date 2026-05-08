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
  Avatar,
  Grid,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentsIcon from "@mui/icons-material/Payments";
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
    date: "2025-01-25",
  },
  {
    id: 2,
    ref: "TXN-2025-002",
    buyer: "Bob Williams",
    seller: "Green Electronics",
    amount: 599.0,
    method: "Capitec Pay",
    status: "pending",
    date: "2025-01-24",
  },
  {
    id: 3,
    ref: "TXN-2025-003",
    buyer: "Carol Lee",
    seller: "Tech Hub SA",
    amount: 2349.0,
    method: "EFT",
    status: "completed",
    date: "2025-01-23",
  },
  {
    id: 4,
    ref: "TXN-2025-004",
    buyer: "Daniel Garcia",
    seller: "Fashion Forward",
    amount: 450.0,
    method: "Card",
    status: "failed",
    date: "2025-01-22",
  },
  {
    id: 5,
    ref: "TXN-2025-005",
    buyer: "Emma Davis",
    seller: "Bright Auto Parts",
    amount: 875.5,
    method: "Capitec Pay",
    status: "refunded",
    date: "2025-01-21",
  },
  {
    id: 6,
    ref: "TXN-2025-006",
    buyer: "Frank Miller",
    seller: "Green Electronics",
    amount: 1599.0,
    method: "Card",
    status: "completed",
    date: "2025-01-20",
  },
];

export default function Transactions() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchQuery, setSearchQuery] = useState("");

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    return dummyTransactions.filter(
      (txn) =>
        txn.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.seller.toLowerCase().includes(searchQuery.toLowerCase()),
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
        day: "numeric",
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
        ),
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
        ),
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
        ),
      },
      {
        field: "amount",
        headerName: "Amount",
        width: 140,
        renderCell: (params) => (
          <Typography fontSize={13} fontWeight={700} color="text.primary">
            {formatCurrency(params.value)}
          </Typography>
        ),
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
              "& .MuiChip-icon": { color: "#667eea" },
            }}
          />
        ),
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
            refunded: "info",
          };
          return (
            <Chip
              color={colorMap[params.value] || "default"}
              label={params.value}
              size="small"
              sx={{ fontWeight: 600, textTransform: "capitalize" }}
            />
          );
        },
      },
      {
        field: "date",
        headerName: "Date",
        width: 130,
        renderCell: (params) => (
          <Typography fontSize={13} color="text.secondary">
            {formatDate(params.value)}
          </Typography>
        ),
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
        ),
      },
    ],
    [],
  );

  const transactionCards = [
    {
      label: "Total Transactions",
      value: filteredTransactions.length.toLocaleString("en-ZA"),
      sub: "Records in current view",
      accent: "primary.main",
    },
    {
      label: "Completed Value",
      value: formatCurrency(totals.completed),
      sub: "Successfully completed transactions",
      accent: "success.main",
    },
    {
      label: "Pending Value",
      value: formatCurrency(totals.pending),
      sub: "Transactions awaiting completion",
      accent: "warning.main",
    },
    {
      label: "Refunded Value",
      value: formatCurrency(totals.refunded),
      sub: "Returned payments",
      accent: "secondary.main",
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        py: { xs: 2, md: 3 },
        px: { xs: 1.5, sm: 2, md: 3 },
      }}
    >
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

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.2 }}>
          Transaction Overview
        </Typography>
        <Grid container spacing={1.5}>
          {transactionCards.map((card) => (
            <Grid key={card.label} size={{ xs: 6, sm: 6, md: 3 }}>
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

      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 3 }}
            alignItems={{ xs: "stretch", sm: "center" }}
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
                sx: { borderRadius: 2, bgcolor: alpha("#667eea", 0.04) },
              }}
            />
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: 2, minWidth: { xs: "100%", sm: 120 } }}
            >
              Export
            </Button>
          </Stack>

          {isMobile ? (
            <Stack spacing={1.25}>
              {filteredTransactions.map((txn) => {
                const statusColor =
                  txn.status === "completed"
                    ? "success"
                    : txn.status === "pending"
                      ? "warning"
                      : txn.status === "failed"
                        ? "error"
                        : "info";

                return (
                  <Paper
                    key={txn.id}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2 }}
                  >
                    <Stack spacing={1.1}>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <ReceiptLongIcon
                          sx={{ fontSize: 18, color: "#667eea" }}
                        />
                        <Typography fontSize={13} fontWeight={700} noWrap>
                          {txn.ref}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Typography fontSize={13} fontWeight={700}>
                          {formatCurrency(txn.amount)}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar
                          sx={{
                            width: 26,
                            height: 26,
                            bgcolor: "#00bcd4",
                            fontSize: 11,
                          }}
                        >
                          {txn.buyer
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontSize={12} noWrap>
                            Buyer: {txn.buyer}
                          </Typography>
                          <Typography
                            fontSize={12}
                            color="text.secondary"
                            noWrap
                          >
                            Seller: {txn.seller}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ flexWrap: "wrap", rowGap: 0.75 }}
                      >
                        <Chip
                          icon={getMethodIcon(txn.method)}
                          label={txn.method}
                          size="small"
                          sx={{
                            bgcolor: alpha("#667eea", 0.1),
                            color: "#667eea",
                            fontWeight: 600,
                            "& .MuiChip-icon": { color: "#667eea" },
                          }}
                        />
                        <Chip
                          color={statusColor}
                          label={txn.status}
                          size="small"
                          sx={{ fontWeight: 600, textTransform: "capitalize" }}
                        />
                        <Chip
                          size="small"
                          label={formatDate(txn.date)}
                          variant="outlined"
                        />
                      </Stack>

                      <Stack direction="row" justifyContent="flex-end">
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}

              {filteredTransactions.length === 0 && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography color="text.secondary" fontSize={13}>
                    No transactions found.
                  </Typography>
                </Paper>
              )}
            </Stack>
          ) : (
            <MetricsDataGrid
              rows={filteredTransactions}
              columns={columns}
              autoHeight
              pageSize={10}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
}
