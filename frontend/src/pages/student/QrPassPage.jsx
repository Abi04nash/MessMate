import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTodayMenuQuery, useGenerateQrMutation } from "../../app/api.js";
import { toast } from "sonner";

export default function QrPassPage() {
  const { data } = useTodayMenuQuery();
  const [generate] = useGenerateQrMutation();
  const [qrData, setQrData] = useState(null);
  const [selected, setSelected] = useState(null);

  const sessions = (data?.data?.sessions || []).filter((s) => s.myRegistration?.status === "registered");

  const doGenerate = async (sessionId) => {
    setSelected(sessionId);
    try {
      const res = await generate({ sessionId }).unwrap();
      setQrData(res.data.qrPass);
      toast.success("QR pass generated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed");
      setQrData(null);
    }
  };

  return (
    <div className="page">
      <header className="page-header"><h1>My QR Meal Pass</h1><p className="muted">Show this at the mess counter. Valid for 10 minutes.</p></header>
      {sessions.length === 0 ? (
        <p className="muted">Register for a meal first on the Menu page.</p>
      ) : (
        <>
          <div className="meal-grid">
            {sessions.map((s) => (
              <div key={s._id} className="meal-card">
                <h3 style={{ textTransform: "capitalize" }}>{s.category}</h3>
                <p className="muted">{s.startTime} - {s.endTime}</p>
                <button className="btn" onClick={() => doGenerate(s._id)}>Generate QR</button>
              </div>
            ))}
          </div>
          {qrData && selected && (
            <div className="card" style={{ marginTop: 24, textAlign: "center", padding: 32 }}>
              <h2 style={{ margin: "0 0 8px" }}>Show this to mess staff</h2>
              <p className="muted">Expires in {qrData.expiresInMinutes} minutes</p>
              <div style={{ display: "inline-block", padding: 16, background: "white", borderRadius: 12, marginTop: 16 }}>
                <QRCodeSVG value={qrData.token} size={240} level="M" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}