import { useState } from "react";
import { useMyInventoryRequestsQuery, useCreateInventoryRequestMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Plus, Clock, CheckCircle2, XCircle } from "lucide-react";

const CATEGORIES = ["rice","wheat","vegetables","fruits","pulses","dairy","cooking_oil","spices","meat","cleaning","other"];
const UNITS = ["kg","g","l","ml","piece","packet","dozen"];

export default function RequestInventoryPage() {
  const { data, isLoading, refetch } = useMyInventoryRequestsQuery();
  const [create, { isLoading: creating }] = useCreateInventoryRequestMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    itemName: "",
    category: "vegetables",
    quantity: 1,
    unit: "kg",
    estimatedCost: 0,
    note: "",
    urgency: "normal"
  });

  const requests = data?.data?.requests || [];

  const submit = async (e) => {
    e.preventDefault();
    try {
      await create(form).unwrap();
      toast.success("Request submitted to admin");
      setShowForm(false);
      setForm({ itemName: "", category: "vegetables", quantity: 1, unit: "kg", estimatedCost: 0, note: "", urgency: "normal" });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed");
    }
  };

  const statusIcon = (s) => {
    if (s === "pending") return <Clock size={14} />;
    if (s === "fulfilled" || s === "approved") return <CheckCircle2 size={14} />;
    if (s === "rejected") return <XCircle size={14} />;
    return null;
  };

  return (
    <div className="page">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>Request Inventory</h1>
          <p className="muted">Ask the admin to add new stock to the kitchen</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {showForm ? "Cancel" : <><Plus size={16} /> New Request</>}
        </button>
      </header>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
            <label>
              <span>Item name</span>
              <input required value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Basmati Rice" />
            </label>
            <label>
              <span>Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span>Quantity</span>
              <input type="number" min="0.1" step="0.1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </label>
            <label>
              <span>Unit</span>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <label>
              <span>Estimated cost (Rs.)</span>
              <input type="number" min="0" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })} />
            </label>
            <label>
              <span>Urgency</span>
              <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              <span>Note (optional)</span>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Why needed?" />
            </label>
          </div>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      )}

      {isLoading ? <p>Loading...</p> : requests.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">No requests yet. Click "New Request" to ask the admin for items.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.itemName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.category}</div>
                  </td>
                  <td>{r.quantity} {r.unit}</td>
                  <td>
                    <span className={"pill " + (r.urgency === "high" ? "pill-amber" : "pill-muted")}>
                      {r.urgency}
                    </span>
                  </td>
                  <td>
                    <span className={"pill " + (r.status === "fulfilled" || r.status === "approved" ? "pill-green" : r.status === "rejected" ? "pill-red" : "pill-amber")}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {statusIcon(r.status)} {r.status}
                      </span>
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{new Date(r.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {r.rejectionReason ? "Reason: " + r.rejectionReason : r.approvedAt ? "Added to stock on " + new Date(r.approvedAt).toLocaleDateString() : "-"}
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