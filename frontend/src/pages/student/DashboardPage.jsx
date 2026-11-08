import { useState } from "react";
import { Link } from "react-router-dom";
import { useMeQuery, useTodayMenuQuery, useListAnnouncementsQuery, useUpcomingMenusQuery, useRunningBillQuery, useGroundFloorInfoQuery } from "../../app/api.js";
import { Megaphone, Clock, Calendar, ArrowRight, Building2, Check, IndianRupee } from "lucide-react";

const VISUALS = {
  breakfast: { bg: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)", color: "#78350f" },
  lunch: { bg: "linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)", color: "#065f46" },
  snacks: { bg: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)", color: "#1e3a8a" },
  dinner: { bg: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)", color: "#4c1d95" }
};

const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", snacks: "Snacks", dinner: "Dinner" };

export default function DashboardPage() {
  const [upcomingPage, setUpcomingPage] = useState(1);
  const { data: me } = useMeQuery();
  const { data: today, isLoading } = useTodayMenuQuery();
  const { data: annData } = useListAnnouncementsQuery();
  const { data: upcomingData } = useUpcomingMenusQuery({ page: upcomingPage, limit: 3, days: 30 });
  const isStudent = me?.data?.user?.role === "student";
  const isGroundFloor = me?.data?.user?.messSystem === "ground_floor";
  const { data: runningData } = useRunningBillQuery(undefined, { skip: !isStudent || isGroundFloor });
  const { data: gfData } = useGroundFloorInfoQuery(undefined, { skip: !isGroundFloor });

  const user = me?.data?.user;
  const ctx = user?.context || {};
  const sessions = today?.data?.sessions || [];
  const announcements = (annData?.data?.announcements || []).slice(0, 2);
  const upcoming = upcomingData?.data?.menus || [];
  const runningBill = runningData?.data?.bill;
  const groundFloor = gfData?.data;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Welcome, {user?.name?.split(" ")[0] || "there"}</h1>
        <p className="muted">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {user?.hostel && <> - {user.hostel.name} - Room {user.roomNumber}</>}
        </p>
      </header>

      {/* Ground floor enrollment card */}
      {isGroundFloor && groundFloor && (
        <div className="card" style={{ marginBottom: 24, borderLeft: "3px solid #a06800", background: "rgba(245,185,66,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Building2 size={20} color="#a06800" />
                <strong style={{ fontSize: 15, color: "#a06800" }}>Ground Floor Semester Plan</strong>
              </div>
              {groundFloor.enrollment ? (
                <>
                  <p style={{ margin: "4px 0", fontSize: 13, color: "#475569" }}>
                    <strong>Meals:</strong> {groundFloor.enrollment.meals.map((m) => MEAL_LABELS[m]).join(", ")}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 13, color: "#475569" }}>
                    <strong>Semester:</strong> {new Date(groundFloor.enrollment.semesterStart).toLocaleDateString("en-IN")} to {new Date(groundFloor.enrollment.semesterEnd).toLocaleDateString("en-IN")}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 13, color: "#475569" }}>
                    <strong>Paid:</strong> <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}><IndianRupee size={12} /> {groundFloor.enrollment.amount}</span>
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 12, color: "#64748b" }}>
                    Enrolled on {new Date(groundFloor.enrollment.paidAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>No active enrollment found. Contact admin.</p>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link to="/ground-floor/enroll" className="btn-primary" style={{ textDecoration: "none", background: "#a06800", padding: "8px 16px", fontSize: 13 }}>
                View Pass
              </Link>
              <Link to="/menu" className="btn-small" style={{ textDecoration: "none", background: "#64748b" }}>
                View menu
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats - 1st floor shows bill, ground floor shows enrollment */}
      {isStudent && !isGroundFloor && (
        <section className="stat-grid">
          <div className="stat-card" style={{ borderLeft: "3px solid #0e7c66" }}>
            <span>This month (live)</span>
            <strong>Rs. {runningBill?.total ?? 0}</strong>
            <small>Updates on registration</small>
          </div>
          <div className="stat-card"><span>Meals this month</span><strong>{ctx.attendanceThisMonth ?? 0}</strong></div>
          <div className="stat-card"><span>Current bill</span><strong>Rs. {ctx.currentBill?.total ?? 0}</strong><small>{ctx.currentBill?.status || "Not generated"}</small></div>
          <div className="stat-card"><span>Notifications</span><strong>{ctx.unreadNotifications ?? 0}</strong></div>
        </section>
      )}

      {/* Today's menu / 1st floor registration panel */}
      {!isGroundFloor && (
        <section>
          <h2>{isStudent ? "Today's meals" : "Today's menu"}</h2>
          {isLoading ? <p>Loading...</p> : sessions.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 24 }}>
              <p className="muted" style={{ margin: 0 }}>No menu published for today.</p>
            </div>
          ) : (
            <div className="meal-grid">
              {sessions.map((s) => {
                const visual = VISUALS[s.category] || VISUALS.lunch;
                return (
                  <div key={s._id} className="meal-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="meal-card-visual" style={{ background: visual.bg }} />
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
      )}

      {/* Upcoming menus - only for 1st floor students */}
      {isStudent && !isGroundFloor && upcoming.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ margin: 0 }}><Calendar size={20} style={{ display: "inline", verticalAlign: "middle" }} /> Upcoming menus</h2>
              <p className="muted" style={{ marginTop: 4, marginBottom: 12 }}>Register for future meals before cutoff</p>
            </div>
            <Link to="/menu" className="btn-small" style={{ textDecoration: "none" }}>Register now</Link>
          </div>
          <div className="list">
            {upcoming.map((m) => {
              const totalItems = (m.meals || []).reduce((sum, meal) => sum + (meal.items?.length || 0), 0);
              return (
                <div key={m._id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: 15 }}>
                        {new Date(m.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
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
          {upcomingData?.meta?.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
              <button className="btn-small" disabled={upcomingPage <= 1} onClick={() => setUpcomingPage(upcomingPage - 1)}>Previous</button>
              <span style={{ fontSize: 13, color: "#64748b" }}>{upcomingData.meta.page} / {upcomingData.meta.pages}</span>
              <button className="btn-small" disabled={upcomingPage >= upcomingData.meta.pages} onClick={() => setUpcomingPage(upcomingPage + 1)}>Next</button>
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