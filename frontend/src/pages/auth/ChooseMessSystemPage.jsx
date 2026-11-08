import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdateMyProfileMutation } from "../../app/api.js";
import { useDispatch } from "react-redux";
import { setUser } from "../../features/auth/authSlice.js";
import { toast } from "sonner";
import { Building2, UtensilsCrossed, Check, ArrowRight } from "lucide-react";

export default function ChooseMessSystemPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [update] = useUpdateMyProfileMutation();
  const [busy, setBusy] = useState(null);

  const pickFirstFloor = async () => {
    setBusy("1st_floor");
    try {
      const res = await update({ messSystem: "1st_floor" }).unwrap();
      dispatch(setUser(res.data.user));
      toast.success("Welcome to 1st Floor mess");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || "Failed");
      setBusy(null);
    }
  };

  const pickGroundFloor = () => {
    navigate("/ground-floor/enroll", { replace: true });
  };

  return (
    <div style={{ maxWidth: 960, margin: "60px auto", padding: "0 20px" }}>
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8, color: "#0b1f3a" }}>Choose your mess system</h1>
        <p style={{ color: "#64748b", maxWidth: 560, margin: "0 auto" }}>
          Both messes serve the same food. Pick how you want to pay.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <div className="card" style={{ padding: 28, border: "2px solid #e2e8e6" }}>
          <div style={{ width: 48, height: 48, background: "rgba(14,124,102,0.1)", color: "#0e7c66", borderRadius: 12, display: "grid", placeItems: "center", marginBottom: 16 }}>
            <UtensilsCrossed size={24} />
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: "#0b1f3a" }}>1st Floor Mess</h2>
          <p style={{ color: "#64748b", marginBottom: 16, fontSize: 14 }}>
            Pay per meal. Register daily. Cancel anytime before cutoff.
          </p>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 20, display: "grid", gap: 8, fontSize: 13, color: "#475569" }}>
            <li style={{ display: "flex", gap: 8, alignItems: "center" }}><Check size={14} color="#0e7c66" /> Register meal-by-meal</li>
            <li style={{ display: "flex", gap: 8, alignItems: "center" }}><Check size={14} color="#0e7c66" /> Cancel before cutoff</li>
            <li style={{ display: "flex", gap: 8, alignItems: "center" }}><Check size={14} color="#0e7c66" /> Monthly bill</li>
          </ul>
          <button className="btn-primary" onClick={pickFirstFloor} disabled={busy === "1st_floor"} style={{ width: "100%" }}>
            {busy === "1st_floor" ? "Saving..." : <>Select 1st Floor <ArrowRight size={14} /></>}
          </button>
        </div>

        <div className="card" style={{ padding: 28, border: "2px solid #e2e8e6" }}>
          <div style={{ width: 48, height: 48, background: "rgba(245,185,66,0.15)", color: "#a06800", borderRadius: 12, display: "grid", placeItems: "center", marginBottom: 16 }}>
            <Building2 size={24} />
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: "#0b1f3a" }}>Ground Floor Mess</h2>
          <p style={{ color: "#64748b", marginBottom: 16, fontSize: 14 }}>
            One-time semester fee of <strong style={{ color: "#a06800" }}>Rs. 25,000</strong>. Choose 1-3 meals. Eat freely all semester.
          </p>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 20, display: "grid", gap: 8, fontSize: 13, color: "#475569" }}>
            <li style={{ display: "flex", gap: 8, alignItems: "center" }}><Check size={14} color="#a06800" /> Pay once for whole semester</li>
            <li style={{ display: "flex", gap: 8, alignItems: "center" }}><Check size={14} color="#a06800" /> Pick 1-3 meals of your choice</li>
            <li style={{ display: "flex", gap: 8, alignItems: "center" }}><Check size={14} color="#a06800" /> No daily registration needed</li>
          </ul>
          <button className="btn-primary" onClick={pickGroundFloor} disabled={!!busy} style={{ width: "100%", background: "#a06800" }}>
            Continue to Enroll <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}