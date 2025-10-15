import React from "react";
import { Navigate } from "react-router-dom";
import { me } from "../../services/authService";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export default function PublicRoute({ children }) {
  const [checking, setChecking] = React.useState(true);
  const [redirect, setRedirect] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setChecking(false);
      return;
    }
    let mounted = true;
    me()
      .then(() => {
        if (!mounted) return;
        setRedirect(true);
      })
      .catch(() => {
        // invalid token -> remove and allow public route
        // localStorage.removeItem("access_token");
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (checking)
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <CircularProgress />
      </Box>
    );
  if (redirect) return <Navigate to="/dashboard" replace />;
  return children;
}
