import React from "react";
import { Navigate } from "react-router-dom";
import { me } from "../../services/authService";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export default function PrivateRoute({ children }) {
  const [checking, setChecking] = React.useState(true);
  const [authed, setAuthed] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setChecking(false);
      setAuthed(false);
      return;
    }
    let mounted = true;
    me()
      .then(() => {
        if (!mounted) return;
        setAuthed(true);
      })
      .catch(() => {
        // localStorage.removeItem("access_token");
        // setAuthed(false);
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
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}
