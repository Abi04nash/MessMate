import { useAllLeavesQuery, useDecideLeaveMutation } from "../../app/api.js";
import { toast } from "sonner";

export default function AdminLeavesPage() {
  const { data, isLoading, refetch } = useAllLeavesQuery({});
  const [decide] = useDecideLeaveMutation();
  const leaves = data?.data?.leaves || [];

  const act = async (id, decision) => {
    try { await decide({ id, decision, remarks: decision === "approve" ? "Approved" : "Rejected" }).unwrap(); toast.success("Leave " + decision + "d"); refetch(); }
    catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  return (
    <div className="page">
      <header className="page-header"><h1>Leave Requests</h1><p className="muted">Review and decide student leaves</p></header>
      {isLoading ? <p>Loading...</p> : leaves.length === 0 ? <p className="muted">No leave requests yet.</p> : (
        <table className="data-table">
          <thead><tr><th>Student</th><th>From</th><th>To</th><th>Meals</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l._id}>
                <td>{l.user?.name || "-"}</td>
                <td>{new Date(l.fromDate).toLocaleDateString()}</td>
                <td>{new Date(l.toDate).toLocaleDateString()}</td>
                <td>{l.affectedCategories?.join(", ")}</td>
                <td><span className={`pill ${l.status === "approved" ? "pill-green" : l.status === "pending" ? "pill-amber" : "pill-muted"}`}>{l.status}</span></td>
                <td>
                  {l.status === "pending" && (
                    <>
                      <button className="btn-small" onClick={() => act(l._id, "approve")}>Approve</button>{" "}
                      <button className="btn-small" onClick={() => act(l._id, "reject")}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}