import { useState } from "react";
import { Link } from "react-router-dom";
import { useMeQuery, useTodayMenuQuery, useListAnnouncementsQuery, useUpcomingMenusQuery, useRunningBillQuery } from "../../app/api.js";
import { Megaphone, Clock, Calendar, ArrowRight, ChevronLeft, ChevronRight, Egg, Utensils, Cookie, Moon } from "lucide-react";

const VISUALS = {
  breakfast: { bg: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)", color: "#78350f", Icon: Egg },
  lunch: { bg: "linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)", color: "#065f46", Icon: Utensils },
  snacks: { bg: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)", color: "#1e3a8a", Icon: Cookie },
  dinner: { bg: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)", color: "#4c1d95", Icon: Moon }
};

export default function DashboardPage() {
  const [upcomingPage, setUpcomingPage] = useState(1);
  const { data: me } = useMeQuery();
  const { data: today, isLoading } = useTodayMenuQuery();
  const { data: annData } = useListAnnouncementsQuery();
  const { data: upcomingData } = useUpcomingMenusQuery({ page: upcomingPage, limit: 3, days: 30 });
  const { data: runningData } = useRunningBillQuery(undefined, { skip: me?.data?.user?.role !== "student" });

  const user = me?.data?.user;
  const ctx = user?.context || {};
  const sessions = today?.data?.sessions || [];
  const announcements = (annData?.data?.announcements || []).slice(0, 2);
  const upcoming = upcomingData?.data?.menus || [];
  const upcomingMeta = upcomingData?.meta || { page: 1, pages: 0, total: 0 };
  const runningBill = runningData?.data?.bill;

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "mess_admin" || user?.role === "warden";

  return (
    <div className="page">
      <header className="page-header">
        <h1>Welcome, {user?.name?.split(" ")[0] || "there"}</h1>
        <p className="muted">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {user?.hostel && <> - {user.hostel.name} - Room {user.roomNumber}</>}
        </p>
      </header>

      {isStudent && (
        <section className="stat-grid">
          <div className="stat-card" style={{ borderLeft: "3px solid #0e7c66" }}>
            <span>This month (live)</span>
            <strong>Rs. {runningBill?.total ?? 0}</strong>
            <small>Updates on every registration</small>
          </div>
          <div className="stat-card">
            <span>Meals this month</span>
            <strong>{ctx.attendanceThisMonth ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Notifications</span>
            <strong>{ctx.unreadNotifications ?? 0}</strong>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="stat-grid">
          <div className="stat-card"><span>Quick action</span><Link to="/admin/menus/new" style={{ fontSize: 14, color: "#0e7c66", fontWeight: 600, marginTop: 6, display: "block" }}>Create menu <ArrowRight size={12} style={{ display: "inline" }} /></Link></div>
          <div className="stat-card"><span>Menu history</span><Link to="/admin/menus" style={{ fontSize: 14, color: "#0e7c66", fontWeight: 600, marginTop: 6, display: "block" }}>All menus <ArrowRight size={12} style={{ display: "inline" }} /></Link></div>
          
        </section>
      )}

      <section>
        <h2>{isStudent ? "Today's meals" : "Today's menu"}</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : sessions.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 24 }}>
            <p className="muted" style={{ margin: 0 }}>No menu published for today.</p>
            {isAdmin && (
              <Link to="/admin/menus/new" className="btn-small" style={{ textDecoration: "none", marginTop: 10, display: "inline-block" }}>Create a menu</Link>
            )}
          </div>
        ) : (
          <div className="meal-grid">
            {sessions.map((s) => {
              const visual = VISUALS[s.category] || VISUALS.lunch;
              return (
                <div key={s._id} className="meal-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div className="meal-card-visual" style={{ background: visual.bg }}>
                    <visual.Icon size={40} color={visual.color} strokeWidth={1.5} />
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ textTransform: "capitalize", margin: "0 0 4px" }}>{s.category}</h3>
                    <p className="muted meal-time" style={{ margin: "0 0 8px" }}><Clock size={13} /> {s.startTime} - {s.endTime}</p>
                    {s.items && s.items.length > 0 && (
                      <ul className="meal-items">
                        {s.items.slice(0, 3).map((item, i) => <li key={i}>{item.name}</li>)}
                        {s.items.length > 3 && <li className="muted">+{s.items.length - 3} more</li>}
                      </ul>
                    )}
                    {isStudent && (
                      <span className={"pill " + (s.myRegistration?.status === "registered" || s.myRegistration?.status === "attended" ? "pill-green" : "pill-muted")}>
                        {s.myRegistration?.status === "attended" ? "Attended" : s.myRegistration?.status === "registered" ? "Registered" : "Not registered"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isStudent && upcoming.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ margin: 0 }}><Calendar size={20} style={{ display: "inline", verticalAlign: "middle" }} /> Upcoming menus</h2>
              <p className="muted" style={{ marginTop: 4, marginBottom: 12 }}>Register for future meals before the cutoff</p>
            </div>
            <Link to="/menu" className="btn-small" style={{ textDecoration: "none" }}>Register now</Link>
          </div>
          <div className="list">
            {upcoming.map((m) => {
              const totalItems = (m.meals || []).reduce((sum, meal) => sum + (meal.items?.length || 0), 0);
              const isTodayMenu = new Date(m.date).toDateString() === new Date().toDateString();
              return (
                <div key={m._id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: 15 }}>
                        {new Date(m.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                        {isTodayMenu && <span className="pill pill-green" style={{ marginLeft: 8 }}>Today</span>}
                      </h3>
                      <p className="muted" style={{ margin: "4px 0", fontSize: 13 }}>
                        {(m.sessions || []).map((s) => s.category).join(" / ")} - {totalItems} items
                      </p>
                    </div>
                    <Link to="/menu" className="btn-small" style={{ textDecoration: "none" }}>View</Link>
                  </div>
                </div>
              );
            })}
          </div>
          {upcomingMeta.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
              <button className="btn-small" disabled={upcomingPage <= 1} onClick={() => setUpcomingPage(upcomingPage - 1)}><ChevronLeft size={14} /></button>
              <span style={{ fontSize: 13, color: "#64748b" }}>{upcomingMeta.page} / {upcomingMeta.pages}</span>
              <button className="btn-small" disabled={upcomingPage >= upcomingMeta.pages} onClick={() => setUpcomingPage(upcomingPage + 1)}><ChevronRight size={14} /></button>
            </div>
          )}
        </section>
      )}

      {announcements.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2><Megaphone size={20} style={{ display: "inline", verticalAlign: "middle" }} /> Announcements</h2>
          <div className="list">
            {announcements.map((a) => (
              <div key={a._id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 15 }}>{a.title}</h3>
                  <span className={"pill " + (a.priority === "urgent" || a.priority === "high" ? "pill-amber" : "pill-muted")}>{a.priority || "normal"}</span>
                </div>
                <p style={{ margin: "6px 0", fontSize: 14 }}>{a.body}</p>
                <p className="muted" style={{ margin: 0, fontSize: 12 }}>{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}