import { useState } from "react";
import { useSelector } from "react-redux";
import { useUpcomingMenusQuery, useRegisterMealMutation, useCancelRegistrationMutation, useMyRegistrationsQuery } from "../../app/api.js";
import { toast } from "sonner";
import { Clock, Leaf, Flame, ChevronLeft, ChevronRight, Egg, Utensils, Cookie, Moon, CheckCircle2, Building2 } from "lucide-react";

const VISUALS = {
  breakfast: { bg: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)", color: "#78350f", Icon: Egg },
  lunch: { bg: "linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)", color: "#065f46", Icon: Utensils },
  snacks: { bg: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)", color: "#1e3a8a", Icon: Cookie },
  dinner: { bg: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)", color: "#4c1d95", Icon: Moon }
};

const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", snacks: "Snacks", dinner: "Dinner" };

export default function MenuPage() {
  const user = useSelector((s) => s.auth.user);
  const isGroundFloor = user?.messSystem === "ground_floor";
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useUpcomingMenusQuery({ page, limit: 3, days: 30 });
  const { data: regData, refetch: refetchRegs } = useMyRegistrationsQuery();
  const [register] = useRegisterMealMutation();
  const [cancel] = useCancelRegistrationMutation();
  const [busy, setBusy] = useState(null);

  const menus = data?.data?.menus || [];
  const meta = data?.meta || { page: 1, pages: 0, total: 0 };
  const allRegs = regData?.data?.registrations || [];

  // Extract meals included in GF plan from any myRegistration that has isGroundFloor
  const gfMeals = (() => {
    if (!isGroundFloor) return [];
    const meals = new Set();
    for (const menu of menus) {
      for (const s of menu.sessions || []) {
        if (s.myRegistration?.isGroundFloor && s.myRegistration?.status === "registered") {
          meals.add(s.category);
        }
      }
    }
    return [...meals];
  })();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingRegistered = allRegs.filter((r) => {
    const sessionDate = r.session?.date ? new Date(r.session.date) : new Date(r.date);
    sessionDate.setHours(0, 0, 0, 0);
    return r.status === "registered" && sessionDate >= today;
  });

  const handleRegister = async (sessionId) => {
    setBusy(sessionId);
    try {
      await register({ sessionId }).unwrap();
      toast.success("Registered. Amount added to bill.");
      await Promise.all([refetch(), refetchRegs()]);
    } catch (err) {
      toast.error(err?.data?.message || "Registration failed");
    } finally { setBusy(null); }
  };

  const handleCancel = async (registrationId) => {
    if (!confirm("Cancel this meal registration?")) return;
    setBusy(registrationId);
    try {
      await cancel(registrationId).unwrap();
      toast.success("Cancelled");
      await Promise.all([refetch(), refetchRegs()]);
    } catch (err) {
      toast.error(err?.data?.message || "Cancellation failed");
    } finally { setBusy(null); }
  };

  const isToday = (date) => new Date(date).toDateString() === new Date().toDateString();
  const isTomorrow = (date) => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return new Date(date).toDateString() === t.toDateString();
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>{isGroundFloor ? "Menu - Semester Plan" : "Menu & Registration"}</h1>
        <p className="muted">
          {isGroundFloor
            ? "Your meals are pre-registered as part of your semester plan. Just show up to eat."
            : "Register before cutoff. Cancel any time before the cancellation window."}
        </p>
      </header>

      {isGroundFloor && gfMeals.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderLeft: "3px solid #a06800", background: "rgba(245,185,66,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Building2 size={18} color="#a06800" />
            <strong style={{ fontSize: 14, color: "#a06800" }}>Ground Floor Semester Plan</strong>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
            You are pre-registered for: <strong>{gfMeals.map((m) => MEAL_LABELS[m] || m).join(", ")}</strong> - every day of the semester.
          </p>
        </div>
      )}

      {!isGroundFloor && upcomingRegistered.length > 0 && (
        <div className="card" style={{ marginBottom: 24, borderLeft: "3px solid #0e7c66", background: "rgba(14,124,102,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <CheckCircle2 size={18} color="#0e7c66" />
            <h3 style={{ margin: 0, fontSize: 15 }}>Your registered meals ({upcomingRegistered.length})</h3>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {upcomingRegistered.map((r) => {
              const sessionDate = r.session?.date ? new Date(r.session.date) : new Date(r.date);
              return (
                <div key={r._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "white", borderRadius: 8, border: "1px solid #e2e8e6", fontSize: 13 }}>
                  <div>
                    <strong style={{ textTransform: "capitalize" }}>{r.session?.category || "meal"}</strong>
                    <span style={{ color: "#64748b", marginLeft: 8 }}>
                      {sessionDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "#0e7c66", fontWeight: 600 }}>
                    {r.session?.startTime && r.session?.endTime ? `${r.session.startTime} - ${r.session.endTime}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? <p>Loading...</p> : menus.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">No menus published yet. The admin will publish upcoming menus.</p>
        </div>
      ) : (
        <>
          {menus.map((menu) => (
            <section key={menu._id} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>
                  {new Date(menu.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </h2>
                {isToday(menu.date) && <span className="pill pill-green">Today</span>}
                {isTomorrow(menu.date) && <span className="pill pill-amber">Tomorrow</span>}
              </div>

              <div className="meal-grid">
                {menu.sessions.map((s) => {
                  const isGfReg = s.myRegistration?.isGroundFloor === true && s.myRegistration?.status === "registered";
                  const isReg = s.myRegistration?.status === "registered";
                  const isAttended = s.myRegistration?.status === "attended";
                  const isEnrolledMeal = isGroundFloor && (isGfReg || isAttended);
                  const visual = VISUALS[s.category] || VISUALS.lunch;

                  return (
                    <div key={s._id} className="meal-card" style={{ padding: 0, overflow: "hidden" }}>
                      <div className="meal-card-visual" style={{ background: visual.bg }}>
                        <visual.Icon size={40} color={visual.color} strokeWidth={1.5} />
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <h3 style={{ textTransform: "capitalize", margin: 0 }}>{s.category}</h3>
                          {!isGroundFloor && (
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#0b1f3a" }}>Rs. {s.unitPrice}</span>
                          )}
                          {isGroundFloor && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#a06800" }}>IN PLAN</span>
                          )}
                        </div>
                        <p className="muted meal-time"><Clock size={13} /> {s.startTime} - {s.endTime}</p>
                        {s.items && s.items.length > 0 && (
                          <ul className="meal-items">
                            {s.items.map((item, i) => (
                              <li key={i}>
                                {item.dietary === "veg" && <Leaf size={12} color="#0e7c66" />}
                                {item.dietary === "non_veg" && <Flame size={12} color="#dc2626" />}
                                <span>{item.name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="meal-status-row">
                          {isAttended ? <span className="pill pill-green">Attended</span>
                            : isGfReg ? <span className="pill pill-green">Registered (Semester Plan)</span>
                            : isReg ? <span className="pill pill-green">Registered</span>
                            : s.registrationOpen ? <span className="pill pill-muted">Open</span>
                            : <span className="pill pill-amber">Closed</span>}
                        </div>

                        {/* 1st floor actions */}
                        {!isGroundFloor && isReg && !isAttended && s.cancellationOpen && (
                          <button className="btn" style={{ background: "#dc2626" }} disabled={busy === s.myRegistration._id} onClick={() => handleCancel(s.myRegistration._id)}>
                            {busy === s.myRegistration._id ? "Cancelling..." : "Cancel Registration"}
                          </button>
                        )}
                        {!isGroundFloor && !isReg && !isAttended && s.registrationOpen && (
                          <button className="btn" disabled={busy === s._id} onClick={() => handleRegister(s._id)}>
                            {busy === s._id ? "Registering..." : `Register (Rs. ${s.unitPrice})`}
                          </button>
                        )}
                        {!isGroundFloor && !isReg && !isAttended && !s.registrationOpen && (
                          <p className="meal-cutoff-note">Closed</p>
                        )}

                        {/* Ground floor: not in plan */}
                        {isGroundFloor && !isEnrolledMeal && (
                          <p className="meal-cutoff-note" style={{ color: "#a06800" }}>
                            Not in your semester plan
                          </p>
                        )}

                        {/* Ground floor: enrolled */}
                        {isGroundFloor && isEnrolledMeal && !isAttended && (
                          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#0e7c66", fontStyle: "italic" }}>
                            Prepaid - no action needed
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {meta.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <button className="btn-small" disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: 13, color: "#64748b" }}>Page {meta.page} of {meta.pages} ({meta.total} days)</span>
              <button className="btn-small" disabled={page >= meta.pages} onClick={() => setPage(page + 1)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}