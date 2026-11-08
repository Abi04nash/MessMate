import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useGroundFloorInfoQuery, useGroundFloorEnrollMutation, useMeQuery } from "../../app/api.js";
import { setUser } from "../../features/auth/authSlice.js";
import { toast } from "sonner";
import { Check, CreditCard, Building2, Smartphone, Copy, ShieldCheck, X, Printer, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", snacks: "Snacks", dinner: "Dinner" };
const MEAL_TIMES = { breakfast: "8:00 - 10:00 AM", lunch: "12:00 - 2:00 PM", snacks: "5:00 - 6:00 PM", dinner: "7:30 - 9:30 PM" };
const MIN_MEALS = 3;

const METHODS = [
  { value: "upi", label: "UPI", icon: Smartphone, desc: "GPay, PhonePe, Paytm" },
  { value: "card", label: "Card", icon: CreditCard, desc: "Debit or Credit" },
  { value: "netbanking", label: "Net Banking", icon: Building2, desc: "All major banks" }
];
const UPI_APPS = ["GPay", "PhonePe", "Paytm", "BHIM"];
const BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB"];

export default function GroundFloorEnrollPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: meData, refetch: refetchMe } = useMeQuery();
  const { data, isLoading, refetch } = useGroundFloorInfoQuery();
  const [enroll, { isLoading: enrolling }] = useGroundFloorEnrollMutation();

  const [selected, setSelected] = useState([]);
  const [showPay, setShowPay] = useState(false);
  const [method, setMethod] = useState("upi");
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedApp, setSelectedApp] = useState("");
  const [justEnrolled, setJustEnrolled] = useState(null);

  const user = meData?.data?.user;
  const info = data?.data;
  const enrollment = justEnrolled?.enrollment || info?.enrollment;
  const fee = info?.fee || 25000;

  const toggle = (meal) => {
    setSelected((prev) => prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]);
  };

  const openPay = () => {
    if (selected.length < MIN_MEALS) return toast.error(`Please select at least ${MIN_MEALS} meals`);
    setMethod("upi");
    setCardNum(""); setCardExpiry(""); setCardCvv(""); setCardName("");
    setSelectedBank(""); setSelectedApp("");
    setShowPay(true);
  };

  const copyUpiId = async () => {
    try { await navigator.clipboard.writeText("messmate@iiitbh"); toast.success("UPI ID copied"); }
    catch { toast.info("UPI ID: messmate@iiitbh"); }
  };

  const validatePay = () => {
    if (method === "card") {
      if (cardNum.replace(/\s/g, "").length < 12) { toast.error("Enter valid card number"); return false; }
      if (!cardExpiry) { toast.error("Enter expiry date"); return false; }
      if (cardCvv.length < 3) { toast.error("Enter CVV"); return false; }
      if (!cardName.trim()) { toast.error("Enter name on card"); return false; }
    }
    if (method === "netbanking" && !selectedBank) { toast.error("Select a bank"); return false; }
    return true;
  };

  const handlePay = async () => {
    if (!validatePay()) return;
    try {
      const res = await enroll({ meals: selected, method }).unwrap();
      toast.success(`Payment successful! Rs. ${res.data.enrollment.amount.toLocaleString("en-IN")} paid.`);
      setJustEnrolled(res.data);
      setShowPay(false);
      await refetch();
      const me = await refetchMe();
      if (me.data?.data?.user) dispatch(setUser(me.data.data.user));
    } catch (err) {
      toast.error(err?.data?.message || "Enrollment failed");
    }
  };

  const upiUrl = `upi://pay?pa=messmate@iiitbh&pn=MESSMATE&am=${fee}&cu=INR&tn=GroundFloorSemester`;

  if (isLoading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  // Show pass if enrolled
  if (enrollment) {
    return <EnrollmentPass enrollment={enrollment} user={user} onBack={() => navigate("/dashboard")} />;
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Building2 size={24} color="#a06800" />
          <h1 style={{ fontSize: 26, margin: 0, color: "#0b1f3a" }}>Ground Floor Enrollment</h1>
        </div>
        <p style={{ color: "#64748b", margin: 0 }}>
          Pick at least {MIN_MEALS} meals for the whole semester. Pay Rs. {fee.toLocaleString("en-IN")} once and get your mess pass.
        </p>
        <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: 13 }}>
          Semester: {info?.semesterStart ? new Date(info.semesterStart).toLocaleDateString("en-IN") : ""} - {info?.semesterEnd ? new Date(info.semesterEnd).toLocaleDateString("en-IN") : ""}
        </p>
      </header>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Choose your meals</h2>
          <span className={`pill ${selected.length >= MIN_MEALS ? "pill-green" : "pill-amber"}`} style={{ fontSize: 11 }}>
            {selected.length}/4 selected - min {MIN_MEALS} required
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 14px" }}>
          You can include 3 or all 4 meals in your plan.
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {info?.meals?.map((meal) => {
            const isSel = selected.includes(meal);
            return (
              <button key={meal} type="button" onClick={() => toggle(meal)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px",
                border: isSel ? "2px solid #a06800" : "1px solid #e2e8e6",
                background: isSel ? "rgba(245,185,66,0.08)" : "white",
                borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%", color: "#0b1f3a"
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{MEAL_LABELS[meal]}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{MEAL_TIMES[meal]}</div>
                </div>
                {isSel && <Check size={20} color="#a06800" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ borderLeft: "3px solid #a06800", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>One-time semester fee</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0b1f3a" }}>Rs. {fee.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Covers {info?.totalDays || 120} days - pay once, eat all semester</div>
          </div>
          <button className="btn-primary" onClick={openPay} disabled={selected.length < MIN_MEALS} style={{ padding: "14px 32px", fontSize: 15, background: "#a06800" }}>
            <CreditCard size={16} /> Pay Rs. {fee.toLocaleString("en-IN")}
          </button>
        </div>
        {selected.length < MIN_MEALS && (
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "#a06800" }}>
            Select at least {MIN_MEALS} meals to enable payment
          </p>
        )}
      </div>

      {showPay && (
        <div className="modal-overlay" onClick={() => !enrolling && setShowPay(false)}>
          <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-header">
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Amount to pay</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "#0b1f3a", letterSpacing: -1 }}>Rs. {fee.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Ground Floor semester</div>
              </div>
              <button onClick={() => !enrolling && setShowPay(false)} disabled={enrolling} style={{ background: "transparent", border: "none", cursor: enrolling ? "not-allowed" : "pointer", padding: 6 }}>
                <X size={22} />
              </button>
            </div>

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
                <button key={value} type="button" className={"method-tile" + (method === value ? " is-active" : "")} onClick={() => setMethod(value)} disabled={enrolling}>
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
                    <button key={app} type="button" className={"app-tile" + (selectedApp === app ? " is-active" : "")} onClick={() => setSelectedApp(app)} disabled={enrolling}>{app}</button>
                  ))}
                </div>
              </div>
            )}

            {method === "card" && (
              <div className="payment-card-form">
                <label><span>Card number</span>
                  <input value={cardNum} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 16); setCardNum(v.replace(/(\d{4})(?=\d)/g, "$1 ")); }} placeholder="1234 5678 9012 3456" disabled={enrolling} />
                </label>
                <div className="card-row">
                  <label><span>Expiry</span>
                    <input value={cardExpiry} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setCardExpiry(v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v); }} placeholder="MM/YY" disabled={enrolling} />
                  </label>
                  <label><span>CVV</span>
                    <input type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" disabled={enrolling} />
                  </label>
                </div>
                <label><span>Cardholder name</span>
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" disabled={enrolling} />
                </label>
              </div>
            )}

            {method === "netbanking" && (
              <div className="payment-banks">
                <p className="payment-section-label">Select bank</p>
                <div className="bank-grid">
                  {BANKS.map((b) => (
                    <button key={b} type="button" className={"bank-tile" + (selectedBank === b ? " is-active" : "")} onClick={() => setSelectedBank(b)} disabled={enrolling}>{b}</button>
                  ))}
                </div>
              </div>
            )}

            <button className="payment-pay-btn" onClick={handlePay} disabled={enrolling}>
              {enrolling ? "Processing..." : `Pay Rs. ${fee.toLocaleString("en-IN")}`}
            </button>
            <div className="payment-secure"><ShieldCheck size={12} /> Secure demo payment - no real money charged</div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnrollmentPass({ enrollment, user, onBack }) {
  if (!enrollment) {
    return (
      <div style={{ maxWidth: 640, margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
        <p className="muted">Enrollment not found.</p>
        <button className="btn-primary" onClick={onBack}>Back to Dashboard</button>
      </div>
    );
  }

  const payment = enrollment.paymentId;
  const ref = payment?.providerRef || "-";
  const methodLabel = payment?.method ? payment.method.toUpperCase() : "UPI";

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 20px" }}>
      <div className="no-print" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <button onClick={onBack} className="btn-small" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <button onClick={() => window.print()} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#a06800" }}>
          <Printer size={14} /> Print / Save as PDF
        </button>
      </div>

      <div className="ground-floor-pass-wrapper">
        <div className="ground-floor-pass">
          <div style={{ background: "linear-gradient(135deg, #0b1f3a 0%, #a06800 100%)", padding: "26px 28px", color: "white", borderRadius: "16px 16px 0 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2.5, opacity: 0.75 }}>MessMate - IIIT Bhubaneswar</div>
                <h1 style={{ margin: "6px 0 0", fontSize: 26, color: "white", letterSpacing: -0.5 }}>Ground Floor Semester Pass</h1>
                <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.85 }}>One-time payment - full semester mess access</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", opacity: 0.7 }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, padding: "4px 14px", background: "rgba(255,255,255,0.25)", borderRadius: 20, display: "inline-block", marginTop: 4 }}>ACTIVE</div>
              </div>
            </div>
          </div>

          <div style={{ background: "white", padding: "28px", border: "1px solid #e2e8e6", borderTop: "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Student</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0b1f3a", marginTop: 3 }}>{user?.name || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Student ID</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0b1f3a", marginTop: 3 }}>{user?.studentId || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Hostel / Room</div>
                <div style={{ fontSize: 14, color: "#0b1f3a", marginTop: 3 }}>{user?.hostel?.name || "-"}{user?.roomNumber ? " / " + user.roomNumber : ""}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Email</div>
                <div style={{ fontSize: 13, color: "#0b1f3a", marginTop: 3, wordBreak: "break-all" }}>{user?.email || "-"}</div>
              </div>
            </div>

            <div style={{ height: 1, background: "#e2e8e6", margin: "20px 0" }} />

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6, marginBottom: 10 }}>Included Meals</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {enrollment.meals.map((m) => (
                  <span key={m} style={{ padding: "6px 16px", background: "rgba(245,185,66,0.15)", color: "#a06800", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                    {MEAL_LABELS[m]}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Semester From</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0b1f3a", marginTop: 3 }}>
                  {new Date(enrollment.semesterStart).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Semester To</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0b1f3a", marginTop: 3 }}>
                  {new Date(enrollment.semesterEnd).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: "#e2e8e6", margin: "20px 0" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Amount Paid</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0b1f3a", marginTop: 3 }}>Rs. {enrollment.amount.toLocaleString("en-IN")}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Payment Method</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0b1f3a", marginTop: 3 }}>{methodLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.6 }}>Paid On</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0b1f3a", marginTop: 3 }}>
                  {new Date(enrollment.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18, padding: "12px 14px", background: "#f8fafb", borderRadius: 8, fontSize: 11, color: "#64748b", fontFamily: "monospace", wordBreak: "break-all" }}>
              <strong>Transaction Reference:</strong> {ref}
            </div>
          </div>

          <div style={{ background: "#f8fafb", padding: "14px 28px", borderRadius: "0 0 16px 16px", border: "1px solid #e2e8e6", borderTop: "none", textAlign: "center", fontSize: 11, color: "#64748b" }}>
            This pass is valid for the entire semester. Show this to mess staff when requested.
            <br />Generated on {new Date().toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <p className="no-print" style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#64748b" }}>
        Click "Print / Save as PDF" to download this pass.
      </p>
    </div>
  );
}