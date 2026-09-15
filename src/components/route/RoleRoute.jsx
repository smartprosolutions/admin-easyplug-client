import React from "react";
import { Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useUserProfileQuery } from "../../services/queries";
import {
  canAccessAdminApp,
  isAdminRole,
  isSellerRole,
  resolveUserRole,
} from "../../utils/accessControl";

const roleChecks = {
  admin: isAdminRole,
  seller: isSellerRole,
};

export default function RoleRoute({
  children,
  allow = ["admin"],
  fallbackTo = "/inventory",
}) {
  const {
    data: profileData,
    isLoading,
    isError,
    isFetching,
  } = useUserProfileQuery({ retry: false });

  if (isLoading || (isFetching && !profileData)) {
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

  if (isError || !profileData) {
    try {
      localStorage.removeItem("access_token");
    } catch {
      // ignore
    }
    return <Navigate to="/login" replace />;
  }

  const role = resolveUserRole(profileData);

  if (!canAccessAdminApp(role)) {
    try {
      localStorage.removeItem("access_token");
    } catch {
      // ignore
    }
    return <Navigate to="/login" replace />;
  }

  const canAccess = allow.some((allowedRole) => {
    const check = roleChecks[allowedRole];
    return typeof check === "function" ? check(role) : false;
  });

  if (!canAccess) {
    // Sellers trying to open admin-only pages land on inventory.
    // Admins denied from a seller-only route (none today) go to dashboard.
    const redirectTo = isAdminRole(role) ? "/dashboard" : fallbackTo;
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
