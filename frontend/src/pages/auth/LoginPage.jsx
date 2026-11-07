import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../app/api.js";
import { toast } from "sonner";
import { ArrowRight, Lock, AlertCircle, Users, ShieldCheck, ChefHat, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email, password }).unwrap();
      toast.success("Welcome to MESSMATE");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err?.data?.message || "Login failed. Please check your credentials.";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-side">
        <Link to="/" className="auth-brand">
          <img src="/favicon.svg" alt="" width="36" height="36" />
          <span>MESSMATE</span>
        </Link>
        <div className="auth-side-content">
          <h2>Smarter meals.<br />Better campus living.</h2>
          <p>Sign in to register for meals, track your bills, and connect with the mess team.</p>
          <div className="auth-side-points">
            <div><Lock size={16} /> Server-side role authorization</div>
            <div><Lock size={16} /> HttpOnly secure cookies</div>
            <div><Lock size={16} /> Refresh-token rotation</div>
          </div>
        </div>
        <p className="auth-side-foot">IIIT Bhubaneswar - 2026</p>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card-head">
            <h1>Sign in</h1>
            <p>Enter your credentials to access MESSMATE</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <label><span>Email address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@iiit-bh.ac.in" required disabled={isLoading} autoComplete="email" />
            </label>
            <label><span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required disabled={isLoading} autoComplete="current-password" />
            </label>
            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-info">
            <h4>Who are you?</h4>
            <div className="auth-info-grid">
              <div className="auth-info-item">
                <GraduationCap size={16} />
                <div>
                  <strong>Student</strong>
                  <span>Register first, then login</span>
                </div>
              </div>
              <div className="auth-info-item">
                <ShieldCheck size={16} />
                <div>
                  <strong>Mess Admin</strong>
                  <span>Fixed credentials</span>
                </div>
              </div>
              <div className="auth-info-item">
                <Users size={16} />
                <div>
                  <strong>Warden</strong>
                  <span>Fixed credentials</span>
                </div>
              </div>
              <div className="auth-info-item">
                <ChefHat size={16} />
                <div>
                  <strong>Kitchen Staff</strong>
                  <span>Fixed credentials</span>
                </div>
              </div>
            </div>
            <p className="auth-info-note">
              <strong>New student?</strong> <Link to="/register">Create an account</Link> - an administrator must approve it before you can sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}