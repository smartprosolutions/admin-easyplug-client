import * as React from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import List from "@mui/material/List";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import MuiDrawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import { Avatar, Tooltip, styled, Typography } from "@mui/material";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import MarkunreadIcon from "@mui/icons-material/Markunread";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import Badge from "@mui/material/Badge";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import Close from "@mui/icons-material/Close";
import LoginIcon from "@mui/icons-material/Login";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import { Outlet, Link, useLocation } from "react-router-dom";
import { gradientPrimary } from "../../theme/theme";
import ConfirmDialog from "../modals/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUnreadCounts } from "../../context/UnreadCountsContext";
import { useUserProfileQuery } from "../../services/queries";
import {
  isSellerRole,
  resolveUserRole,
} from "../../utils/accessControl";
import AppTour from "../tour/AppTour";
import { tourIdForNavUrl, TOUR_TARGETS } from "../../utils/appTour";
import RoleModeSwitch from "./RoleModeSwitch";
import BrandLogo from "../brand/BrandLogo";

// AppBar removed; toolbar contents moved into the drawer

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
  borderTopRightRadius: 16,
  borderBottomRightRadius: 16,
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(9)} + 1px)`,
  borderTopRightRadius: 16,
  borderBottomRightRadius: 16,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(10)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer)(({ theme, open, variant }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(variant !== "temporary" &&
    (open
      ? {
          ...openedMixin(theme),
          "& .MuiDrawer-paper": openedMixin(theme),
        }
      : {
          ...closedMixin(theme),
          "& .MuiDrawer-paper": closedMixin(theme),
        })),
}));

const Main = styled("main", {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "fullBleed",
})(({ theme, open, fullBleed }) => ({
  flexGrow: 1,
  padding: fullBleed ? 0 : theme.spacing(3),
  minHeight: "100vh",
  width: "100%",
  minWidth: 0,
  overflowX: fullBleed ? "hidden" : "auto",
  ...(fullBleed
    ? {
        width: "100vw",
        minWidth: "100vw",
        maxWidth: "100vw",
        padding: 0,
        [theme.breakpoints.down("sm")]: {
          padding: 0,
          paddingBottom: 0,
          width: "100vw",
          minWidth: "100vw",
        },
        [theme.breakpoints.between("sm", "md")]: {
          padding: 0,
          width: "100vw",
          minWidth: "100vw",
        },
        [theme.breakpoints.up("md")]: {
          width: "100vw",
          minWidth: "100vw",
        },
      }
    : {
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(1.25),
          paddingBottom: theme.spacing(10),
          width: "100%",
          minWidth: 0,
        },
        [theme.breakpoints.between("sm", "md")]: {
          padding: theme.spacing(2),
          paddingBottom: theme.spacing(2.5),
          ...(open
            ? {
                width: `calc(100vw - ${drawerWidth}px)`,
                minWidth: `calc(100vw - ${drawerWidth}px)`,
              }
            : {
                width: `calc(100vw - calc(${theme.spacing(10)} + 1px))`,
                minWidth: `calc(100vw - calc(${theme.spacing(10)} + 1px))`,
              }),
        },
        [theme.breakpoints.up("md")]: {
          ...(open
            ? {
                width: `calc(100vw - ${drawerWidth}px)`,
                minWidth: `calc(100vw - ${drawerWidth}px)`,
              }
            : {
                width: `calc(100vw - calc(${theme.spacing(9)} + 1px))`,
                minWidth: `calc(100vw - calc(${theme.spacing(9)} + 1px))`,
                [theme.breakpoints.up("lg")]: {
                  width: `calc(100vw - calc(${theme.spacing(10)} + 1px))`,
                  minWidth: `calc(100vw - calc(${theme.spacing(10)} + 1px))`,
                },
              }),
        },
      }),
  transition: theme.transitions.create(["width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: theme.spacing(1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const adminNav = [
  { title: "Dashboard", icon: DashboardIcon, url: "/dashboard" },
  { title: "Reports", icon: AssessmentRoundedIcon, url: "/reports" },
  {
    title: "Support Tickets",
    icon: ConfirmationNumberOutlinedIcon,
    url: "/support-tickets",
  },
  { title: "My Listings", icon: Inventory2RoundedIcon, url: "/inventory" },
  {
    title: "Advertisements",
    icon: CampaignRoundedIcon,
    url: "/advertisements",
  },
  { title: "Transactions", icon: ReceiptLongRoundedIcon, url: "/transactions" },
  { title: "User Management", icon: GroupRoundedIcon, url: "/userManagement" },
  { title: "Activity Logs", icon: ManageSearchIcon, url: "/activity-logs" },
  { title: "Messages", icon: MarkunreadIcon, url: "/messages" },
  {
    title: "Notifications",
    icon: NotificationsRoundedIcon,
    url: "/notifications",
  },
];

const sellerNav = [
  { title: "Dashboard", icon: DashboardIcon, url: "/dashboard" },
  { title: "My Listings", icon: Inventory2RoundedIcon, url: "/inventory" },
  {
    title: "Advertisements",
    icon: CampaignRoundedIcon,
    url: "/advertisements",
  },
  { title: "Messages", icon: MarkunreadIcon, url: "/messages" },
  {
    title: "Notifications",
    icon: NotificationsRoundedIcon,
    url: "/notifications",
  },
];

export default function Navigation({ currentTheme, setThemeMode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { messagesUnreadCount, notificationsUnreadCount } = useUnreadCounts();
  const { data: profileData } = useUserProfileQuery({ retry: false });
  const isSeller = isSellerRole(resolveUserRole(profileData));
  const [forceTour, setForceTour] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  React.useEffect(() => {
    const onReplay = () => setForceTour(true);
    const onTourState = (event) => {
      setTourActive(Boolean(event?.detail?.active));
      if (!event?.detail?.active) setOpen(false);
    };
    const onTourPrepare = (event) => {
      if (event?.detail?.openDrawer) setOpen(true);
    };
    window.addEventListener("easyplug:start-tour", onReplay);
    window.addEventListener("easyplug:tour-state", onTourState);
    window.addEventListener("easyplug:tour-prepare", onTourPrepare);
    return () => {
      window.removeEventListener("easyplug:start-tour", onReplay);
      window.removeEventListener("easyplug:tour-state", onTourState);
      window.removeEventListener("easyplug:tour-prepare", onTourPrepare);
    };
  }, []);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const handleSignOut = () => {
    // Clear auth token and any other persisted auth state
    localStorage.removeItem("access_token");
    // Optionally clear more app state here if needed
    navigate("/login", { replace: true });
  };

  const menuToRender = isSeller ? sellerNav : adminNav;

  const mobileNavItems = React.useMemo(() => {
    if (isSeller) {
      return [
        { title: "Dashboard", icon: DashboardIcon, url: "/dashboard" },
        { title: "My Listings", icon: Inventory2RoundedIcon, url: "/inventory" },
        { title: "Adverts", icon: CampaignRoundedIcon, url: "/advertisements" },
        { title: "Messages", icon: MarkunreadIcon, url: "/messages" },
        { title: "Alerts", icon: NotificationsRoundedIcon, url: "/notifications" },
      ];
    }

    return [
      { title: "Dashboard", icon: DashboardIcon, url: "/dashboard" },
      { title: "My Listings", icon: Inventory2RoundedIcon, url: "/inventory" },
      { title: "Adverts", icon: CampaignRoundedIcon, url: "/advertisements" },
      { title: "Messages", icon: MarkunreadIcon, url: "/messages" },
      { title: "Alerts", icon: NotificationsRoundedIcon, url: "/notifications" },
    ];
  }, [isSeller]);

  const mobileNavValue = React.useMemo(() => {
    const currentPath = location.pathname;
    const matchedIndex = mobileNavItems.findIndex(
      (item) => currentPath === item.url || currentPath.startsWith(`${item.url}/`),
    );
    return matchedIndex === -1 ? 0 : matchedIndex;
  }, [location.pathname, mobileNavItems]);

  const isMessagesRoute = location.pathname.startsWith("/messages");
  const hideChrome = isMessagesRoute && !tourActive;

  return (
    <Box
      sx={{
        display: "flex",
        backgroundColor: "background.default",
      }}
      width="100%"
    >
      <CssBaseline />

      {!hideChrome && menuToRender.length > 0 && (
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={open}
          onClose={handleDrawerClose}
          ModalProps={{ keepMounted: true }}
          sx={
            isMobile
              ? {
                  "& .MuiDrawer-paper": {
                    width: drawerWidth,
                    borderRadius: 0,
                  },
                }
              : undefined
          }
        >
          <Box
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <DrawerHeader
              sx={{ justifyContent: open ? "flex-start" : "center", gap: 1 }}
            >
              {open ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ position: "relative" }}>
                      <Box
                        sx={{
                          width: { xs: 32, md: 40 },
                          height: { xs: 32, md: 40 },
                          borderRadius: 2,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#fff",
                        }}
                      >
                        <BrandLogo
                          alt="EasyPlug Logo"
                          updateDocumentIcons
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: "block" }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          background: gradientPrimary,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          lineHeight: 1.1,
                        }}
                      >
                        {isSeller ? "Easyplug Seller" : "Easyplug Admin"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          display: "block",
                          fontStyle: "italic",
                        }}
                      >
                        Manage your marketplace
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton
                    aria-label="close drawer"
                    onClick={handleDrawerClose}
                    size="small"
                  >
                    <Close sx={{ color: "primary.main", fontSize: 22 }} />
                  </IconButton>
                </>
              ) : (
                <IconButton
                  aria-label="open drawer"
                  onClick={handleDrawerOpen}
                  size="small"
                >
                  <MenuIcon sx={{ color: "primary.main", fontSize: 22 }} />
                </IconButton>
              )}
            </DrawerHeader>

            <List sx={{ flexGrow: 1 }}>
              {menuToRender.map((listItem) => {
                const IconComponent = listItem.icon;
                const isActive = location.pathname === listItem.url;

                const showNotificationBadge = listItem.title
                  .toLowerCase()
                  .includes("notification");
                const showMessageBadge = listItem.title
                  .toLowerCase()
                  .includes("message");

                return (
                  <ListItem
                    key={listItem.title}
                    disablePadding
                    sx={{ display: "block" }}
                  >
                    <ListItemButton
                      component={Link}
                      to={listItem.url}
                      data-tour={tourIdForNavUrl(listItem.url) || undefined}
                      onClick={isMobile ? handleDrawerClose : undefined}
                      centerRipple
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? "initial" : "center",
                        px: open ? 2.5 : 0,
                        py: open ? undefined : 0,
                        backgroundImage:
                          open && isActive ? gradientPrimary : "none",
                        bgcolor: isActive && !open ? "transparent" : undefined,
                        color: isActive ? "#fff" : undefined,
                        borderRadius: isActive ? 1.25 : 2,
                        margin: open ? "6px 10px" : "0 auto",
                        width: open ? "auto" : 56,
                        height: open ? "auto" : 56,
                        transition: "all 200ms ease",
                        boxShadow:
                          open && isActive
                            ? (theme) =>
                                `inset 3px 0 0 ${theme.palette.primary.main}, 0 3px 12px rgba(0,0,0,0.12)`
                            : "none",
                        "&:hover": {
                          bgcolor: isActive
                            ? undefined
                            : (theme) => theme.palette.action.hover,
                        },
                      }}
                    >
                      <Tooltip
                        title={open ? "" : listItem.title}
                        placement="right"
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            color: isActive
                              ? "#fff"
                              : currentTheme
                                ? "#333"
                                : "#fff",
                            borderRadius: isActive ? 1.25 : open ? 2 : 3,
                            padding: 0,
                            width: open ? "auto" : 56,
                            height: open ? "auto" : 56,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: open ? 0 : "auto",
                            bgcolor: "transparent",
                            backgroundImage:
                              !open && isActive ? gradientPrimary : "none",
                            transition: "transform 180ms ease",
                          }}
                        >
                          {(!open && showNotificationBadge) ||
                          (!open && showMessageBadge) ? (
                            <Badge
                              color="error"
                              overlap="circular"
                              badgeContent={
                                showNotificationBadge
                                  ? notificationsUnreadCount
                                  : messagesUnreadCount
                              }
                              invisible={
                                !(showNotificationBadge
                                  ? notificationsUnreadCount
                                  : messagesUnreadCount)
                              }
                              anchorOrigin={{
                                vertical: "top",
                                horizontal: "right",
                              }}
                              sx={{
                                "& .MuiBadge-badge": {
                                  right: 0,
                                  top: 0,
                                  fontSize: 9,
                                  height: 16,
                                  minWidth: 16,
                                  px: 0.5,
                                },
                              }}
                            >
                              <IconComponent fontSize="medium" />
                            </Badge>
                          ) : (
                            <IconComponent fontSize="medium" />
                          )}
                        </ListItemIcon>
                      </Tooltip>

                      <ListItemText
                        primary={
                          (showNotificationBadge || showMessageBadge) &&
                          open ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
                              <span>{listItem.title}</span>
                              {open && (
                                <Badge
                                  color="error"
                                  badgeContent={
                                    showNotificationBadge
                                      ? notificationsUnreadCount
                                      : messagesUnreadCount
                                  }
                                  invisible={
                                    !(showNotificationBadge
                                      ? notificationsUnreadCount
                                      : messagesUnreadCount)
                                  }
                                  sx={{
                                    "& .MuiBadge-badge": {
                                      right: -6,
                                      top: 0,
                                      fontSize: 9,
                                      height: 16,
                                      minWidth: 16,
                                      px: 0.5,
                                    },
                                  }}
                                />
                              )}
                            </Box>
                          ) : (
                            listItem.title
                          )
                        }
                        sx={{
                          opacity: open ? 1 : 0,
                          color:
                            open && isActive
                              ? "#fff"
                              : currentTheme
                                ? "#333"
                                : "#fff",
                          ml: open ? 0.5 : 0,
                          fontSize: 13,
                          fontWeight: open && isActive ? 700 : 500,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            <Box
              sx={{
                px: open ? 1.5 : 1,
                pb: 1,
                pt: 1.25,
                borderTop: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "light" ? "#eee" : "#2a2a2a"
                  }`,
              }}
            >
              <RoleModeSwitch compact={!open} vertical={!open} />
            </Box>
            <Box
              sx={{
                p: 1.5,
                display: "flex",
                flexDirection: open ? "row" : "column",
                alignItems: "center",
                justifyContent: open ? "space-between" : "center",
                gap: open ? 1 : 0.5,
              }}
            >
              <Tooltip title="Set Theme">
                <IconButton
                  onClick={() => setThemeMode(!currentTheme)}
                  size="medium"
                >
                  {currentTheme ? (
                    <DarkModeIcon fontSize="medium" />
                  ) : (
                    <LightModeIcon fontSize="medium" />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Sign out">
                <IconButton onClick={() => setConfirmOpen(true)} size="medium">
                  <LogoutIcon sx={{ color: "error.main", fontSize: 22 }} />
                </IconButton>
              </Tooltip>
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Open profile">
                  <IconButton
                    component={Link}
                    to="/profile"
                    aria-label="Open profile"
                    data-tour={TOUR_TARGETS.profile}
                    sx={{ p: 0, bgcolor: "primary.main" }}
                  >
                    <Avatar>T</Avatar>
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <ConfirmDialog
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={() => {
                setConfirmOpen(false);
                handleSignOut();
              }}
              title="Sign out"
              description="Are you sure you want to sign out?"
              confirmText="Sign out"
              confirmColor="error"
            />
          </Box>
        </Drawer>
      )}

      <Main open={hideChrome ? false : open} fullBleed={hideChrome}>
        {!hideChrome && isMobile && (
          <AppBar
            position="fixed"
            color="inherit"
            elevation={2}
            sx={{
              left: 0,
              right: 0,
              width: "100%",
              zIndex: (theme) => theme.zIndex.appBar,
              bgcolor: (muiTheme) => alpha(muiTheme.palette.background.paper, 0.94),
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Toolbar
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: 62,
                px: 1,
                width: "100%",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  aria-label="open navigation"
                  onClick={handleDrawerOpen}
                  size="medium"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: (muiTheme) => alpha(muiTheme.palette.primary.main, 0.08),
                  }}
                >
                  <MenuIcon sx={{ color: "primary.main", fontSize: 24 }} />
                </IconButton>
                <Stack spacing={0} sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 800,
                      background: gradientPrimary,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      lineHeight: 1.1,
                    }}
                  >
                    {isSeller ? "Easyplug Seller" : "Easyplug Admin"}
                  </Typography>
                  <Typography
                    component="em"
                    sx={{
                      fontSize: 10.5,
                      color: "text.secondary",
                      fontStyle: "italic",
                      fontFamily: "inherit",
                      letterSpacing: 0.2,
                    }}
                  >
                    Manage your marketplace
                  </Typography>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="Set Theme">
                  <IconButton onClick={() => setThemeMode(!currentTheme)} size="medium">
                    {currentTheme ? (
                      <DarkModeIcon fontSize="small" />
                    ) : (
                      <LightModeIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open profile">
                  <IconButton
                    component={Link}
                    to="/profile"
                    aria-label="Open profile"
                    data-tour={TOUR_TARGETS.profile}
                    sx={{ p: 0, bgcolor: "primary.main" }}
                    size="medium"
                  >
                    <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
                      T
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sign out">
                  <IconButton
                    onClick={() => setConfirmOpen(true)}
                    size="medium"
                  >
                    <LoginIcon sx={{ color: "error.main", fontSize: 24 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Toolbar>
          </AppBar>
        )}
        {!hideChrome && isMobile && <Toolbar sx={{ minHeight: 62, mb: 1 }} />}
        <Outlet />

        {!hideChrome && isMobile && (
          <Paper
            elevation={0}
            sx={{
              position: "fixed",
              left: 8,
              right: 8,
              bottom: 10,
              zIndex: (muiTheme) => muiTheme.zIndex.appBar + 1,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: (muiTheme) => alpha(muiTheme.palette.background.paper, 0.94),
              backdropFilter: "blur(16px)",
              boxShadow: (muiTheme) =>
                muiTheme.palette.mode === "light"
                  ? "0 14px 34px rgba(15, 23, 42, 0.2)"
                  : "0 14px 34px rgba(0, 0, 0, 0.55)",
              overflow: "hidden",
            }}
          >
            <BottomNavigation
              showLabels
              value={mobileNavValue}
              onChange={(_, newValue) => {
                const target = mobileNavItems[newValue];
                if (target) navigate(target.url);
              }}
              sx={{
                bgcolor: "transparent",
                minHeight: 68,
                "& .MuiBottomNavigationAction-root": {
                  minWidth: 0,
                  color: "text.secondary",
                  "&.Mui-selected": {
                    color: "primary.main",
                  },
                },
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "10px !important",
                  fontWeight: 700,
                },
              }}
            >
              {mobileNavItems.map((item, index) => {
                const IconComponent = item.icon;
                const isNotification = item.url === "/notifications";
                const isMessage = item.url === "/messages";
                const badgeValue = isNotification
                  ? notificationsUnreadCount
                  : isMessage
                    ? messagesUnreadCount
                    : 0;

                return (
                  <BottomNavigationAction
                    key={item.url}
                    label={item.title}
                    data-tour={tourIdForNavUrl(item.url) || undefined}
                    icon={
                      isNotification || isMessage ? (
                        <Badge
                          color="error"
                          badgeContent={badgeValue}
                          invisible={!badgeValue}
                        >
                          <IconComponent fontSize="small" />
                        </Badge>
                      ) : (
                        <IconComponent fontSize="small" />
                      )
                    }
                    value={index}
                  />
                );
              })}
            </BottomNavigation>
          </Paper>
        )}
      </Main>
      <AppTour
        profileData={profileData}
        isSeller={isSeller}
        forceOpen={forceTour}
        onForceHandled={() => setForceTour(false)}
      />
    </Box>
  );
}
