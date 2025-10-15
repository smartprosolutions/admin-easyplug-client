import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";

export default function Transactions() {
  const rows = useMemo(
    () => [
      {
        id: 1,
        ref: "INV-001",
        amount: 249.99,
        method: "Card",
        status: "paid",
        date: "2025-09-13"
      },
      {
        id: 2,
        ref: "INV-002",
        amount: 59.0,
        method: "Capitec Pay",
        status: "pending",
        date: "2025-09-14"
      },
      {
        id: 3,
        ref: "INV-003",
        amount: 349.0,
        method: "Card",
        status: "failed",
        date: "2025-09-15"
      }
    ],
    []
  );

  const columns = useMemo(
    () => [
      { field: "ref", headerName: "Reference", width: 140 },
      {
        field: "amount",
        headerName: "Amount",
        width: 120,
        valueFormatter: ({ value }) => {
          const n = Number(value);
          return `R ${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
        }
      },
      { field: "method", headerName: "Method", width: 140 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (params) => {
          const color =
            params.value === "paid"
              ? "success"
              : params.value === "pending"
              ? "warning"
              : "error";
          return <Chip size="small" color={color} label={params.value} />;
        }
      },
      { field: "date", headerName: "Date", width: 160 }
    ],
    []
  );

  const total = rows.reduce(
    (sum, r) => sum + (r.status === "paid" ? r.amount : 0),
    0
  );

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">Transactions</Typography>
        <Typography variant="subtitle1">
          Total paid: R {total.toFixed(2)}
        </Typography>
      </Stack>
      <Paper elevation={3} sx={{ p: 2 }}>
        <MetricsDataGrid
          rows={rows}
          columns={columns}
          autoHeight
          pageSize={5}
        />
      </Paper>
    </Box>
  );
}
