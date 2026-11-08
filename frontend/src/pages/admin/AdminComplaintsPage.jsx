import { useAllComplaintsQuery, useUpdateComplaintStatusMutation } from "../../app/api.js";
import { toast } from "sonner";

export default function AdminComplaintsPage() {
  const { data, isLoading, refetch } = useAllComplaintsQuery({});
  const [update] = useUpdateComplaintStatusMutation();
  const complaints = data?.data?.complaints || [];

  const change = async (id, status) => {
    try { await update({ id, status }).unwrap(); toast.success("Updated"); refetch(); }
    catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  return (
    <div className="page">
      <header className="page-header"><h1>Complaints</h1><p className="muted">Manage and resolve student complaints</p></header>
      {isLoading ? <p>Loading...</p> : complaints.length === 0 ? <p className="muted">No complaints yet.</p> : (
        <div className="list">
          {complaints.map((c) => (
            <div key={c._id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{c.title}</h3>
                  <p className="muted" style={{ margin: "4px 0" }}>{c.user?.name} - {c.category?.replace(/_/g, " ").replace("mess committee", "mess secretary")} - {c.priority}</p>
                </div>
                <span className={`pill ${c.status === "resolved" ? "pill-green" : "pill-amber"}`}>{c.status}</span>
              </div>
              <p>{c.description}</p>
              {c.status !== "resolved" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-small" onClick={() => change(c._id, "in_progress")}>In Progress</button>
                  <button className="btn-small" onClick={() => change(c._id, "resolved")}>Resolve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}