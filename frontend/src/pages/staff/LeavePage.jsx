import { useState } from "react";
import { useMyLeavesQuery, useCreateLeaveMutation, useCancelRequestMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Plus, Clock, CheckCircle2, XCircle, CalendarOff } from "lucide-react";

export default function LeavePage() {
  const { data, isLoading, refetch } = useMyLeavesQuery();
  const [create, { isLoading: creating }] = useCreateLeaveMutation();
  const [cancel] = useCancelRequestMutation();
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ fromDate: today, toDate: today, affectedCategories: [], reason: "" });

  const leaves = data?.data?.leaves || [];

  const submit = async (e) => {
    e.preventDefault();
    try {
      await create(form).unwrap();
      toast.success("Leave request submitted");
      setShowForm(false);
      setForm({ fromDate: today, toDate: today, affectedCategories: [], reason: "" });
      refetch();
    } catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this leave request?")) return;
    try {
      await cancel(id).unwrap();
      toast.success("Cancelled");
      refetch();
    } catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  const icon = (s) => {
    if (s === "pending") return <Clock size={14} />;
    if (s === "approved") return <CheckCircle2 size={14} />;
    if (s === "rejected") return <XCircle size={14} />;
    return null;
  };

  return (
    <div className="page">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>My Leaves</h1>
          <p className="muted">Request time off from kitchen duty</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {showForm ? "Cancel" : <><Plus size={16} /> New Leave</>}
        </button>
      </header>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label><span>From date</span><input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required /></label>
            <label><span>To date</span><input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} required /></label>
          </div>
          <label><span>Reason</span><textarea required rows="2" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why do you need leave?" /></label>
          <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Submitting..." : "Submit"}</button>
        </form>
      )}

      {isLoading ? <p>Loading...</p> : leaves.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <CalendarOff size={32} color="#64748b" style={{ margin: "0 auto 10px" }} />
          <p className="muted">No leave requests yet.</p>
        </div>
      ) : (
        <div className="list">
          {leaves.map((r) => (
            <div key={r._id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 15 }}>
                    {new Date(r.fromDate).toLocaleDateString()} {new Date(r.fromDate).toDateString() !== new Date(r.toDate).toDateString() && <>to {new Date(r.toDate).toLocaleDateString()}</>}
                  </h3>
                  <p style={{ margin: "4px 0", fontSize: 13 }}>{r.reason}</p>
                  {r.remarks && <p style={{ margin: "4px 0", fontSize: 12, fontStyle: "italic", color: "#64748b" }}>Admin: {r.remarks}</p>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <span className={"pill " + (r.status === "approved" ? "pill-green" : r.status === "rejected" ? "pill-red" : "pill-amber")}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{icon(r.status)} {r.status}</span>
                  </span>
                  {r.status === "pending" && (
                    <button className="action-btn action-suspend" onClick={() => handleCancel(r._id)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}