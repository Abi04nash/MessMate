import { useState } from "react";
import { useMyLeavesQuery, useCreateLeaveMutation } from "../../app/api.js";
import { toast } from "sonner";

export default function LeavePage() {
  const { data, isLoading, refetch } = useMyLeavesQuery();
  const [create, { isLoading: creating }] = useCreateLeaveMutation();
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ fromDate: today, toDate: today, affectedCategories: ["breakfast","lunch","dinner"], reason: "" });

  const leaves = data?.data?.leaves || [];

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
      toast.success("Leave request submitted");
      setShowForm(false);
      refetch();
    } catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  return (
    <div className="page">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1>Leave Requests</h1><p className="muted">Apply for mess leave and track approval</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "New Request"}</button>
      </header>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label><span>From</span><input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} /></label>
            <label><span>To</span><input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} /></label>
          </div>
          <label><span>Affected Meals</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {["breakfast","lunch","snacks","dinner"].map((c) => (
                <button type="button" key={c} onClick={() => toggleCat(c)}
                  className={`chip ${form.affectedCategories.includes(c) ? "chip-active" : ""}`}>{c}</button>
              ))}
            </div>
          </label>
          <label><span>Reason</span><textarea required rows="2" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why are you taking leave?" /></label>
          <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Submitting..." : "Submit"}</button>
        </form>
      )}

      {isLoading ? <p>Loading...</p> : leaves.length === 0 ? <p className="muted">No leave requests yet.</p> : (
        <table className="data-table">
          <thead><tr><th>From</th><th>To</th><th>Meals</th><th>Status</th><th>Remarks</th></tr></thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l._id}>
                <td>{new Date(l.fromDate).toLocaleDateString()}</td>
                <td>{new Date(l.toDate).toLocaleDateString()}</td>
                <td>{l.affectedCategories?.join(", ")}</td>
                <td><span className={`pill ${l.status === "approved" ? "pill-green" : l.status === "rejected" ? "pill-amber" : "pill-muted"}`}>{l.status}</span></td>
                <td className="muted">{l.remarks || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}