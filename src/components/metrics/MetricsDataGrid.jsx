import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const mergedSx = React.useMemo(() => {
    const base = {
      minHeight: isMobile ? 280 : minHeight,
      "& .MuiDataGrid-virtualScroller": {
        minHeight: isMobile ? 280 : minHeight
      },
      "& .MuiDataGrid-overlay": {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      },
      "& .MuiDataGrid-footerContainer": {
        flexWrap: "wrap",
        rowGap: 0.5,
      }
    };
    if (!sx) return base;
    return Array.isArray(sx) ? [base, ...sx] : [base, sx];
  }, [isMobile, minHeight, sx]);

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
