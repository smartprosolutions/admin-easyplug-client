import React from "react";
import { Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useUserProfileQuery } from "../../services/queries";
import { isAdminRole, isSellerRole, resolveUserRole } from "../../utils/accessControl";

const roleChecks = {
  admin: isAdminRole,
  seller: isSellerRole,
};

export default function RoleRoute({ children, allow = ["admin"], fallbackTo = "/inventory" }) {
  const { data: profileData, isLoading } = useUserProfileQuery({ retry: false });
  const role = resolveUserRole(profileData);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "40vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  const canAccess = allow.some((allowedRole) => {
    const check = roleChecks[allowedRole];
    return typeof check === "function" ? check(role) : false;
  });

  if (!canAccess) {
    return <Navigate to={fallbackTo} replace />;
  }

  return children;
}