import { useState } from "react";
import { useRunningBillQuery, usePayDirectMutation, useMyPaymentsQuery } from "../../app/api.js";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { X, CreditCard, Smartphone, Building, CheckCircle2, Copy, Sparkles, ShieldCheck } from "lucide-react";

const METHODS = [
  { value: "upi", label: "UPI", icon: Smartphone, desc: "GPay, PhonePe, Paytm" },
  { value: "card", label: "Card", icon: CreditCard, desc: "Debit or Credit" },
  { value: "netbanking", label: "Net Banking", icon: Building, desc: "All major banks" }
];

const UPI_APPS = ["GPay", "PhonePe", "Paytm", "BHIM"];
const BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB"];

export default function BillsPage() {
  const { data: runningData } = useRunningBillQuery();
  const { data: paymentsData, refetch: refetchPayments } = useMyPaymentsQuery();
  const [pay, { isLoading: paying }] = usePayDirectMutation();

  const [showPay, setShowPay] = useState(false);
  const [method, setMethod] = useState("upi");
  const [amount, setAmount] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedApp, setSelectedApp] = useState("");

  const running = runningData?.data?.bill;
  const payments = paymentsData?.data?.payments || [];
  const total = running?.total || 0;
  const totalPaid = running?.totalPaid || 0;
  const owed = running?.outstanding || 0;

  const upiUrl = `upi://pay?pa=messmate@iiitbh&pn=MESSMATE&am=${amount || 0}&cu=INR&tn=MessBill`;

  const openPay = () => {
    setAmount(owed > 0 ? String(owed) : "");
    setMethod("upi");
    setCardNum(""); setCardExpiry(""); setCardCvv(""); setCardName("");
    setSelectedBank(""); setSelectedApp("");
    setShowPay(true);
  };

  const copyUpiId = async () => {
    try { await navigator.clipboard.writeText("messmate@iiitbh"); toast.success("UPI ID copied"); }
    catch { toast.info("UPI ID: messmate@iiitbh"); }
  };

  const handlePay = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > owed + 0.01) return toast.error(`Amount exceeds outstanding Rs. ${owed}`);

    if (method === "card") {
      if (cardNum.replace(/\s/g, "").length < 12) return toast.error("Enter valid card number");
      if (!cardExpiry) return toast.error("Enter expiry");
      if (cardCvv.length < 3) return toast.error("Enter CVV");
      if (!cardName.trim()) return toast.error("Enter name on card");
    }
    if (method === "netbanking" && !selectedBank) return toast.error("Select a bank");

    try {
      await pay({ amount: amt, method }).unwrap();
      toast.success(`Paid Rs. ${amt} successfully`);
      setShowPay(false);
      setAmount("");
      refetchPayments();
    } catch (err) {
      toast.error(err?.data?.message || "Payment failed");
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>My Bills</h1>
        <p className="muted">Pay for meals and view your payment history</p>
      </header>

      {!running ? (
        <div className="card" style={{ textAlign: "center", padding: 30 }}>
          <p className="muted" style={{ margin: 0 }}>Loading bill...</p>
        </div>
      ) : total === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <Sparkles size={32} color="#0e7c66" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 6px" }}>No meals charged this month</h3>
          <p className="muted" style={{ margin: 0 }}>
            Go to <strong>Menu</strong> and register for a meal to start your bill.
          </p>
        </div>
      ) : (
        <div className="bill-summary">
          <div className="bill-summary-head">
            <div className="bill-summary-info">
              <div className="bill-summary-label">
                {new Date(running.year, running.month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}
              </div>
              <div className="bill-summary-amounts">
                <div>
                  <div className="bill-amt-label">Total</div>
                  <div className="bill-amt-value">Rs. {total}</div>
                </div>
                <div>
                  <div className="bill-amt-label">Paid</div>
                  <div className="bill-amt-value" style={{ color: "#0e7c66" }}>Rs. {totalPaid}</div>
                  {payments.length > 0 && <div className="bill-amt-sub">{payments.length} payment{payments.length > 1 ? "s" : ""}</div>}
                </div>
                <div>
                  <div className="bill-amt-label">Amount due</div>
                  <div className="bill-amt-value" style={{ color: owed > 0 ? "#dc2626" : "#0e7c66" }}>Rs. {owed}</div>
                </div>
              </div>
            </div>

            {owed > 0 ? (
              <button className="pay-now-btn" onClick={openPay}>
                Pay Rs. {owed}
              </button>
            ) : (
              <div className="bill-status-badge">
                <CheckCircle2 size={15} /> Paid in full
              </div>
            )}
          </div>

          {running.items && running.items.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ marginTop: 16 }}>
                <thead><tr><th>Meal</th><th>Count</th><th>Unit Price</th><th>Amount</th></tr></thead>
                <tbody>
                  {running.items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.label}</td>
                      <td>{it.quantity}</td>
                      <td>Rs. {it.unitPrice}</td>
                      <td style={{ fontWeight: 600 }}>Rs. {it.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <h2 style={{ fontSize: 16, marginTop: 32 }}>Payment history</h2>
      {payments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <p className="muted" style={{ margin: 0 }}>No payments yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontSize: 12 }}>{new Date(p.paidAt || p.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td style={{ fontWeight: 700 }}>Rs. {p.amount}</td>
                  <td><span className="pill pill-muted">{p.method}</span></td>
                  <td style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{p.providerRef?.slice(0, 16) || "-"}</td>
                  <td><span className={"pill " + (p.status === "success" ? "pill-green" : "pill-amber")}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPay && running && (
        <div className="modal-overlay" onClick={() => !paying && setShowPay(false)}>
          <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-header">
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Amount to pay</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "#0b1f3a", letterSpacing: -1 }}>Rs. {amount || 0}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Outstanding: Rs. {owed}</div>
              </div>
              <button onClick={() => !paying && setShowPay(false)} disabled={paying} style={{ background: "transparent", border: "none", cursor: paying ? "not-allowed" : "pointer", padding: 6 }}>
                <X size={22} />
              </button>
            </div>

            <label className="payment-amount-input">
              <span>Amount</span>
              <input type="number" min="1" max={owed} value={amount} onChange={(e) => setAmount(e.target.value)} disabled={paying} />
            </label>

            <div className="payment-qr-block">
              <div className="payment-qr-label"><Smartphone size={13} /> Scan with any UPI app</div>
              <div className="payment-qr-canvas"><QRCodeSVG value={upiUrl} size={170} level="M" /></div>
              <div className="payment-upi-id">
                <span style={{ fontFamily: "monospace", fontSize: 13, color: "#0b1f3a" }}>messmate@iiitbh</span>
                <button onClick={copyUpiId} className="payment-copy-btn"><Copy size={12} /> Copy</button>
              </div>
            </div>

            <div className="payment-or"><span>OR PAY WITH</span></div>

            <div className="payment-methods">
              {METHODS.map(({ value, label, icon: Icon, desc }) => (
                <button key={value} type="button" className={"method-tile" + (method === value ? " is-active" : "")} onClick={() => setMethod(value)} disabled={paying}>
                  <Icon size={18} />
                  <div><strong>{label}</strong><span>{desc}</span></div>
                </button>
              ))}
            </div>

            {method === "upi" && (
              <div className="payment-apps">
                <p className="payment-section-label">Choose UPI app</p>
                <div className="app-grid">
                  {UPI_APPS.map((app) => (
                    <button key={app} type="button" className={"app-tile" + (selectedApp === app ? " is-active" : "")} onClick={() => setSelectedApp(app)} disabled={paying}>{app}</button>
                  ))}
                </div>
              </div>
            )}

            {method === "card" && (
              <div className="payment-card-form">
                <label><span>Card number</span>
                  <input value={cardNum} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 16); setCardNum(v.replace(/(\d{4})(?=\d)/g, "$1 ")); }} placeholder="1234 5678 9012 3456" disabled={paying} />
                </label>
                <div className="card-row">
                  <label><span>Expiry</span>
                    <input value={cardExpiry} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setCardExpiry(v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v); }} placeholder="MM/YY" disabled={paying} />
                  </label>
                  <label><span>CVV</span>
                    <input type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" disabled={paying} />
                  </label>
                </div>
                <label><span>Cardholder name</span>
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" disabled={paying} />
                </label>
              </div>
            )}

            {method === "netbanking" && (
              <div className="payment-banks">
                <p className="payment-section-label">Select bank</p>
                <div className="bank-grid">
                  {BANKS.map((b) => (
                    <button key={b} type="button" className={"bank-tile" + (selectedBank === b ? " is-active" : "")} onClick={() => setSelectedBank(b)} disabled={paying}>{b}</button>
                  ))}
                </div>
              </div>
            )}

            <button className="payment-pay-btn" onClick={handlePay} disabled={paying}>
              {paying ? "Processing..." : `Pay Rs. ${amount || 0}`}
            </button>
            <div className="payment-secure"><ShieldCheck size={12} /> Secure demo payment - no real money charged</div>
          </div>
        </div>
      )}
    </div>
  );
}