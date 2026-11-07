import { useState } from "react";
import { useListAnnouncementsQuery, useCreateAnnouncementMutation } from "../../app/api.js";
import { toast } from "sonner";

export default function AnnouncementsPage() {
  const { data, isLoading, refetch } = useListAnnouncementsQuery();
  const [create, { isLoading: creating }] = useCreateAnnouncementMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "general", priority: "normal" });

  const announcements = data?.data?.announcements || [];

  const submit = async (e) => {
    e.preventDefault();
    try { await create(form).unwrap(); toast.success("Published"); setShowForm(false); setForm({ title: "", body: "", category: "general", priority: "normal" }); refetch(); }
    catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  return (
    <div className="page">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div><h1>Announcements</h1><p className="muted">Publish notices to all users</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "New"}</button>
      </header>
      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 20 }}>
          <label><span>Title</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label><span>Body</span><textarea required rows="3" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label><span>Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["general","menu_change","special_dinner","mess_holiday","maintenance","payment_reminder"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label><span>Priority</span>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {["low","normal","high","urgent"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </div>
          <button className="btn-primary" disabled={creating}>{creating ? "Publishing..." : "Publish"}</button>
        </form>
      )}
      {isLoading ? <p>Loading...</p> : announcements.length === 0 ? <p className="muted">No announcements yet.</p> : (
        <div className="list">
          {announcements.map((a) => (
            <div key={a._id} className="card" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{a.title}</h3>
              <p className="muted" style={{ margin: "4px 0" }}>{a.category} - {new Date(a.createdAt).toLocaleString()}</p>
              <p style={{ margin: "8px 0" }}>{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}