import { useState } from "react";
import { Link } from "react-router-dom";
import { useRegisterMutation } from "../../app/api.js";
import { toast } from "sonner";
import { ArrowRight, Check, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [register, { isLoading }] = useRegisterMutation();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", studentId: "", phone: "", semester: 1 });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form).unwrap();
      setDone(true);
    } catch (err) {
      const msg = err?.data?.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-side">
          <Link to="/" className="auth-brand"><img src="/favicon.svg" alt="" width="36" height="36" /><span>MESSMATE</span></Link>
          <div className="auth-side-content"><h2>Almost there.</h2><p>Your request is pending admin approval.</p></div>
        </div>
        <div className="auth-main">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <div className="auth-success-icon"><Check size={32} /></div>
            <h1 style={{ margin: "16px 0 8px" }}>Account submitted</h1>
            <p className="muted">Your registration is pending approval. The mess administrator will review it shortly. You'll be able to login once approved.</p>
            <Link to="/login" className="auth-submit" style={{ display: "inline-flex", marginTop: 20, textDecoration: "none" }}>Back to sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-side">
        <Link to="/" className="auth-brand"><img src="/favicon.svg" alt="" width="36" height="36" /><span>MESSMATE</span></Link>
        <div className="auth-side-content">
          <h2>Student registration.</h2>
          <p>Create your account with your IIIT Bhubaneswar email. Admin approval is required.</p>
          <div className="auth-side-points">
            <div><Check size={16} /> Free for all IIIT students</div>
            <div><Check size={16} /> QR meal passes on your phone</div>
            <div><Check size={16} /> Itemized bills, no surprises</div>
          </div>
        </div>
        <p className="auth-side-foot">IIIT Bhubaneswar - 2026</p>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card-head">
            <h1>Create student account</h1>
            <p>For students only - requires @iiit-bh.ac.in email</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <label><span>Full name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rahul Sharma" required />
            </label>
            <label><span>Institutional email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@iiit-bh.ac.in" required />
            </label>
            <div className="auth-form-row">
              <label><span>Student ID</span>
                <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="IIITB2023001" required />
              </label>
              <label><span>Semester</span>
                <input type="number" min="1" max="12" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
              </label>
            </div>
            <label><span>Phone (optional)</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </label>
            <label><span>Password</span>
              <input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" required />
            </label>
            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="auth-alt">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}