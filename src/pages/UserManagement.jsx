import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";

export default function UserManagement() {
  const rows = useMemo(
    () => [
      {
        id: 1,
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "Admin",
        status: "active"
      },
      {
        id: 2,
        name: "Bob Smith",
        email: "bob@example.com",
        role: "Seller",
        status: "invited"
      },
      {
        id: 3,
        name: "Carol Lee",
        email: "carol@example.com",
        role: "User",
        status: "suspended"
      }
    ],
    []
  );
  const columns = useMemo(
    () => [
      { field: "name", headerName: "Name", flex: 1 },
      { field: "email", headerName: "Email", flex: 1 },
      { field: "role", headerName: "Role", width: 140 },
      {
        field: "status",
        headerName: "Status",
        width: 160,
        renderCell: (params) => {
          const color =
            params.value === "active"
              ? "success"
              : params.value === "invited"
              ? "info"
              : "warning";
          return <Chip size="small" color={color} label={params.value} />;
        }
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        width: 240,
        renderCell: () => (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined">
              View
            </Button>
            <Button size="small" variant="contained">
              Edit
            </Button>
          </Stack>
        )
      }
    ],
    []
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        User Management
      </Typography>
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
