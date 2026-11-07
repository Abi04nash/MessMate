import { useState } from "react";
import { useMyWastageQuery, useCreateWastageMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Clock, RotateCw } from "lucide-react";

const UNITS = ["kg", "g", "l", "ml", "piece", "packet"];
const REASONS = ["leftover", "spoiled", "overcooked", "other"];

export default function WastagePage() {
  const { data, refetch, isLoading } = useMyWastageQuery();
  const [create, { isLoading: saving }] = useCreateWastageMutation();

  const today = new Date().toISOString().slice(0, 10);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    itemName: "",
    quantity: 1,
    unit: "kg",
    reason: "leftover",
    estimatedCost: 0,
    notes: "",
    date: today
  });

  const records = data?.data?.records || [];
  const stats = data?.data?.stats || { count: 0, totalCost: 0 };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.itemName.trim()) return toast.error("Enter item name");
    if (Number(form.quantity) <= 0) return toast.error("Quantity must be greater than 0");

    try {
      await create({
        itemName: form.itemName.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        reason: form.reason,
        estimatedCost: Number(form.estimatedCost) || 0,
        notes: form.notes || "",
        date: form.date
      }).unwrap();
      toast.success("Wastage recorded");
      setShowForm(false);
      setForm({ itemName: "", quantity: 1, unit: "kg", reason: "leftover", estimatedCost: 0, notes: "", date: today });
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to record wastage";
      const errors = err?.data?.errors;
      toast.error(Array.isArray(errors) ? errors.join(", ") : msg);
    }
  };

  return (
    <div className="page">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>Food Wastage</h1>
          <p className="muted">Record leftover or spoiled items after each meal</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-small" onClick={() => refetch()} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#64748b" }}>
            <RotateCw size={13} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {showForm ? "Cancel" : <><Plus size={16} /> Record Wastage</>}
          </button>
        </div>
      </header>

      <section className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderLeft: "3px solid #0e7c66" }}>
          <span>My records</span>
          <strong>{stats.count || 0}</strong>
          <small>All entries you have logged</small>
        </div>
        <div className="stat-card">
          <span>My total cost</span>
          <strong>Rs. {stats.totalCost || 0}</strong>
          <small>Estimated value</small>
        </div>
      </section>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
            <label>
              <span>Item name *</span>
              <input
                required
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                placeholder="e.g. Rice, Dal, Paneer"
              />
            </label>
            <label>
              <span>Quantity *</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </label>
            <label>
              <span>Unit *</span>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
            <label>
              <span>Reason</span>
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12 }}>
            <label>
              <span>Estimated cost (Rs.)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.estimatedCost}
                onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
              />
            </label>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label>
              <span>Notes (optional)</span>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional detail"
              />
            </label>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Record Wastage"}
          </button>
        </form>
      )}

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={16} /> My wastage history
          {records.length > 0 && <span className="pill pill-muted" style={{ marginLeft: 6 }}>{records.length}</span>}
        </h2>

        {isLoading ? (
          <p>Loading...</p>
        ) : records.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <Trash2 size={32} color="#64748b" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ margin: "0 0 6px" }}>No wastage recorded yet</h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Click "Record Wastage" above to log leftover items after serving.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Cost</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const isRecent = (new Date() - new Date(r.createdAt)) < 5 * 60 * 1000;
                  return (
                    <tr key={r._id}>
                      <td style={{ fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {isRecent ? (
                            <CheckCircle2 size={12} color="#0e7c66" />
                          ) : null}
                          {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.itemName}</td>
                      <td>{r.quantity} {r.unit}</td>
                      <td><span className="pill pill-muted">{r.reason}</span></td>
                      <td>{r.estimatedCost > 0 ? `Rs. ${r.estimatedCost}` : "-"}</td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{r.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}