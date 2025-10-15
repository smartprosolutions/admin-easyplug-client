import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import List from "@mui/material/List";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import MuiDrawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Avatar, Tooltip, styled, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import logo from "../../assets/images/Sample Logo 1 (4).png";
import DashboardIcon from "@mui/icons-material/Dashboard";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import MarkunreadIcon from "@mui/icons-material/Markunread";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import SubscriptionsRoundedIcon from "@mui/icons-material/SubscriptionsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import Badge from "@mui/material/Badge";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import Close from "@mui/icons-material/Close";
import { Outlet, Link, useLocation } from "react-router-dom";
import { gradientPrimary } from "../../theme/theme";
import ConfirmDialog from "../modals/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// AppBar removed; toolbar contents moved into the drawer

const drawerWidth = 220;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: "hidden",
  borderTopRightRadius: 16,
  borderBottomRightRadius: 16
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(9)} + 1px)`,
  borderTopRightRadius: 16,
  borderBottomRightRadius: 16,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(10)} + 1px)`
  }
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open"
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme)
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme)
  })
}));

const Main = styled("main", {
  shouldForwardProp: (prop) => prop !== "open"
})(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  minHeight: "100vh",
  // Make content width fill the remaining viewport width after the drawer
  ...(open
    ? {
        width: `calc(100vw - ${drawerWidth}px)`,
        minWidth: `calc(100vw - ${drawerWidth}px)`
      }
    : {
        width: `calc(100vw - calc(${theme.spacing(9)} + 1px))`,
        minWidth: `calc(100vw - calc(${theme.spacing(9)} + 1px))`,
        [theme.breakpoints.up("sm")]: {
          width: `calc(100vw - calc(${theme.spacing(10)} + 1px))`,
          minWidth: `calc(100vw - calc(${theme.spacing(10)} + 1px))`
        }
      }),
  transition: theme.transitions.create(["width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  })
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: theme.spacing(1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar
}));

const adminNav = [
  { title: "Dashboard", icon: DashboardIcon, url: "/dashboard" },
  { title: "Inventory", icon: Inventory2RoundedIcon, url: "/inventory" },
  {
    title: "Advertisements",
    icon: CampaignRoundedIcon,
    url: "/advertisements"
  },
  { title: "Sellers", icon: StorefrontRoundedIcon, url: "/sellers" },
  {
    title: "Subscriptions",
    icon: SubscriptionsRoundedIcon,
    url: "/subscriptions"
  },
  { title: "Transactions", icon: ReceiptLongRoundedIcon, url: "/transactions" },
  { title: "User Management", icon: GroupRoundedIcon, url: "/userManagement" },
  { title: "Messages", icon: MarkunreadIcon, url: "/messages" },
  {
    title: "Notifications",
    icon: NotificationsRoundedIcon,
    url: "/notifications"
  }
];

export default function Navigation({ currentTheme, setThemeMode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // TODO: replace with real counts from API or context
  const notificationsCount = 3;
  const messagesCount = 2;

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const handleSignOut = () => {
    // Clear auth token and any other persisted auth state
    localStorage.removeItem("access_token");
    // Optionally clear more app state here if needed
    navigate("/login", { replace: true });
  };

  const menuToRender = adminNav;

  return (
    <Box
      sx={{
        display: { md: "flex", xs: "block", sm: "block" },
        backgroundColor: currentTheme ? "#FFFFFF" : undefined
      }}
      width="100%"
    >
      <CssBaseline />

      {menuToRender.length > 0 && (
        <Drawer variant="permanent" open={open}>
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
                          bgcolor: "#fff"
                        }}
                      >
                        <img
                          src={logo}
                          alt="EasyPlug Logo"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: { xs: "none", sm: "block" } }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          background: gradientPrimary,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent"
                        }}
                      >
                        EasyPlug
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          display: { xs: "none", md: "block" }
                        }}
                      >
                        Connect Locally
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
                      centerRipple
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? "initial" : "center",
                        px: open ? 2.5 : 0,
                        py: open ? undefined : 0,
                        bgcolor: isActive ? undefined : "transparent",
                        backgroundImage: isActive ? gradientPrimary : "none",
                        color: isActive ? "#fff" : undefined,
                        borderRadius: 2,
                        margin: open ? "0 8px" : "0 auto",
                        width: open ? "auto" : 56,
                        height: open ? "auto" : 56,
                        "&:hover": {
                          bgcolor: isActive ? undefined : "transparent"
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          color: isActive
                            ? "#fff"
                            : currentTheme
                            ? "#333"
                            : "#fff",
                          borderRadius: open ? 2 : 3,
                          padding: 0,
                          width: open ? "auto" : 56,
                          height: open ? "auto" : 56,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: open ? 0 : "auto",
                          bgcolor: "transparent",
                          backgroundImage:
                            !open && isActive ? gradientPrimary : "none"
                        }}
                      >
                        {/* Badge logic: when collapsed show circular badge on icon; when open, show badge next to text for notifications */}
                        {(!open && showNotificationBadge) ||
                        (!open && showMessageBadge) ? (
                          <Badge
                            color="error"
                            overlap="circular"
                            badgeContent={
                              showNotificationBadge
                                ? notificationsCount
                                : messagesCount
                            }
                            invisible={
                              !(showNotificationBadge
                                ? notificationsCount
                                : messagesCount)
                            }
                            anchorOrigin={{
                              vertical: "top",
                              horizontal: "right"
                            }}
                            sx={{
                              "& .MuiBadge-badge": {
                                right: 0,
                                top: 0,
                                fontSize: 9,
                                height: 16,
                                minWidth: 16,
                                px: 0.5
                              }
                            }}
                          >
                            <IconComponent fontSize="medium" />
                          </Badge>
                        ) : (
                          <IconComponent fontSize="medium" />
                        )}
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          showNotificationBadge && open ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75
                              }}
                            >
                              <span>{listItem.title}</span>
                              {open && (
                                <Badge
                                  color="error"
                                  badgeContent={notificationsCount}
                                  invisible={!notificationsCount}
                                  sx={{
                                    "& .MuiBadge-badge": {
                                      right: -6,
                                      top: 0,
                                      fontSize: 9,
                                      height: 16,
                                      minWidth: 16,
                                      px: 0.5
                                    }
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
                          fontSize: 10
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            <Box
              sx={{
                p: 1.5,
                borderTop: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "light" ? "#eee" : "#2a2a2a"
                  }`,
                display: "flex",
                flexDirection: open ? "row" : "column",
                alignItems: "center",
                justifyContent: open ? "space-between" : "center",
                gap: open ? 1 : 0.5
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

      <Main open={open}>
        <Outlet />
      </Main>
    </Box>
  );
}
