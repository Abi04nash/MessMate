import { useMemo } from "react";
import { useMyAttendanceQuery } from "../../app/api.js";
import { Calendar, CheckCircle2 } from "lucide-react";

export default function AttendancePage() {
  const { data, isLoading } = useMyAttendanceQuery();
  const records = data?.data?.attendance || [];

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = records.filter((r) => new Date(r.attendedAt) >= monthStart).length;
    const totalMeals = records.length;
    const streak = (() => {
      let count = 0;
      const sorted = [...records].sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt));
      for (const r of sorted) {
        const d = new Date(r.attendedAt);
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff <= count + 1) count++;
        else break;
      }
      return count;
    })();
    return { thisMonth, totalMeals, streak };
  }, [records]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Attendance History</h1>
        <p className="muted">Every meal you have attended at the mess</p>
      </header>

      <section className="stat-grid">
        <div className="stat-card">
          <span>Total meals</span>
          <strong>{stats.totalMeals}</strong>
          <small>All time</small>
        </div>
        <div className="stat-card">
          <span>This month</span>
          <strong>{stats.thisMonth}</strong>
          <small>{new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}</small>
        </div>
        <div className="stat-card">
          <span>Active streak</span>
          <strong>{stats.streak}</strong>
          <small>Consecutive days</small>
        </div>
      </section>

      {isLoading ? <p>Loading...</p> : records.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <CheckCircle2 size={36} color="#0e7c66" style={{ margin: "0 auto 12px" }} />
          <p className="muted">No attendance records yet. Register for a meal and check in at the counter.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Meal</th>
                <th>Time</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={13} color="#64748b" />
                      {new Date(r.attendedAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </td>
                  <td style={{ textTransform: "capitalize", fontWeight: 600 }}>{r.session?.category || "-"}</td>
                  <td>{new Date(r.attendedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td><span className="pill pill-muted">{r.method}</span></td>
                  <td><span className="pill pill-green">Present</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}