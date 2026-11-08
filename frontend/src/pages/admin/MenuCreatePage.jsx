import { useState } from "react";
import { useCreateAnnouncementMutation } from "../../app/api.js";
import { toast } from "sonner";

const CATEGORIES = ["breakfast", "lunch", "snacks", "dinner"];
const DEFAULT_TIMES = {
  breakfast: { start: "08:00", end: "10:00" },
  lunch: { start: "12:00", end: "14:00" },
  snacks: { start: "17:00", end: "18:00" },
  dinner: { start: "19:30", end: "21:30" }
};

// Use raw fetch - no RTK Query endpoint for menu create yet
export default function MenuCreatePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [meals, setMeals] = useState(
    CATEGORIES.map((c) => ({
      category: c,
      startTime: DEFAULT_TIMES[c].start,
      endTime: DEFAULT_TIMES[c].end,
      items: [{ name: "" }],
      serving: true
    }))
  );

  const addItem = (catIdx) => {
    setMeals((prev) => prev.map((m, i) => i === catIdx ? { ...m, items: [...m.items, { name: "" }] } : m));
  };
  const removeItem = (catIdx, itemIdx) => {
    setMeals((prev) => prev.map((m, i) => i === catIdx ? { ...m, items: m.items.filter((_, j) => j !== itemIdx) } : m));
  };
  const updateItem = (catIdx, itemIdx, name) => {
    setMeals((prev) => prev.map((m, i) => i === catIdx ? { ...m, items: m.items.map((it, j) => j === itemIdx ? { name } : it) } : m));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const cleanMeals = meals.map((m) => ({
        ...m,
        items: m.items.filter((it) => it.name.trim()).map((it) => ({ name: it.name.trim(), dietary: "veg", allergens: [], special: false }))
      }));
      const res = await fetch((import.meta.env.VITE_API_URL || "/api/v1") + "/menus", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/) || [])[1] || ""
        },
        body: JSON.stringify({ date, meals: cleanMeals, notes, published })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success("Menu created for " + date);
      setNotes("");
    } catch (err) {
      toast.error(err.message || "Failed to create menu");
    } finally { setBusy(false); }
  };

  return (
    <div className="page">
      <header className="page-header"><h1>Create Menu</h1><p className="muted">Publish today's menu - meal sessions auto-create</p></header>
      <form onSubmit={submit}>
        <div className="card">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <label><span>Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
            <label><span>Notes (optional)</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Special dinner!" /></label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} style={{ width: "auto" }} />
              <span style={{ textTransform: "none" }}>Publish immediately</span>
            </label>
          </div>
        </div>

        {meals.map((meal, catIdx) => (
          <div key={meal.category} className="card" style={{ marginTop: 12 }}>
            <h3 style={{ margin: "0 0 12px", textTransform: "capitalize" }}>{meal.category}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label><span>Start</span><input type="time" value={meal.startTime} onChange={(e) => setMeals((prev) => prev.map((m, i) => i === catIdx ? { ...m, startTime: e.target.value } : m))} /></label>
              <label><span>End</span><input type="time" value={meal.endTime} onChange={(e) => setMeals((prev) => prev.map((m, i) => i === catIdx ? { ...m, endTime: e.target.value } : m))} /></label>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "#64748b", marginTop: 12, marginBottom: 6 }}>Items</p>
            {meal.items.map((item, itemIdx) => (
              <div key={itemIdx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={item.name} onChange={(e) => updateItem(catIdx, itemIdx, e.target.value)} placeholder="e.g. Idli, Sambar" style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e8e6", borderRadius: 6 }} />
                {meal.items.length > 1 && (
                  <button type="button" className="btn-small" onClick={() => removeItem(catIdx, itemIdx)} style={{ background: "#dc2626" }}>-</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-small" onClick={() => addItem(catIdx)} style={{ marginTop: 4 }}>+ Add item</button>
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Creating..." : "Create Menu"}</button>
        </div>
      </form>
    </div>
  );
}