import { useState } from "react";
import { useAllInventoryRequestsQuery, useDecideInventoryRequestMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export default function InventoryRequestsPage() {
  const [filter, setFilter] = useState("pending");
  const { data, isLoading, refetch } = useAllInventoryRequestsQuery({ status: filter });
  const [decide] = useDecideInventoryRequestMutation();
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  const requests = data?.data?.requests || [];

  const approve = async (r) => {
    const unitCostStr = prompt("Unit cost in Rs. (leave blank to use estimate):", r.estimatedCost && r.quantity ? (r.estimatedCost / r.quantity).toFixed(2) : "");
    const unitCost = unitCostStr ? Number(unitCostStr) : undefined;
    try {
      await decide({ id: r._id, decision: "approve", unitCost }).unwrap();
      toast.success("Approved - stock added");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed");
    }
  };

  const reject = async (r, reason) => {
    try {
      await decide({ id: r._id, decision: "reject", rejectionReason: reason }).unwrap();
      toast.success("Rejected");
      setRejecting(null);
      setReason("");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed");
    }
  };

  const filters = [
    { value: "pending", label: "Pending" },
    { value: "fulfilled", label: "Approved" },
    { value: "rejected", label: "Rejected" }
  ];

  return (
    <div className="page">
      <header className="page-header">
        <h1>Inventory Requests</h1>
        <p className="muted">Approve or reject requests from kitchen staff</p>
      </header>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {filters.map((f) => (
          <button key={f.value} className={"chip " + (filter === f.value ? "chip-active" : "")} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? <p>Loading...</p> : requests.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">No {filter} requests.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Urgency</th>
                <th>Note</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.requestedBy?.name || "Staff"}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.requestedBy?.email}</div>
                  </td>
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
                  <td style={{ fontSize: 12, maxWidth: 200 }}>{r.note || "-"}</td>
                  <td>
                    <span className={"pill " + (r.status === "fulfilled" ? "pill-green" : r.status === "rejected" ? "pill-red" : "pill-amber")}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === "pending" ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="action-btn action-approve" onClick={() => approve(r)}>
                          <Check size={13} /> Approve
                        </button>
                        <button className="action-btn action-suspend" onClick={() => setRejecting(r)}>
                          <X size={13} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {r.status === "fulfilled" && r.approvedBy ? "by " + r.approvedBy.name : r.rejectionReason || "-"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <div className="modal-overlay" onClick={() => setRejecting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Reject Request</h2>
              <button onClick={() => setRejecting(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>{rejecting.itemName} - {rejecting.quantity} {rejecting.unit}</p>
            <label style={{ display: "grid", gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Reason (optional)</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Already in stock" style={{ padding: "9px 11px", border: "1px solid #e2e8e6", borderRadius: 6 }} />
            </label>
            <button className="btn-primary" style={{ width: "100%" }} onClick={() => reject(rejecting, reason)}>
              Reject Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}