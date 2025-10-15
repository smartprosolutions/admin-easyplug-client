import { CssBaseline, ThemeProvider } from "@mui/material";
import * as React from "react";
import Navigation from "./components/navigations/Navigation";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { lightTheme, darkTheme } from "./theme/theme";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Advertisements from "./pages/Advertisements";
import Sellers from "./pages/Sellers";
import Subscriptions from "./pages/Subscriptions";
import SubscriptionModal from "./components/modals/SubscriptionModal";
import InventoryModal from "./components/modals/InventoryModal";
import NotFound from "./pages/NotFound";
import Transactions from "./pages/Transactions";
import UserManagement from "./pages/UserManagement";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import LoginUser from "./pages/auth/LoginUser";
import RegisterUser from "./pages/auth/RegisterUser";
import PublicRoute from "./components/route/PublicRoute";
import PrivateRoute from "./components/route/PrivateRoute";
import { useState } from "react";
// Removed custom prompts; we'll use Google One Tap inline
// no-op
import GoogleOneTap from "./components/auth/GoogleOneTap";

const App = () => {
  const [themeMode, setThemeMode] = useState(true); // true => light, false => dark
  const theme = themeMode ? lightTheme : darkTheme;

  function RouteAwareOneTap() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    if (!clientId) return null;
    return <GoogleOneTap clientId={clientId} />;
  }
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
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
            path="/"
            element={
              <PrivateRoute>
                <Navigation currentTheme={themeMode} setThemeMode={setThemeMode} theme={theme} />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory" element={<Inventory />}>
              <Route path="add" element={<InventoryModal />} />
              <Route path=":id/edit" element={<InventoryModal />} />
            </Route>
            <Route path="advertisements" element={<Advertisements />} />
            <Route path="sellers" element={<Sellers />} />
            <Route path="subscriptions" element={<Subscriptions />}>
              <Route path="add" element={<SubscriptionModal />} />
              <Route path=":id/edit" element={<SubscriptionModal />} />
            </Route>
            <Route path="transactions" element={<Transactions />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<Profile />} />
            <Route path="userManagement" element={<UserManagement />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <RouteAwareOneTap />
      </Router>
    </ThemeProvider>
  );
};

export default App;
