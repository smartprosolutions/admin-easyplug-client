import { CssBaseline, ThemeProvider } from "@mui/material";
import * as React from "react";
import Navigation from "./components/navigations/Navigation";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  Navigate,
} from "react-router-dom";
import { lightTheme, darkTheme } from "./theme/theme";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Advertisements from "./pages/Advertisements";
import AdvertisementDetails from "./pages/AdvertisementDetails";
import InventoryModal from "./components/modals/InventoryModal";
import ListingAdvModal from "./components/modals/ListingAdvModal";
import NotFound from "./pages/NotFound";
import Transactions from "./pages/Transactions";
import UserManagement from "./pages/UserManagement";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import LoginUser from "./pages/auth/LoginUser";
import RegisterUser from "./pages/auth/RegisterUser";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import PublicRoute from "./components/route/PublicRoute";
import PrivateRoute from "./components/route/PrivateRoute";
import RoleRoute from "./components/route/RoleRoute";
import { useEffect, useState } from "react";
import { UnreadCountsProvider } from "./context/UnreadCountsContext";

const THEME_STORAGE_KEY = "admin_easyplug_theme_mode";

const getStoredThemeMode = () => {
  try {
    const rawValue = localStorage.getItem(THEME_STORAGE_KEY);
    if (rawValue === "dark") return false;
    if (rawValue === "light") return true;
    if (rawValue === "false") return false;
    if (rawValue === "true") return true;
  } catch {
    // Ignore storage access errors and use default theme mode.
  }
  return true;
};

const App = () => {
  const [themeMode, setThemeMode] = useState(getStoredThemeMode); // true => light, false => dark
  const theme = themeMode ? lightTheme : darkTheme;

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode ? "light" : "dark");
    } catch {
      // Ignore storage write errors.
    }
  }, [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <UnreadCountsProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginUser />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterUser />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Navigation
                    currentTheme={themeMode}
                    setThemeMode={setThemeMode}
                    theme={theme}
                  />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <RoleRoute allow={["admin", "seller"]} fallbackTo="/inventory">
                    <Dashboard />
                  </RoleRoute>
                }
              />
              <Route path="inventory" element={<Inventory />}>
                <Route path="add" element={<InventoryModal />} />
                <Route path=":id/edit" element={<InventoryModal />} />
              </Route>
              <Route path="advertisements" element={<Advertisements />}>
                <Route path="add" element={<ListingAdvModal />} />
                <Route path=":id/edit" element={<ListingAdvModal />} />
              </Route>
              <Route
                path="advertisements/:id"
                element={<AdvertisementDetails />}
              />
              <Route
                path="subscriptions/*"
                element={<Navigate to="/inventory" replace />}
              />
              <Route
                path="transactions"
                element={
                  <RoleRoute allow={["admin"]} fallbackTo="/inventory">
                    <Transactions />
                  </RoleRoute>
                }
              />
              <Route path="messages" element={<Messages />} />
              <Route
                path="profile"
                element={
                  <Profile
                    currentTheme={themeMode}
                    setThemeMode={setThemeMode}
                  />
                }
              />
              <Route
                path="userManagement"
                element={
                  <RoleRoute allow={["admin"]} fallbackTo="/inventory">
                    <UserManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="sellers"
                element={
                  <RoleRoute allow={["admin"]} fallbackTo="/inventory">
                    <Navigate to="/userManagement" replace />
                  </RoleRoute>
                }
              />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UnreadCountsProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
