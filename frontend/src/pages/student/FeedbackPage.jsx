import { useState } from "react";
import { useMyAttendanceQuery, useMyFeedbackQuery, useSubmitFeedbackMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Star, MessageSquarePlus, CheckCircle2, X } from "lucide-react";

const RATING_FIELDS = [
  { key: "taste", label: "Taste" },
  { key: "quality", label: "Quality" },
  { key: "hygiene", label: "Hygiene" },
  { key: "quantity", label: "Quantity" },
  { key: "overall", label: "Overall" }
];

function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: 2, color: n <= value ? "#f5b942" : "#cbd5e1",
            transition: "transform 0.1s"
          }}
        >
          <Star size={24} fill={n <= value ? "#f5b942" : "none"} stroke={n <= value ? "#f5b942" : "#cbd5e1"} />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { data: attData, isLoading: loadingAtt } = useMyAttendanceQuery();
  const { data: fbData, refetch: refetchFb } = useMyFeedbackQuery();
  const [submit, { isLoading: submitting }] = useSubmitFeedbackMutation();

  const [rating, setRating] = useState(null);
  const [form, setForm] = useState({ taste: 5, quality: 5, hygiene: 5, quantity: 5, overall: 5, comment: "" });

  const attendance = attData?.data?.attendance || [];
  const feedback = fbData?.data?.feedback || [];

  const feedbackBySession = new Map(
    feedback.map(f => [String(f.session), f])
  );

  const pending = attendance.filter(a => {
    const sid = String(a.session?._id || a.session);
    return sid && !feedbackBySession.has(sid);
  });

  const rated = feedback.map(f => {
    const att = attendance.find(a => String(a.session?._id || a.session) === String(f.session));
    return { ...f, attendance: att };
  });

  const openRate = (att) => {
    setRating(att);
    setForm({ taste: 5, quality: 5, hygiene: 5, quantity: 5, overall: 5, comment: "" });
  };

  const handleSubmit = async () => {
    if (!rating) return;
    const sessionId = rating.session?._id || rating.session;
    if (!sessionId) return toast.error("Cannot submit - session missing");
    try {
      await submit({ sessionId, ...form }).unwrap();
      toast.success("Thank you for your feedback");
      setRating(null);
      refetchFb();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit");
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Feedback</h1>
        <p className="muted">Rate meals you have attended - helps the mess improve</p>
      </header>

      <section className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <span>Meals attended</span>
          <strong>{attendance.length}</strong>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid #f5b942" }}>
          <span>Pending rating</span>
          <strong>{pending.length}</strong>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid #0e7c66" }}>
          <span>Rated</span>
          <strong>{rated.length}</strong>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16 }}>Rate your meals</h2>
        {loadingAtt ? <p>Loading...</p> : pending.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 30 }}>
            <CheckCircle2 size={28} color="#0e7c66" style={{ margin: "0 auto 8px" }} />
            <p className="muted" style={{ margin: 0 }}>
              {attendance.length === 0
                ? "Attend a meal first (staff marks you present), then you can rate it here."
                : "You have rated all your attended meals. Well done!"}
            </p>
          </div>
        ) : (
          <div className="list">
            {pending.slice(0, 10).map(a => {
              const sessionDate = new Date(a.date || a.attendedAt);
              return (
                <div key={a._id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, textTransform: "capitalize" }}>
                        {a.session?.category || "Meal"}
                      </h3>
                      <p className="muted" style={{ margin: "2px 0 0", fontSize: 12 }}>
                        {sessionDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        {a.attendedAt && " - " + new Date(a.attendedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button className="btn-primary" onClick={() => openRate(a)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", fontSize: 13 }}>
                      <MessageSquarePlus size={14} /> Rate now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {rated.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16 }}>Your past ratings</h2>
          <div className="list">
            {rated.map(f => (
              <div key={f._id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ margin: 0, fontSize: 14, textTransform: "capitalize" }}>
                      {f.attendance?.session?.category || "Meal"}
                    </h3>
                    <p className="muted" style={{ margin: "2px 0", fontSize: 12 }}>
                      {f.attendance?.date && new Date(f.attendance.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "#64748b", flexWrap: "wrap" }}>
                      <span>Taste: {f.taste}/5</span>
                      <span>Quality: {f.quality}/5</span>
                      <span>Hygiene: {f.hygiene}/5</span>
                      <span>Qty: {f.quantity}/5</span>
                    </div>
                    {f.comment && <p style={{ margin: "8px 0 0", fontSize: 13, fontStyle: "italic" }}>"{f.comment}"</p>}
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "6px 12px", background: "rgba(245,185,66,0.15)", borderRadius: 8, color: "#a06800", fontWeight: 700, fontSize: 14 }}>
                    <Star size={14} fill="#a06800" /> {f.overall}/5
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {rating && (
        <div className="modal-overlay" onClick={() => !submitting && setRating(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 8 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, textTransform: "capitalize" }}>
                  Rate {rating.session?.category || "meal"}
                </h2>
                <p className="muted" style={{ margin: "2px 0 0", fontSize: 12 }}>
                  {new Date(rating.date || rating.attendedAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              </div>
              <button onClick={() => !submitting && setRating(null)} disabled={submitting} style={{ background: "transparent", border: "none", cursor: submitting ? "not-allowed" : "pointer", padding: 6 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {RATING_FIELDS.map(({ key, label }) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0b1f3a" }}>{label}</span>
                  <StarPicker value={form[key]} onChange={(v) => setForm({ ...form, [key]: v })} />
                </div>
              ))}
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.5 }}>
                  Comment (optional)
                </span>
                <textarea
                  rows="3"
                  value={form.comment}
                  onChange={e => setForm({ ...form, comment: e.target.value })}
                  placeholder="What did you think of the food?"
                  style={{ padding: "10px 12px", border: "1px solid #e2e8e6", borderRadius: 8, font: "inherit", resize: "vertical" }}
                  disabled={submitting}
                />
              </label>
            </div>

            <button className="btn-primary" style={{ width: "100%", padding: 13, marginTop: 18 }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit feedback"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}