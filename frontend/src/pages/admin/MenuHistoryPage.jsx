import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useListMenusQuery, useDeleteMenuMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, EyeOff, ChefHat, Clock, Leaf, Flame } from "lucide-react";

const VISUALS = {
  breakfast: { bg: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)", color: "#78350f", label: "Breakfast" },
  lunch: { bg: "linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)", color: "#065f46", label: "Lunch" },
  snacks: { bg: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)", color: "#1e3a8a", label: "Snacks" },
  dinner: { bg: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)", color: "#4c1d95", label: "Dinner" }
};

export default function MenuHistoryPage() {
  const user = useSelector((s) => s.auth.user);
  const isStaff = user?.role === "staff";
  const canEdit = ["mess_committee", "admin"].includes(user?.role);

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const { data, isLoading, refetch } = useListMenusQuery({
    page,
    limit: 20,
    published: filter === "published" ? true : filter === "draft" ? false : undefined
  });
  const [deleteMenu] = useDeleteMenuMutation();

  const menus = data?.data?.menus || [];
  const meta = data?.meta || {};

  const handleDelete = async (id, date) => {
    if (!confirm("Delete menu for " + new Date(date).toLocaleDateString() + "?\n\nStudent registrations for this day will be cancelled.")) return;
    try {
      await deleteMenu(id).unwrap();
      toast.success("Menu deleted");
      refetch();
    } catch (err) { toast.error(err?.data?.message || "Failed to delete"); }
  };

  const isFuture = (d) => new Date(d) >= new Date(new Date().setHours(0,0,0,0));
  const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();
  const isTomorrow = (d) => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return new Date(d).toDateString() === t.toDateString();
  };

  // For staff: compute today + tomorrow prep
  const todayMenu = menus.find((m) => isToday(m.date));
  const tomorrowMenu = menus.find((m) => isTomorrow(m.date));

  return (
    <div className="page">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>{isStaff ? "Menu & Prep" : "Menu History"}</h1>
          <p className="muted">
            {isStaff
              ? "See what to prepare for today and upcoming days"
              : "All menus - past, present, and future"}
          </p>
        </div>
        {canEdit && (
          <Link to="/admin/menus/new" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Create Menu
          </Link>
        )}
      </header>

      {/* Staff-only: today's prep */}
      {isStaff && (todayMenu || tomorrowMenu) && (
        <section style={{ marginBottom: 28 }}>
          {todayMenu && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <ChefHat size={18} color="#0e7c66" /> Today's preparation
              </h2>
              <div className="meal-grid">
                {(todayMenu.meals || []).map((meal) => {
                  const visual = VISUALS[meal.category] || VISUALS.lunch;
                  return (
                    <div key={meal.category} className="meal-card" style={{ padding: 0, overflow: "hidden" }}>
                      <div style={{ background: visual.bg, padding: "12px 16px", color: visual.color }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{visual.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={13} /> {meal.startTime} - {meal.endTime}
                        </div>
                      </div>
                      <div style={{ padding: 16 }}>
                        {meal.items && meal.items.length > 0 ? (
                          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
                            {meal.items.map((item, i) => (
                              <li key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                                {item.dietary === "veg" && <Leaf size={12} color="#0e7c66" />}
                                {item.dietary === "non_veg" && <Flame size={12} color="#dc2626" />}
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted" style={{ margin: 0, fontSize: 13 }}>No items listed</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tomorrowMenu && (
            <div>
              <h2 style={{ fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <ChefHat size={18} color="#f5b942" /> Tomorrow's preparation
              </h2>
              <div className="meal-grid">
                {(tomorrowMenu.meals || []).map((meal) => {
                  const visual = VISUALS[meal.category] || VISUALS.lunch;
                  return (
                    <div key={meal.category} className="meal-card" style={{ padding: 0, overflow: "hidden" }}>
                      <div style={{ background: visual.bg, padding: "12px 16px", color: visual.color }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{visual.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={13} /> {meal.startTime} - {meal.endTime}
                        </div>
                      </div>
                      <div style={{ padding: 16 }}>
                        {meal.items && meal.items.length > 0 ? (
                          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
                            {meal.items.map((item, i) => (
                              <li key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                                {item.dietary === "veg" && <Leaf size={12} color="#0e7c66" />}
                                {item.dietary === "non_veg" && <Flame size={12} color="#dc2626" />}
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted" style={{ margin: 0, fontSize: 13 }}>No items listed</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Filters - admin/warden only */}
      {canEdit && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { v: "all", l: "All" },
            { v: "published", l: "Published" },
            { v: "draft", l: "Draft" }
          ].map((f) => (
            <button key={f.v} className={"chip " + (filter === f.v ? "chip-active" : "")} onClick={() => { setFilter(f.v); setPage(1); }}>
              {f.l}
            </button>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 16, marginTop: isStaff && (todayMenu || tomorrowMenu) ? 32 : 0 }}>
        {isStaff ? "Full menu schedule" : "All menus"}
      </h2>

      {isLoading ? <p>Loading...</p> : menus.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">No menus yet{canEdit ? ". Create your first one." : ". Check back later."}</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Meals</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => {
                  const mealsCount = (m.meals || []).length;
                  const mealCats = (m.meals || []).map((x) => x.category).join(", ");
                  return (
                    <tr key={m._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {new Date(m.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        {isToday(m.date) && <span className="pill pill-green" style={{ marginTop: 4 }}>Today</span>}
                        {isFuture(m.date) && !isToday(m.date) && <span className="pill pill-amber" style={{ marginTop: 4 }}>Upcoming</span>}
                        {!isFuture(m.date) && !isToday(m.date) && <span className="pill pill-muted" style={{ marginTop: 4 }}>Past</span>}
                      </td>
                      <td>
                        <span className={"pill " + (m.published ? "pill-green" : "pill-muted")}>
                          {m.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {mealsCount} meals
                        <div style={{ color: "#64748b", marginTop: 2, textTransform: "capitalize" }}>{mealCats}</div>
                      </td>
                      {canEdit && (
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Link to={"/admin/menus/" + m._id} className="action-btn action-approve" style={{ textDecoration: "none" }}>
                              <Edit size={13} /> Edit
                            </Link>
                            <button className="action-btn action-suspend" onClick={() => handleDelete(m._id, m.date)}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
              <button className="btn-small" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span style={{ padding: "6px 12px", fontSize: 13 }}>Page {page} of {meta.pages}</span>
              <button className="btn-small" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}