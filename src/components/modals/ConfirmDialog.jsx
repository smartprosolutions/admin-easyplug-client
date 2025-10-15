import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  description = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "error",
  loading = false,
  onClose,
  onConfirm
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      {description ? (
        <DialogContent>
          <DialogContentText>{description}</DialogContentText>
        </DialogContent>
      ) : null}
      <DialogActions>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          color={confirmColor}
          variant="contained"
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
