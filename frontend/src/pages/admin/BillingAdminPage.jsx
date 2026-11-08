import { useState } from "react";
import { useListUsersQuery, useRunningBillQuery } from "../../app/api.js";
import { toast } from "sonner";

export default function BillingAdminPage() {
  const { data: usersData, isLoading } = useListUsersQuery({ role: "student", status: "active" });
  const [form, setForm] = useState({ userId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const students = usersData?.data?.users || [];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.userId) return toast.error("Select a student");
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "/api/v1") + "/billing/generate", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/) || [])[1] || ""
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setResult(data.data.bill);
      toast.success("Bill generated");
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Generate Bill</h1>
        <p className="muted">Bills include all registered and attended meals in the month</p>
      </header>
      <form onSubmit={submit} className="card">
        <label>
          <span>Student</span>
          <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required>
            <option value="">- Select student -</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.studentId || s.email})</option>
            ))}
          </select>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <span>Month</span>
            <select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString("en", { month: "long" })}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Year</span>
            <input type="number" min="2024" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </label>
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Generating..." : "Generate Bill"}</button>
      </form>
      {result && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>Bill created</h3>
          <p className="muted">Total: <strong>Rs. {result.total}</strong> - Status: {result.status}</p>
          {result.items?.length > 0 && (
            <table className="data-table" style={{ marginTop: 12 }}>
              <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
              <tbody>
                {result.items.map((it, i) => (
                  <tr key={i}><td>{it.label}</td><td>{it.quantity}</td><td>Rs. {it.unitPrice}</td><td>Rs. {it.amount}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}