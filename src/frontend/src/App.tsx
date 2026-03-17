import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { getHostSession, isAdmin, isAuthenticated } from "./lib/auth";
import BannersPage from "./pages/Banners";
import DashboardPage from "./pages/Dashboard";
import DepositsPage from "./pages/Deposits";
import HostDashboard from "./pages/HostDashboard";
import HostLayout from "./pages/HostLayout";
import HostsPage from "./pages/Hosts";
import LoginPage from "./pages/Login";
import QRCodePage from "./pages/QRCode";
import SplashPage from "./pages/SplashScreen";
import SupportPage from "./pages/Support";
import TournamentsPage from "./pages/Tournaments";
import UsersPage from "./pages/Users";
import WithdrawalsPage from "./pages/Withdrawals";

function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdmin()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function HostRoute({ children }: { children: React.ReactNode }) {
  if (!getHostSession()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  if (isAdmin()) return <Navigate to="/admin" replace />;
  if (getHostSession()) return <Navigate to="/host" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="deposits" element={<DepositsPage />} />
          <Route path="withdrawals" element={<WithdrawalsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="hosts" element={<HostsPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="qrcode" element={<QRCodePage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="splash" element={<SplashPage />} />
        </Route>

        {/* Host routes */}
        <Route
          path="/host"
          element={
            <HostRoute>
              <HostLayout />
            </HostRoute>
          }
        >
          <Route index element={<HostDashboard />} />
        </Route>

        {/* Legacy redirect: old "/" path */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}
