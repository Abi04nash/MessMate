import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMenuDetailQuery, useCreateMenuMutation, useUpdateMenuMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, AlertCircle } from "lucide-react";

const CATEGORIES = ["breakfast", "lunch", "snacks", "dinner"];
const DEFAULT_TIMES = {
  breakfast: { start: "08:00", end: "10:00" },
  lunch: { start: "12:00", end: "14:00" },
  snacks: { start: "17:00", end: "18:00" },
  dinner: { start: "19:30", end: "21:30" }
};

function emptyMeal(category) {
  return {
    category,
    startTime: DEFAULT_TIMES[category].start,
    endTime: DEFAULT_TIMES[category].end,
    items: [{ name: "" }],
    serving: true
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MenuFormPage() {
  const user = useSelector((s) => s.auth.user);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading: loadingExisting } = useMenuDetailQuery(id, { skip: !isEdit });
  const [createMenu, { isLoading: creating }] = useCreateMenuMutation();
  const [updateMenu, { isLoading: updating }] = useUpdateMenuMutation();

  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [published, setPublished] = useState(true);
  const [meals, setMeals] = useState(CATEGORIES.map(emptyMeal));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!["mess_committee", "admin"].includes(user?.role)) {
    return <Navigate to="/admin/menus" replace />;
  }

  useEffect(() => {
    if (existing?.data?.menu) {
      const m = existing.data.menu;
      setDate(new Date(m.date).toISOString().slice(0, 10));
      setNotes(m.notes || "");
      setPublished(m.published);
      setMeals((m.meals || []).map((meal) => ({
        category: meal.category,
        startTime: meal.startTime,
        endTime: meal.endTime,
        items: (meal.items || []).length
          ? meal.items.map((it) => ({ name: it.name, dietary: it.dietary || "veg" }))
          : [{ name: "" }],
        serving: true
      })));
    }
  }, [existing]);

  const addItem = (catIdx) => {
    setMeals((prev) => prev.map((m, i) => i === catIdx ? { ...m, items: [...m.items, { name: "", dietary: "veg" }] } : m));
  };
  const removeItem = (catIdx, itemIdx) => {
    setMeals((prev) => prev.map((m, i) => i === catIdx ? { ...m, items: m.items.filter((_, j) => j !== itemIdx) } : m));
  };
  const updateItem = (catIdx, itemIdx, name) => {
    setMeals((prev) => prev.map((m, i) => i === catIdx ? { ...m, items: m.items.map((it, j) => j === itemIdx ? { ...it, name } : it) } : m));
  };
  const updateMeal = (catIdx, updates) => {
    setMeals((prev) => prev.map((m, i) => i === catIdx ? { ...m, ...updates } : m));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const cleanMeals = meals
        .filter((m) => m.items.some((it) => it.name.trim()))
        .map((m) => ({
          ...m,
          items: m.items.filter((it) => it.name.trim()).map((it) => ({
            name: it.name.trim(),
            dietary: it.dietary || "veg",
            allergens: [],
            special: false
          }))
        }));

      if (cleanMeals.length === 0) {
        throw new Error("Add at least one item to at least one meal");
      }

      if (isEdit) {
        await updateMenu({ id, date, meals: cleanMeals, notes, published }).unwrap();
        toast.success("Menu updated");
      } else {
        await createMenu({ date, meals: cleanMeals, notes, published }).unwrap();
        toast.success("Menu created for " + new Date(date).toLocaleDateString());
      }
      navigate("/admin/menus");
    } catch (err) {
      const msg = err?.data?.message || err.message || "Failed to save menu";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (isEdit && loadingExisting) return <div className="page"><p>Loading...</p></div>;

  const minDate = isEdit ? undefined : todayStr();

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/admin/menus" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, marginBottom: 8 }}>
          <ArrowLeft size={14} /> Back to menu history
        </Link>
        <h1>{isEdit ? "Edit Menu" : "Create Menu"}</h1>
        <p className="muted">
          {isEdit
            ? "Update items, times, or publish status"
            : "Menus can be created for today or any future date. Students see them immediately."}
        </p>
      </header>

      {error && (
        <div className="auth-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="card">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <label>
              <span>Date {!isEdit && "(today or later)"}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                required
                disabled={isEdit}
              />
            </label>
            <label>
              <span>Notes (optional)</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Special dinner tonight" />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} style={{ width: "auto" }} />
              <span style={{ textTransform: "none" }}>Published</span>
            </label>
          </div>
        </div>

        {meals.map((meal, catIdx) => (
          <div key={meal.category} className="card" style={{ marginTop: 12 }}>
            <h3 style={{ margin: "0 0 12px", textTransform: "capitalize" }}>{meal.category}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span>Start time</span>
                <input type="time" value={meal.startTime} onChange={(e) => updateMeal(catIdx, { startTime: e.target.value })} />
              </label>
              <label>
                <span>End time</span>
                <input type="time" value={meal.endTime} onChange={(e) => updateMeal(catIdx, { endTime: e.target.value })} />
              </label>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "#64748b", marginTop: 12, marginBottom: 6 }}>Food items</p>
            {meal.items.map((item, itemIdx) => (
              <div key={itemIdx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={item.name}
                  onChange={(e) => updateItem(catIdx, itemIdx, e.target.value)}
                  placeholder="e.g. Idli, Sambar, Paneer"
                  style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e8e6", borderRadius: 6 }}
                />
                {meal.items.length > 1 && (
                  <button type="button" className="btn-small" onClick={() => removeItem(catIdx, itemIdx)} style={{ background: "#dc2626" }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-small" onClick={() => addItem(catIdx)} style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Plus size={13} /> Add item
            </button>
          </div>
        ))}

        <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" className="btn-primary" disabled={busy || creating || updating}>
            {busy || creating || updating ? "Saving..." : (isEdit ? "Update Menu" : "Create Menu")}
          </button>
          <Link to="/admin/menus" className="btn-small" style={{ background: "#64748b", textDecoration: "none", padding: "10px 16px", display: "inline-flex", alignItems: "center" }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}