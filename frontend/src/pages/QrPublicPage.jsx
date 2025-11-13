import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API } from "../api";
import "./../styles/public.css";

export default function QrPublicPage(){
  const { slug } = useParams();
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState("");
  const cardRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/public/qr/${slug}`);
        const j = await res.json();
        if (!res.ok || !j.ok) throw new Error(j.error || "Invalid QR");
        setInfo(j.data);
      } catch (e) { setErr(e.message || "Failed to load"); }
    })();
  }, [slug]);

  const doPrint = ()=> window.print();

  if (err) return <div className="container"><div className="card"><h3>QR not valid</h3><p>{err}</p></div></div>;
  if (!info) return <div className="container"><div className="card">Loading…</div></div>;

  return (
    <div className="container">
      <div className="card" ref={cardRef}>
        <div className="header">
          <div className="brand">
            <div className="title">QR – Client Declaration</div>
          </div>
          <div className="meta">
            <div>Public View</div>
            <div>Last updated: {new Date(info.updatedAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="hr" />

        <div className="form-row">
          <div className="label">Name of the company -</div>
          <div className="value-line"><span className="value">{info.legalName || "-"}</span></div>
        </div>

        <div className="form-row">
          <div className="label">EPR Certificate Number of (PIBO) -</div>
          <div className="value-line"><span className="value">{info.eprCertificateNumber || "-"}</span></div>
        </div>

        <div className="form-row">
          <div className="label">Thickness in Microns -</div>
          <div className="value-line"><span className="value">{info.thicknessMicrons || "-"}</span></div>
        </div>

        <div className="actions">
          <button className="btn" onClick={doPrint}>Print / Save PDF</button>
          <span className="badge">Read-only</span>
        </div>

        <div style={{marginTop:8}} className="small">
          This page is generated from a QR code. No login required. Keep QR updated to reflect latest details.
        </div>
      </div>
    </div>
  );
}
