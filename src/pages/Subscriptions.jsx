import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getSubscriptions } from "../services/subscriptionService";
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  CircularProgress,
  Chip
} from "@mui/material";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate, Outlet } from "react-router-dom";
import { gradientPrimary } from "../theme/theme";

export default function Subscriptions() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getSubscriptions()
  });

  const subscriptions =
    data && data.subscriptions
      ? data.subscriptions
      : Array.isArray(data)
      ? data
      : data?.data || [];

  // const formatCurrency = (val) => {
  //   try {
  //     return new Intl.NumberFormat("en-US", {
  //       style: "currency",
  //       currency: "USD"
  //     }).format(Number(val));
  //   } catch {
  //     return val;
  //   }
  // };

  // const formatDate = (v) => {
  //   try {
  //     return new Date(v).toLocaleString();
  //   } catch {
  //     return v;
  //   }
  // };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Subscriptions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/subscriptions/add")}
          sx={{
            background: gradientPrimary,
            color: "#fff",
            "&:hover": { opacity: 0.92 }
          }}
        >
          Add Subscription
        </Button>
      </Stack>

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 360
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      ) : (
        // DataGrid intentionally placed outside the Paper to give it full-width and independent styling
        <Box>
          <MetricsDataGrid
            autoHeight
            rows={subscriptions.map((s) => ({
              id: s.subscriptionId,
              subscriptionId: s.subscriptionId,
              name: s.name,
              price: s.price,
              durationInHours: s.durationInHours,
              description: s.description,
              status: s.status,
              createdAt: s.createdAt
            }))}
            columns={[
              { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
              {
                field: "price",
                headerName: "Price",
                width: 120
                // valueFormatter: (p) => formatCurrency(p.value)
              },
              {
                field: "durationInHours",
                headerName: "Duration (hrs)",
                width: 140
              },
              {
                field: "status",
                headerName: "Status",
                width: 140,
                renderCell: (params) => {
                  const val = (params.value || "").toString().toLowerCase();
                  if (val === "active")
                    return <Chip label="Active" color="success" size="small" />;
                  if (val === "draft")
                    return <Chip label="Draft" color="info" size="small" />;
                  return (
                    <Chip label={params.value} color="error" size="small" />
                  );
                }
              },
              {
                field: "createdAt",
                headerName: "Created",
                width: 180
                // valueFormatter: (p) => formatDate(p.value)
              },
              {
                field: "actions",
                headerName: "Actions",
                width: 110,
                sortable: false,
                renderCell: (params) => (
                  <IconButton
                    sx={{
                      background: gradientPrimary,
                      color: "#fff",
                      "&:hover": { opacity: 0.92 }
                    }}
                    onClick={() =>
                      navigate(
                        `/subscriptions/${params.row.subscriptionId}/edit`
                      )
                    }
                  >
                    <EditIcon />
                  </IconButton>
                )
              }
            ]}
          />
        </Box>
      )}
      {/* Outlet for nested routes (modal) */}
      <Outlet />
    </Box>
  );
}
