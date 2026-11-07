import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMeQuery } from "./app/api.js";
import { setUser } from "./features/auth/authSlice.js";
import { useProactiveRefresh } from "./hooks/useProactiveRefresh.js";
import LandingPage from "./pages/public/LandingPage.jsx";
import RegisterPage from "./pages/public/RegisterPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import DashboardPage from "./pages/student/DashboardPage.jsx";
import MenuPage from "./pages/student/MenuPage.jsx";
import BillsPage from "./pages/student/BillsPage.jsx";
import AttendancePage from "./pages/student/AttendancePage.jsx";
import ComplaintsPage from "./pages/student/ComplaintsPage.jsx";
import RefundRequestPage from "./pages/student/RefundRequestPage.jsx";
import FeedbackPage from "./pages/student/FeedbackPage.jsx";
import UsersPage from "./pages/admin/UsersPage.jsx";
import AnnouncementsPage from "./pages/admin/AnnouncementsPage.jsx";
import AdminComplaintsPage from "./pages/admin/AdminComplaintsPage.jsx";
import InventoryRequestsPage from "./pages/admin/InventoryRequestsPage.jsx";
import MenuHistoryPage from "./pages/admin/MenuHistoryPage.jsx";
import MenuFormPage from "./pages/admin/MenuFormPage.jsx";
import TransactionsPage from "./pages/admin/TransactionsPage.jsx";
import ScanPage from "./pages/staff/ScanPage.jsx";
import WastagePage from "./pages/staff/WastagePage.jsx";
import RequestInventoryPage from "./pages/staff/RequestInventoryPage.jsx";
import LeavePage from "./pages/staff/LeavePage.jsx";
import AnalyticsPage from "./pages/warden/AnalyticsPage.jsx";

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const hydrated = useSelector((s) => s.auth.hydrated);
  const { data } = useMeQuery();

  useProactiveRefresh();

  useEffect(() => { if (data?.data?.user) dispatch(setUser(data.data.user)); }, [data, dispatch]);

  if (!hydrated) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f8f7" }}>
        <div style={{ color: "#64748b", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/refunds" element={<RefundRequestPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/wastage" element={<WastagePage />} />
        <Route path="/staff/leaves" element={<LeavePage />} />
        <Route path="/staff/request-inventory" element={<RequestInventoryPage />} />
        <Route path="/inventory-requests" element={<InventoryRequestsPage />} />
        <Route path="/admin/menus" element={<MenuHistoryPage />} />
        <Route path="/admin/menus/new" element={<MenuFormPage />} />
        <Route path="/admin/menus/:id" element={<MenuFormPage />} />
        <Route path="/admin/transactions" element={<TransactionsPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
        <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
        <Route path="/warden/analytics" element={<AnalyticsPage />} />
      </Route>

      <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
    </Routes>
  );
}