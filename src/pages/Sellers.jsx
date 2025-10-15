import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";

export default function Sellers() {
  const rows = useMemo(
    () => [
      { id: 1, businessName: "Bright Auto", email: "auto@bright.co", reg: "2023/123456/07", verified: true, status: "active" },
      { id: 2, businessName: "Green Farms", email: "info@greenfarms.co.za", reg: "2022/987654/07", verified: false, status: "pending" },
      { id: 3, businessName: "Tech Hub", email: "hello@techhub.africa", reg: "K2021/111222/07", verified: true, status: "active" },
    ],
    []
  );
  const columns = useMemo(
    () => [
      { field: "businessName", headerName: "Business", flex: 1 },
      { field: "email", headerName: "Email", flex: 1 },
      { field: "reg", headerName: "Registration #", width: 180 },
      {
        field: "verified",
        headerName: "Verified",
        width: 140,
        renderCell: (params) => (
          <Chip size="small" color={params.value ? "success" : "default"} label={params.value ? "Yes" : "No"} />
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (params) => (
          <Chip size="small" color={params.value === "active" ? "success" : "warning"} label={params.value} />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        width: 260,
        renderCell: () => (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined">Profile</Button>
            <Button size="small" variant="contained">Verify</Button>
          </Stack>
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Sellers</Typography>
      <Paper elevation={3} sx={{ p: 2 }}>
        <MetricsDataGrid rows={rows} columns={columns} autoHeight pageSize={5} />
      </Paper>
    </Box>
  );
}


