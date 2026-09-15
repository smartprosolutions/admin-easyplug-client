import React from "react";
import { Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useUserProfileQuery } from "../../services/queries";
import {
  canAccessAdminApp,
  getDefaultHomePath,
  resolveUserRole,
} from "../../utils/accessControl";

/** Sends authenticated users to their role home (inventory for sellers, dashboard for admins). */
export default function HomeRedirect() {
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

  return <Navigate to={getDefaultHomePath(role)} replace />;
}
