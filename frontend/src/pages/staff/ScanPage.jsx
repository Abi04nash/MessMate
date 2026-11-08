import { useState } from "react";
import { useTodayMenuQuery, useSessionRegistrationsQuery, useManualCheckInMutation } from "../../app/api.js";
import { toast } from "sonner";
import { CheckCircle2, Users, ChevronLeft, Building2 } from "lucide-react";

export default function ScanPage() {
  const { data: todayData, isLoading: loadingSessions } = useTodayMenuQuery();
  const [selectedSession, setSelectedSession] = useState(null);
  const { data: regData, isLoading: loadingRegs, refetch } = useSessionRegistrationsQuery(
    selectedSession?._id,
    { skip: !selectedSession }
  );
  const [markPresent, { isLoading: marking }] = useManualCheckInMutation();
  const [busy, setBusy] = useState(null);

  const sessions = todayData?.data?.sessions || [];
  const registrations = regData?.data?.registrations || [];

  const handleMark = async (reg) => {
    setBusy(reg._id);
    try {
      await markPresent({ registrationId: reg._id, sessionId: selectedSession._id }).unwrap();
      toast.success(reg.user?.name + " marked present");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to mark");
    } finally { setBusy(null); }
  };

  const realRegs = registrations.filter((r) => !r.isGroundFloor);
  const gfRegs = registrations.filter((r) => r.isGroundFloor);
  const counts = {
    registered: realRegs.filter((r) => r.status === "registered").length,
    attended: registrations.filter((r) => r.status === "attended").length,
    gf: gfRegs.filter((r) => r.status === "enrolled_gf").length
  };

  if (!selectedSession) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Take Attendance</h1>
          <p className="muted">Select a meal session and mark students present</p>
        </header>
        {loadingSessions ? <p>Loading...</p> : sessions.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p className="muted">No meals scheduled for today.</p>
          </div>
        ) : (
          <div className="meal-grid">
            {sessions.map((s) => (
              <button key={s._id} onClick={() => setSelectedSession(s)} className="meal-card"
                style={{ textAlign: "left", cursor: "pointer", border: "1px solid #e2e8e6", background: "white", padding: 18, borderRadius: 12 }}>
                <h3 style={{ textTransform: "capitalize", margin: "0 0 4px" }}>{s.category}</h3>
                <p className="muted" style={{ margin: "0 0 12px", fontSize: 13 }}>{s.startTime} - {s.endTime}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0e7c66", fontWeight: 600 }}>
                  <Users size={14} /> Take attendance
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <button onClick={() => setSelectedSession(null)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 8 }}>
          <ChevronLeft size={14} /> Back to sessions
        </button>
        <h1 style={{ textTransform: "capitalize" }}>{selectedSession.category} Attendance</h1>
        <p className="muted">
          {selectedSession.startTime} - {selectedSession.endTime} - {counts.registered} registered
          {counts.gf > 0 && <> - {counts.gf} ground floor</>} - {counts.attended} attended
        </p>
      </header>

      {loadingRegs ? <p>Loading registrations...</p> : registrations.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">No students registered for this meal.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Hostel / Room</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 600 }}>{r.user?.name || "-"}</td>
                  <td>{r.user?.studentId || "-"}</td>
                  <td>{r.user?.hostel?.name || "-"}{r.user?.roomNumber ? " / " + r.user.roomNumber : ""}</td>
                  <td>
                    {r.isGroundFloor ? (
                      <span className="pill" style={{ background: "rgba(245,185,66,0.15)", color: "#a06800", fontSize: 10 }}>
                        <Building2 size={10} style={{ display: "inline", verticalAlign: "middle" }} /> Ground Floor
                      </span>
                    ) : (
                      <span className="pill pill-muted" style={{ fontSize: 10 }}>1st Floor</span>
                    )}
                  </td>
                  <td>
                    <span className={"pill " + (
                      r.status === "attended" ? "pill-green"
                        : r.status === "registered" ? "pill-amber"
                          : r.status === "enrolled_gf" ? "pill-green"
                            : "pill-muted"
                    )}>
                      {r.status === "enrolled_gf" ? "Enrolled" : r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === "registered" || r.status === "enrolled_gf" ? (
                      <button className="action-btn action-approve" disabled={busy === r._id} onClick={() => handleMark(r)}>
                        <CheckCircle2 size={13} /> {busy === r._id ? "Marking..." : "Mark Present"}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#64748b" }}>Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}