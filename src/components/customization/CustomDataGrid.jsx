import { DataGrid } from "@mui/x-data-grid";
import React from "react";

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
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <DataGrid
        checkboxSelection
        rows={rows}
        columns={columns}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
        }
        initialState={{
          pagination: { paginationModel: { pageSize: 15 } }
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
                : theme.palette.grey[200]
          }
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
