import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { gradientPrimary } from "../../theme/theme";
import {
  getAppTourSteps,
  hasCompletedAppTour,
  markAppTourComplete,
  resolveTourUserId,
} from "../../utils/appTour";

const PAD = 8;

function isElementOnScreen(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}

function getTargetElement(targetId) {
  if (!targetId || typeof document === "undefined") return null;
  const els = document.querySelectorAll(`[data-tour="${targetId}"]`);
  let best = null;
  els.forEach((el) => {
    if (!isElementOnScreen(el) && !best) {
      best = el;
      return;
    }
    if (isElementOnScreen(el)) best = el;
  });
  return best;
}

function getTargetRect(targetId) {
  const el = getTargetElement(targetId);
  if (!el || !isElementOnScreen(el)) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: Math.max(0, rect.top - PAD),
    left: Math.max(0, rect.left - PAD),
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
}

function emitTourState(active) {
  window.dispatchEvent(
    new CustomEvent("easyplug:tour-state", { detail: { active } }),
  );
}

function emitTourPrepare({ openDrawer = false } = {}) {
  window.dispatchEvent(
    new CustomEvent("easyplug:tour-prepare", { detail: { openDrawer } }),
  );
}

export default function AppTour({
  profileData,
  isSeller = false,
  forceOpen = false,
  onForceHandled,
}) {
  const navigate = useNavigate();
  const userId = resolveTourUserId(profileData);
  const steps = React.useMemo(
    () => getAppTourSteps({ isSeller }),
    [isSeller],
  );

  const [offerOpen, setOfferOpen] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [spotlight, setSpotlight] = React.useState(null);

  const step = steps[stepIndex] || null;
  const isCenterStep =
    !step?.target || step?.placement === "center" || !spotlight;

  const finishTour = React.useCallback(() => {
    markAppTourComplete(userId);
    emitTourState(false);
    setActive(false);
    setOfferOpen(false);
    setStepIndex(0);
    setSpotlight(null);
  }, [userId]);

  const skipTour = React.useCallback(() => {
    finishTour();
  }, [finishTour]);

  const startTour = React.useCallback(() => {
    setOfferOpen(false);
    setStepIndex(0);
    setActive(true);
    emitTourState(true);
  }, []);

  React.useEffect(() => {
    if (!userId) return undefined;
    if (forceOpen) {
      setOfferOpen(false);
      setStepIndex(0);
      setActive(true);
      emitTourState(true);
      onForceHandled?.();
      return undefined;
    }
    if (hasCompletedAppTour(userId)) return undefined;
    const timer = window.setTimeout(() => setOfferOpen(true), 600);
    return () => window.clearTimeout(timer);
  }, [userId, forceOpen, onForceHandled]);

  React.useEffect(() => {
    if (!active || !step) return undefined;

    let cancelled = false;

    const sync = async () => {
      emitTourPrepare({ openDrawer: Boolean(step.openDrawer) });

      const shouldNavigate =
        step.path &&
        !step.keepNav &&
        window.location.pathname !== step.path;

      if (shouldNavigate) {
        navigate(step.path);
        await new Promise((resolve) => setTimeout(resolve, 320));
      }

      if (step.openDrawer) {
        await new Promise((resolve) => setTimeout(resolve, 280));
      }

      if (cancelled) return;
      if (!step.target) {
        setSpotlight(null);
        return;
      }

      const targetEl = getTargetElement(step.target);
      if (targetEl && (step.scrollIntoView || !isElementOnScreen(targetEl))) {
        targetEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        await new Promise((resolve) => setTimeout(resolve, 320));
      }

      let rect = getTargetRect(step.target);
      for (let i = 0; i < 10 && !rect; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 90));
        if (cancelled) return;
        rect = getTargetRect(step.target);
      }
      setSpotlight(rect);
    };

    sync();

    const onResize = () => {
      if (step.target) setSpotlight(getTargetRect(step.target));
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, step, navigate, stepIndex]);

  const goNext = () => {
    if (stepIndex >= steps.length - 1) {
      finishTour();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const cardPosition = React.useMemo(() => {
    if (isCenterStep || !spotlight) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(420px, calc(100vw - 32px))",
      };
    }

    const spaceBelow =
      window.innerHeight - (spotlight.top + spotlight.height);
    const preferBelow = spaceBelow > 180;
    const top = preferBelow
      ? spotlight.top + spotlight.height + 12
      : Math.max(16, spotlight.top - 12);
    const left = Math.min(
      Math.max(16, spotlight.left),
      window.innerWidth - 360,
    );

    return {
      position: "fixed",
      top: preferBelow ? top : undefined,
      bottom: preferBelow ? undefined : window.innerHeight - top,
      left,
      width: "min(360px, calc(100vw - 32px))",
      transform: preferBelow ? "none" : "translateY(-100%)",
    };
  }, [isCenterStep, spotlight]);

  return (
    <>
      <Dialog
        open={offerOpen && !active}
        onClose={skipTour}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          Welcome aboard
          <IconButton
            aria-label="close"
            onClick={skipTour}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Would you like a short optional tour of EasyPlug Admin? You can
            skip it and restart anytime from your profile.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={skipTour} color="inherit">
            Skip
          </Button>
          <Button
            variant="contained"
            onClick={startTour}
            sx={{ background: gradientPrimary, color: "#fff" }}
          >
            Start tour
          </Button>
        </DialogActions>
      </Dialog>

      {active && step ? (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: (t) => t.zIndex.modal + 20,
            pointerEvents: "none",
          }}
        >
          {spotlight ? (
            <Box
              sx={{
                position: "fixed",
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                borderRadius: 2,
                boxShadow: `0 0 0 9999px ${alpha("#0f172a", 0.62)}`,
                border: "2px solid",
                borderColor: "primary.main",
                pointerEvents: "none",
                transition: "all 180ms ease",
              }}
            />
          ) : (
            <Box
              sx={{
                position: "fixed",
                inset: 0,
                bgcolor: alpha("#0f172a", 0.55),
                pointerEvents: "none",
              }}
            />
          )}

          <Paper
            elevation={8}
            sx={{
              ...cardPosition,
              pointerEvents: "auto",
              p: 2.25,
              borderRadius: 3,
              zIndex: 1,
            }}
          >
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={1}
              >
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Step {stepIndex + 1} of {steps.length}
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {step.title}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={skipTour} aria-label="Skip tour">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {step.body}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  color="inherit"
                  disabled={stepIndex === 0}
                  onClick={goBack}
                >
                  Back
                </Button>
                <Button color="inherit" onClick={skipTour}>
                  Skip
                </Button>
                <Button
                  variant="contained"
                  onClick={goNext}
                  sx={{ background: gradientPrimary, color: "#fff" }}
                >
                  {stepIndex >= steps.length - 1 ? "Finish" : "Next"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      ) : null}
    </>
  );
}
