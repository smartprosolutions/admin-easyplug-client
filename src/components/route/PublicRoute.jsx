import React from "react";
import { Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { me } from "../../services/authService";
import {
  canAccessAdminApp,
  getDefaultHomePath,
  resolveUserRole,
} from "../../utils/accessControl";

export default function PublicRoute({ children }) {
  const [checking, setChecking] = React.useState(true);
  const [redirectPath, setRedirectPath] = React.useState("");

  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setChecking(false);
      return;
    }

    let mounted = true;
    me()
      .then((data) => {
        if (!mounted) return;
        const role = resolveUserRole(data);
        if (canAccessAdminApp(role)) {
          setRedirectPath(getDefaultHomePath(role));
        } else {
          localStorage.removeItem("access_token");
        }
      })
      .catch(() => {
        try {
          localStorage.removeItem("access_token");
        } catch {
          // ignore
        }
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (redirectPath) return <Navigate to={redirectPath} replace />;
  return children;
}
