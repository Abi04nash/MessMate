import { useState } from "react";
import { useListUsersQuery, useSetUserStatusMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Check, X, RotateCcw, Ban } from "lucide-react";

export default function UsersPage() {
  const { data, isLoading, refetch } = useListUsersQuery({});
  const [setStatus] = useSetUserStatusMutation();
  const [filter, setFilter] = useState("all");

  const users = (data?.data?.users || []).filter((u) => filter === "all" || u.status === filter || u.role === filter);

  const change = async (id, status, name) => {
    if (status === "suspended" && !confirm("Suspend " + name + "? They will not be able to login.")) return;
    try {
      await setStatus({ id, status }).unwrap();
      toast.success(name + " is now " + status);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update");
    }
  };

  const filters = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "student", label: "Students" },
    { value: "mess_committee", label: "Admins" },
    { value: "staff", label: "Staff" }
  ];

  return (
    <div className="page">
      <header className="page-header">
        <h1>User Management</h1>
        <p className="muted">Approve, suspend, or reactivate any account</p>
      </header>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {filters.map((f) => (
          <button
            key={f.value}
            className={`chip ${filter === f.value ? "chip-active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? <p>Loading...</p> : users.length === 0 ? <p className="muted">No users match this filter.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isWarden = u.role === "admin";
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      {u.studentId && <div style={{ fontSize: 11, color: "#64748b" }}>{u.studentId}</div>}
                    </td>
                    <td>{u.email}</td>
                    <td><span className="pill pill-muted">{u.role.replace(/_/g, " ").replace("mess committee", "mess secretary")}</span></td>
                    <td>
                      <span className={`pill ${u.status === "active" ? "pill-green" : u.status === "pending" ? "pill-amber" : u.status === "suspended" ? "pill-red" : "pill-muted"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {u.status === "pending" && (
                          <button className="action-btn action-approve" onClick={() => change(u._id, "active", u.name)}>
                            <Check size={13} /> Approve
                          </button>
                        )}
                        {u.status === "active" && !isWarden && (
                          <button className="action-btn action-suspend" onClick={() => change(u._id, "suspended", u.name)}>
                            <Ban size={13} /> Suspend
                          </button>
                        )}
                        {u.status === "suspended" && (
                          <button className="action-btn action-reactivate" onClick={() => change(u._id, "active", u.name)}>
                            <RotateCcw size={13} /> Reactivate
                          </button>
                        )}
                        {isWarden && u.status === "active" && (
                          <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>Super admin - protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}