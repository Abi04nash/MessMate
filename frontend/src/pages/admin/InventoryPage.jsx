import { useState } from "react";
import { useListInventoryQuery, useCreateInventoryMutation, useRecordStockMutation } from "../../app/api.js";
import { toast } from "sonner";

const CATS = ["rice","wheat","vegetables","fruits","pulses","dairy","cooking_oil","spices","meat","cleaning","other"];

export default function InventoryPage() {
  const { data, refetch, isLoading } = useListInventoryQuery({});
  const [create] = useCreateInventoryMutation();
  const [record] = useRecordStockMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "rice", unit: "kg", quantity: 0, minStockLevel: 5, unitCost: 0 });

  const items = data?.data?.items || [];

  const submit = async (e) => {
    e.preventDefault();
    try { await create(form).unwrap(); toast.success("Item added"); setShowForm(false); refetch(); }
    catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  const quickPurchase = async (item) => {
    const qty = prompt(`Add stock for ${item.name} (${item.unit}):`, "10");
    if (!qty) return;
    try { await record({ id: item._id, type: "purchase", quantity: Number(qty) }).unwrap(); toast.success("Stock updated"); refetch(); }
    catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  return (
    <div className="page">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div><h1>Inventory</h1><p className="muted">Track kitchen stock</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add Item"}</button>
      </header>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <label><span>Name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label><span>Category</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label><span>Unit</span><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{["kg","g","l","ml","piece","packet"].map((u) => <option key={u}>{u}</option>)}</select></label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <label><span>Qty</span><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></label>
            <label><span>Min Level</span><input type="number" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: Number(e.target.value) })} /></label>
            <label><span>Unit Cost </span><input type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} /></label>
          </div>
          <button className="btn-primary">Add</button>
        </form>
      )}

      {isLoading ? <p>Loading...</p> : items.length === 0 ? <p className="muted">No inventory yet.</p> : (
        <table className="data-table">
          <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Min</th><th>Action</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.name}</td>
                <td>{it.category}</td>
                <td><span className={`pill ${it.quantity <= it.minStockLevel ? "pill-amber" : "pill-green"}`}>{it.quantity} {it.unit}</span></td>
                <td>{it.minStockLevel} {it.unit}</td>
                <td><button className="btn-small" onClick={() => quickPurchase(it)}>+ Purchase</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}