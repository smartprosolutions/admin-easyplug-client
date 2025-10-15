import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import CustomNoRowsGridOverlay from "./NoGridRowsOverlay";

export default function MetricsDataGrid({
  rows = [],
  columns = [],
  pageSize = 10,
  autoHeight = false,
  minHeight = 360,
  sx,
  ...rest
}) {
  const mergedSx = React.useMemo(() => {
    const base = {
      minHeight,
      "& .MuiDataGrid-virtualScroller": {
        minHeight
      },
      "& .MuiDataGrid-overlay": {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }
    };
    if (!sx) return base;
    return Array.isArray(sx) ? [base, ...sx] : [base, sx];
  }, [minHeight, sx]);

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight={autoHeight}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize } } }}
        slots={{ noRowsOverlay: CustomNoRowsGridOverlay }}
        sx={mergedSx}
        {...rest}
      />
    </Box>
  );
}
