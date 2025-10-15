import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { gradientPrimary } from "../../theme/theme";
import { useNavigate } from "react-router-dom";
import * as React from "react";

export default function GooglePrompt() {
  const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: (theme) => theme.zIndex.modal + 1
      }}
    >
      <Paper elevation={4} sx={{ p: 1.5, borderRadius: 3, minWidth: 260 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="subtitle2">Continue with Google</Typography>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Button
          fullWidth
          size="medium"
          variant="contained"
          onClick={() => navigate("/login")}
          sx={{
            mt: 1,
            color: "#fff",
            backgroundImage: gradientPrimary,
            boxShadow: "none",
            "&:hover": { opacity: 0.95, boxShadow: "none" }
          }}
          startIcon={
            <img
              alt="Google"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              style={{ width: 18, height: 18 }}
            />
          }
        >
          Continue with Google
        </Button>
      </Paper>
    </Box>
  );
}
