import { DataGrid } from "@mui/x-data-grid";
import React from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const CustomDataGrid = ({
  rows,
  columns,
  paginationModel,
  onPaginationModelChange,
  paginationMode = "client",
  rowCount,
  pageSizeOptions = [15, 30, 50, 100],
  loading = false,
  ...otherProps
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <DataGrid
        checkboxSelection={!isMobile}
        rows={rows}
        columns={columns}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
        }
        initialState={{
          pagination: { paginationModel: { pageSize: isMobile ? 10 : 15 } },
        }}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        paginationMode={paginationMode}
        rowCount={rowCount}
        pageSizeOptions={pageSizeOptions}
        loading={loading}
        sx={(theme) => ({
          borderColor:
            theme.palette.mode === "dark"
              ? theme.palette.grey[700]
              : theme.palette.grey[200],
          "& .MuiDataGrid-cell": {
            whiteSpace: "normal",
            overflow: "visible",
            display: "flex",
            alignItems: "center",
            borderColor:
              theme.palette.mode === "dark"
                ? theme.palette.grey[700]
                : theme.palette.grey[200],
          },
          "& .MuiDataGrid-footerContainer": {
            flexWrap: "wrap",
            rowGap: 0.5,
          },
          "& .MuiDataGrid-toolbarContainer": {
            flexWrap: "wrap",
            rowGap: 0.5,
          },
        })}
        getRowHeight={() => "auto"}
        disableColumnResize
        density="compact"
        {...otherProps}
      />
    </div>
  );
};

export default CustomDataGrid;
