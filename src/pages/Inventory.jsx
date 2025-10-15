import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MetricsDataGrid from "../components/metrics/MetricsDataGrid";
import {
  Stack,
  Typography,
  Button,
  IconButton,
  CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminListings } from "../services/listingService";
import { gradientPrimary } from "../theme/theme";

// Live data will be fetched from the API

// (kept listings above) minimal page — only the grid

// No client-side formatting: show raw API fields in the grid per API contract

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

export default function Inventory() {
  const navigate = useNavigate();

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["adminListings"],
    queryFn: () => getAdminListings(),
    retry: false
  });

  // The API may return { listings: [...] } or an array directly. Normalize.
  const listings =
    apiData && Array.isArray(apiData)
      ? apiData
      : apiData && Array.isArray(apiData?.listings)
      ? apiData.listings
      : apiData?.data || [];

  // Use camelCase API fields when available. Ensure DataGrid `id` is set to listingId.
  const rows = (listings || []).map((r) => {
    const id = r.listingId ?? r.listing_id ?? r.id;
    return {
      id,
      ...r
    };
  });

  // Use camelCase API fields (listingId, sellerId, createdAt, isAdvertisement) where possible.
  const statusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "success";
      case "draft":
        return "default";
      case "sold":
        return "warning";
      case "expired":
        return "error";
      default:
        return "primary";
    }
  };

  const columns = [
    { field: "title", headerName: "Title", flex: 1, minWidth: 200 },
    { field: "description", headerName: "Description", width: 260, flex: 1 },
    { field: "type", headerName: "Type", width: 120 },
    { field: "category", headerName: "Category", width: 140 },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      align: "right",
      headerAlign: "right"
    },
    {
      field: "isAdvertisement",
      headerName: "Ad",
      width: 120,
      renderCell: (params) =>
        params.row.isAdvertisement ?? params.row.is_advertisement ? (
          <Chip size="small" label="Ad" color="info" />
        ) : (
          <Chip size="small" label="Standard" />
        )
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={statusColor(params.value)}
        />
      )
    },

    {
      field: "createdAt",
      headerName: "Created",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">
            {formatDate(
              params.value ?? params.row.createdAt ?? params.row.created_at
            )}
          </Typography>
        </Box>
      )
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">
            {formatDate(
              params.value ?? params.row.updatedAt ?? params.row.updated_at
            )}
          </Typography>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Inventory</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/inventory/add")}
          sx={{
            background: gradientPrimary,
            color: "#fff",
            "&:hover": { opacity: 0.92 }
          }}
        >
          Add Item
        </Button>
      </Stack>

      <Box>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <MetricsDataGrid
            autoHeight
            rows={rows}
            columns={[
              ...columns,
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
                      navigate(`/inventory/${params.row.listingId}/edit`)
                    }
                  >
                    <EditIcon />
                  </IconButton>
                )
              }
            ]}
          />
        )}
      </Box>

      <Outlet />
    </Box>
  );
}
