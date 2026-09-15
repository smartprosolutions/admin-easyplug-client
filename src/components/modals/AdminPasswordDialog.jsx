import React from "react";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { alpha } from "@mui/material/styles";

export default function AdminPasswordDialog({
  open,
  title = "Confirm admin access",
  description = "Enter your admin password to continue.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  error = "",
  onClose,
  onConfirm,
}) {
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setPassword("");
      setShowPassword(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!password.trim() || loading) return;
    onConfirm?.(password);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          background: (theme) =>
            `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "common.white",
          px: 2.5,
          py: 2,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: alpha("#fff", 0.2),
              color: "common.white",
            }}
          >
            <LockOutlinedIcon fontSize="small" />
          </Avatar>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ flex: 1, fontSize: 18 }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={loading ? undefined : onClose}
            disabled={loading}
            sx={{
              color: "common.white",
              bgcolor: alpha("#fff", 0.12),
              "&:hover": { bgcolor: alpha("#fff", 0.2) },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      <DialogContent sx={{ pt: 2.25 }}>
        {description ? (
          <DialogContentText sx={{ mb: 2 }}>{description}</DialogContentText>
        ) : null}
        <TextField
          autoFocus
          fullWidth
          type={showPassword ? "text" : "password"}
          label="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
          error={Boolean(error)}
          helperText={error || "Required to edit or delete items you do not own"}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading || !password.trim()}
          color="primary"
          variant="contained"
        >
          {loading ? "Verifying..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
