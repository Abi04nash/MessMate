import { useFeedbackStatsQuery, useAllFeedbackQuery, useWastageStatsQuery } from "../../app/api.js";
import { Star, MessageSquare, TrendingDown } from "lucide-react";

export default function AnalyticsPage() {
  const { data: fbData } = useFeedbackStatsQuery();
  const { data: fbListData } = useAllFeedbackQuery({});
  const { data: wstData } = useWastageStatsQuery();

  const stats = fbData?.data?.stats || {};
  const responses = stats.count || 0;
  const recentFeedback = (fbListData?.data?.feedback || []).slice(0, 5);
  const wastage = wstData?.data?.stats || [];

  return (
    <div className="page">
      <header className="page-header">
        <h1>Institutional Analytics</h1>
        <p className="muted">Student feedback and food wastage across the mess</p>
      </header>

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Student feedback</h2>

        {responses === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <MessageSquare size={32} color="#64748b" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ margin: "0 0 6px" }}>No feedback yet</h3>
            <p className="muted" style={{ margin: "0 auto", maxWidth: 460, fontSize: 13 }}>
              Students rate meals after attending them. Once ratings come in, average scores appear here.
            </p>
            <ol style={{ textAlign: "left", maxWidth: 320, margin: "16px auto 0", paddingLeft: 20, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
              <li>Staff marks students present at a meal</li>
              <li>Students see the meal in their Feedback page</li>
              <li>They rate taste, quality, hygiene, quantity, overall</li>
            </ol>
          </div>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat-card" style={{ borderLeft: "3px solid #0e7c66" }}>
                <span>Overall</span>
                <strong>{(stats.overall || 0).toFixed(1)}</strong>
                <small>{responses} response{responses !== 1 ? "s" : ""}</small>
              </div>
              <div className="stat-card">
                <span>Taste</span>
                <strong>{(stats.taste || 0).toFixed(1)}</strong>
              </div>
              <div className="stat-card">
                <span>Quality</span>
                <strong>{(stats.quality || 0).toFixed(1)}</strong>
              </div>
              <div className="stat-card">
                <span>Hygiene</span>
                <strong>{(stats.hygiene || 0).toFixed(1)}</strong>
              </div>
              <div className="stat-card">
                <span>Quantity</span>
                <strong>{(stats.quantity || 0).toFixed(1)}</strong>
              </div>
            </div>

            {recentFeedback.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b" }}>
                  Recent comments
                </h3>
                <div className="list">
                  {recentFeedback.map(f => (
                    <div key={f._id} className="card" style={{ marginBottom: 10, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: 13 }}>{f.user?.name || "Student"}</strong>
                          <span className="muted" style={{ fontSize: 12, marginLeft: 8, textTransform: "capitalize" }}>
                            {f.session?.category || "meal"}
                          </span>
                          <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
                            {f.createdAt && new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#a06800", fontWeight: 700, fontSize: 13, background: "rgba(245,185,66,0.12)", padding: "3px 8px", borderRadius: 6 }}>
                          <Star size={12} fill="#a06800" /> {f.overall}/5
                        </div>
                      </div>
                      {f.comment && <p style={{ margin: "6px 0 0", fontSize: 13, color: "#475569" }}>{f.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Food wastage</h2>
        {wastage.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <TrendingDown size={32} color="#64748b" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ margin: "0 0 6px" }}>No wastage recorded yet</h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Staff can log wastage from the Wastage page after serving.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Reason</th><th>Count</th><th>Total Quantity</th><th>Estimated Cost</th></tr></thead>
              <tbody>
                {wastage.map(w => (
                  <tr key={w._id}>
                    <td style={{ textTransform: "capitalize", fontWeight: 600 }}>{w._id}</td>
                    <td>{w.count}</td>
                    <td>{w.totalQty}</td>
                    <td>Rs. {w.totalCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}