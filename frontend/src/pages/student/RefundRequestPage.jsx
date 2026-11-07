import { useState } from "react";
import { useMyRefundsQuery, useCreateRefundMutation, useCancelRequestMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Plus, Clock, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export default function RefundRequestPage() {
  const { data, isLoading, refetch } = useMyRefundsQuery();
  const [create, { isLoading: creating }] = useCreateRefundMutation();
  const [cancel] = useCancelRequestMutation();
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    fromDate: today,
    toDate: today,
    affectedCategories: ["lunch"],
    reason: ""
  });

  const refunds = data?.data?.leaves || [];

  const toggleCat = (c) => {
    setForm((f) => ({
      ...f,
      affectedCategories: f.affectedCategories.includes(c)
        ? f.affectedCategories.filter((x) => x !== c)
        : [...f.affectedCategories, c]
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await create(form).unwrap();
      toast.success("Refund request submitted");
      setShowForm(false);
      setForm({ fromDate: today, toDate: today, affectedCategories: ["lunch"], reason: "" });
      refetch();
    } catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this refund request?")) return;
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
          <h1>Refund Requests</h1>
          <p className="muted">Request a refund for meals you cannot attend</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {showForm ? "Cancel" : <><Plus size={16} /> New Request</>}
        </button>
      </header>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label><span>From date</span><input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required /></label>
            <label><span>To date</span><input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} required /></label>
          </div>
          <label>
            <span>Affected meals</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {["breakfast", "lunch", "snacks", "dinner"].map((c) => (
                <button type="button" key={c} onClick={() => toggleCat(c)}
                  className={"chip " + (form.affectedCategories.includes(c) ? "chip-active" : "")}>
                  {c}
                </button>
              ))}
            </div>
          </label>
          <label><span>Reason</span><textarea required rows="2" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why do you need a refund?" /></label>
          <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Submitting..." : "Submit Request"}</button>
        </form>
      )}

      {isLoading ? <p>Loading...</p> : refunds.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <RotateCcw size={32} color="#64748b" style={{ margin: "0 auto 10px" }} />
          <p className="muted">No refund requests yet. Submit one if you paid for a meal you could not attend.</p>
        </div>
      ) : (
        <div className="list">
          {refunds.map((r) => (
            <div key={r._id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 15 }}>
                    {new Date(r.fromDate).toLocaleDateString()} {new Date(r.fromDate).toDateString() !== new Date(r.toDate).toDateString() && <>to {new Date(r.toDate).toLocaleDateString()}</>}
                  </h3>
                  <p className="muted" style={{ margin: "4px 0", fontSize: 13 }}>
                    {r.affectedCategories?.join(", ")} - Rs. {r.billingImpact || 0}
                  </p>
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