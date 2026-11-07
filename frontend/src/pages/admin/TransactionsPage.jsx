import { useState } from "react";
import { useAllPaymentsQuery, useAllRefundsQuery, useAllLeavesQuery, useDecideLeaveMutation } from "../../app/api.js";
import { toast } from "sonner";
import { Check, X, TrendingUp } from "lucide-react";

export default function TransactionsPage() {
  const [tab, setTab] = useState("payments");
  const [refundFilter, setRefundFilter] = useState("pending");
  const [leaveFilter, setLeaveFilter] = useState("pending");
  const { data: paymentsData, isLoading: loadingP } = useAllPaymentsQuery({});
  const { data: refundsData, isLoading: loadingR, refetch: refetchR } = useAllRefundsQuery({ status: refundFilter });
  const { data: leavesData, isLoading: loadingL, refetch: refetchL } = useAllLeavesQuery({ status: leaveFilter });
  const [decide] = useDecideLeaveMutation();

  const payments = paymentsData?.data?.payments || [];
  const refunds = refundsData?.data?.leaves || [];
  const leaves = leavesData?.data?.leaves || [];
  const totalReceived = payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);

  const decideItem = async (id, decision, kind) => {
    try {
      await decide({ id, decision, remarks: decision === "approve" ? "Approved" : "Rejected" }).unwrap();
      toast.success(kind + " " + decision + "d");
      if (kind === "Refund") refetchR(); else refetchL();
    } catch (err) { toast.error(err?.data?.message || "Failed"); }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Transactions</h1>
        <p className="muted">Payments from students, refund requests, and staff leaves</p>
      </header>

      <section className="stat-grid">
        <div className="stat-card" style={{ borderLeft: "3px solid #0e7c66" }}>
          <span>Total received</span>
          <strong>Rs. {totalReceived}</strong>
          <small>{payments.length} payments</small>
        </div>
      </section>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button className={"chip " + (tab === "payments" ? "chip-active" : "")} onClick={() => setTab("payments")}>Payments</button>
        <button className={"chip " + (tab === "refunds" ? "chip-active" : "")} onClick={() => setTab("refunds")}>Refund Requests</button>
        <button className={"chip " + (tab === "leaves" ? "chip-active" : "")} onClick={() => setTab("leaves")}>Staff Leaves</button>
      </div>

      {tab === "payments" && (
        loadingP ? <p>Loading...</p> : payments.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <TrendingUp size={32} color="#64748b" style={{ margin: "0 auto 10px" }} />
            <p className="muted">No payments yet. Students pay from their Bills page.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Student</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontSize: 12 }}>{new Date(p.paidAt || p.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.user?.name || "-"}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{p.user?.studentId || p.user?.email}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>Rs. {p.amount}</td>
                    <td><span className="pill pill-muted">{p.method}</span></td>
                    <td><span className={"pill " + (p.status === "success" ? "pill-green" : "pill-amber")}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "refunds" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["pending", "approved", "rejected"].map((s) => (
              <button key={s} className={"chip " + (refundFilter === s ? "chip-active" : "")} onClick={() => setRefundFilter(s)}>{s}</button>
            ))}
          </div>
          {loadingR ? <p>Loading...</p> : refunds.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <p className="muted">No {refundFilter} refund requests.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead><tr><th>Student</th><th>Dates</th><th>Meals</th><th>Amount</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {refunds.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.user?.name || "-"}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{r.user?.studentId}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(r.fromDate).toLocaleDateString()}
                        {new Date(r.fromDate).toDateString() !== new Date(r.toDate).toDateString() && <> to {new Date(r.toDate).toLocaleDateString()}</>}
                      </td>
                      <td style={{ fontSize: 12 }}>{r.affectedCategories?.join(", ")}</td>
                      <td style={{ fontWeight: 600 }}>Rs. {r.billingImpact || 0}</td>
                      <td style={{ fontSize: 12, maxWidth: 200 }}>{r.reason}</td>
                      <td><span className={"pill " + (r.status === "approved" ? "pill-green" : r.status === "rejected" ? "pill-red" : "pill-amber")}>{r.status}</span></td>
                      <td>
                        {r.status === "pending" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="action-btn action-approve" onClick={() => decideItem(r._id, "approve", "Refund")}><Check size={13} /> Approve</button>
                            <button className="action-btn action-suspend" onClick={() => decideItem(r._id, "reject", "Refund")}><X size={13} /> Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "leaves" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["pending", "approved", "rejected"].map((s) => (
              <button key={s} className={"chip " + (leaveFilter === s ? "chip-active" : "")} onClick={() => setLeaveFilter(s)}>{s}</button>
            ))}
          </div>
          {loadingL ? <p>Loading...</p> : leaves.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <p className="muted">No {leaveFilter} staff leaves.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead><tr><th>Staff</th><th>Dates</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{l.user?.name || "-"}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{l.user?.email}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(l.fromDate).toLocaleDateString()}
                        {new Date(l.fromDate).toDateString() !== new Date(l.toDate).toDateString() && <> to {new Date(l.toDate).toLocaleDateString()}</>}
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 250 }}>{l.reason}</td>
                      <td><span className={"pill " + (l.status === "approved" ? "pill-green" : l.status === "rejected" ? "pill-red" : "pill-amber")}>{l.status}</span></td>
                      <td>
                        {l.status === "pending" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="action-btn action-approve" onClick={() => decideItem(l._id, "approve", "Leave")}><Check size={13} /> Approve</button>
                            <button className="action-btn action-suspend" onClick={() => decideItem(l._id, "reject", "Leave")}><X size={13} /> Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}