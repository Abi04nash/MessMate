import { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useLogoutMutation } from "../../app/api.js";
import { clearUser } from "../../features/auth/authSlice.js";
import NotificationBell from "./NotificationBell.jsx";
import {
  LayoutDashboard, Utensils, Receipt, MessageSquareWarning, CalendarOff,
  Users, Megaphone, ClipboardList, ScanLine, Trash2, BarChart3, LogOut,
  Menu, X, ListChecks, Send, Inbox, RotateCcw, DollarSign, QrCode, Star, Tag
} from "lucide-react";
import { toast } from "sonner";

function navFor(role) {
  if (role === "student") return [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/menu", label: "Menu", icon: Utensils },
    { to: "/attendance", label: "Attendance", icon: QrCode },
    { to: "/feedback", label: "Feedback", icon: Star },
    { to: "/bills", label: "Bills", icon: Receipt },
    { to: "/refunds", label: "Refund Request", icon: RotateCcw },
    { to: "/complaints", label: "Complaints", icon: MessageSquareWarning }
  ];
  if (role === "staff") return [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/menus", label: "Menu History", icon: ListChecks },
    { to: "/scan", label: "Take Attendance", icon: ScanLine },
    { to: "/wastage", label: "Wastage", icon: Trash2 },
    { to: "/staff/request-inventory", label: "Request Items", icon: Send },
    { to: "/staff/leaves", label: "My Leaves", icon: CalendarOff }
  ];
  if (role === "mess_committee") return [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/menus", label: "Menus", icon: ListChecks },
    { to: "/admin/transactions", label: "Transactions", icon: DollarSign },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/inventory-requests", label: "Stock Requests", icon: Inbox },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { to: "/admin/complaints", label: "Complaints", icon: ClipboardList }
  ];
  // Admin only - has Pricing
  if (role === "admin") return [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/warden/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/menus", label: "Menus", icon: ListChecks },
    { to: "/admin/pricing", label: "Pricing", icon: Tag },
    { to: "/admin/transactions", label: "Transactions", icon: DollarSign },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/inventory-requests", label: "Stock Requests", icon: Inbox },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { to: "/admin/complaints", label: "Complaints", icon: ClipboardList }
  ];
  return [];
}

function roleLabel(role) {
  if (role === "mess_committee") return "Mess Secretary";
  if (role === "admin") return "Admin";
  if (role === "staff") return "Kitchen Staff";
  if (role === "student") return "Student";
  return role || "";
}

export default function AppLayout() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try { await logout().unwrap(); } catch {}
    dispatch(clearUser());
    toast.success("Logged out");
    navigate("/login", { replace: true });
  };

  const items = navFor(user?.role);
  const close = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      <div className="app-mobile-bar">
        <Link to="/dashboard" className="app-mobile-brand">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span>MESSMATE</span>
        </Link>
        <button className="app-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && <div className="app-overlay" onClick={close} />}

      <aside className={"app-sidebar " + (mobileOpen ? "is-open" : "")}>
        <Link to="/dashboard" className="app-brand" onClick={close}>
          <img src="/favicon.svg" alt="" width="32" height="32" />
          <span>MESSMATE</span>
        </Link>

        <div className="app-role-badge">
          <span className={"role-dot role-" + user?.role} />
          <span className="role-label">{roleLabel(user?.role)}</span>
        </div>

        <nav className="app-nav">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/dashboard"} onClick={close}
              className={({ isActive }) => "app-nav-link" + (isActive ? " is-active" : "")}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-user">
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{user?.name}</strong>
            <span>{roleLabel(user?.role)}</span>
          </div>
          <NotificationBell />
          <button onClick={handleLogout} aria-label="Logout" title="Logout"><LogOut size={18} /></button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}