import { useEffect, useRef, useState } from "react";
import { API, PUBLIC_BASE } from "../api";
import QRCode from "qrcode.react";

export default function AdminPage(){
  const [adminKey, setAdminKey] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ clientCode:"", legalName:"", eprCertificateNumber:"", thicknessMicrons:"" });

  const load = async () => {
    const res = await fetch(`${API}/api/admin/clients`, { headers: { "x-admin-key": adminKey }});
    const j = await res.json();
    if (j.ok) setItems(j.items || []); else alert(j.error || "Failed to load");
  };
  useEffect(() => { if (adminKey) load(); }, [adminKey]);

  const save = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/admin/clients`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-admin-key": adminKey },
      body: JSON.stringify(form)
    });
    const j = await res.json();
    if (j.ok) { setForm({ clientCode:"", legalName:"", eprCertificateNumber:"", thicknessMicrons:"" }); load(); }
    else alert(j.error || "Save failed");
  };

  const issue = async (id) => {
    const res = await fetch(`${API}/api/admin/clients/${id}/qr/issue`, { method:"POST", headers:{ "x-admin-key": adminKey }});
    const j = await res.json();
    if (!j.ok) alert(j.error || "Issue failed"); else load();
  };
  const rotate = async (id) => {
    const res = await fetch(`${API}/api/admin/clients/${id}/qr/rotate`, { method:"POST", headers:{ "x-admin-key": adminKey }});
    const j = await res.json();
    if (!j.ok) alert(j.error || "Rotate failed"); else load();
  };

  const uploadImport = async () => {
    const el = document.getElementById('bulkfile');
    if (!el.files.length) return alert('Choose a CSV or XLSX file');
    const fd = new FormData();
    fd.append('file', el.files[0]);
    const url = el.files[0].name.toLowerCase().endsWith('.csv') ? '/api/admin/clients/import-csv' : '/api/admin/clients/import-xlsx';
    const res = await fetch(`${API}${url}`, { method:'POST', headers:{ 'x-admin-key': adminKey }, body: fd });
    const j = await res.json();
    if (j.ok) { alert('Imported ' + j.count); load(); } else alert(j.error || 'Upload failed');
  };

  return (
    <div style={{padding:20}}>
      <h2>Admin · Clients (3 fields only)</h2>

      <div style={{margin:"12px 0"}}>
        <input placeholder="Admin API Key" value={adminKey} onChange={e=>setAdminKey(e.target.value)} style={{padding:8, width:320}} />
        <button onClick={load} style={{marginLeft:8}}>Reload</button>
      </div>

      <form onSubmit={save} style={{display:"grid", gap:8, maxWidth:520, border:"1px solid #eee", padding:12, borderRadius:8}}>
        <input placeholder="Client Code (optional, unique)" value={form.clientCode} onChange={e=>setForm(f=>({...f, clientCode:e.target.value}))} />
        <input required placeholder="Name of the company" value={form.legalName} onChange={e=>setForm(f=>({...f, legalName:e.target.value}))} />
        <input required placeholder="EPR Certificate Number of (PIBO)" value={form.eprCertificateNumber} onChange={e=>setForm(f=>({...f, eprCertificateNumber:e.target.value}))} />
        <input required placeholder="Thickness in Microns" value={form.thicknessMicrons} onChange={e=>setForm(f=>({...f, thicknessMicrons:e.target.value}))} />
        <button type="submit">Save / Update</button>
      </form>

      <div style={{marginTop:16, padding:12, border:"1px dashed #bbb", borderRadius:8, maxWidth:520}}>
        <h3>Bulk Upload (CSV/XLSX)</h3>
        <p>Headers: <code>legalName, eprCertificateNumber, thicknessMicrons, clientCode(optional)</code></p>
        <input type="file" id="bulkfile" accept=".csv,.xlsx" />
        <div style={{marginTop:8}}><button onClick={uploadImport}>Upload & Import</button></div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16, marginTop:16}}>
        {items.map(c => (
          <div key={c._id} style={{border:"1px solid #eee", borderRadius:8, padding:12}}>
            <div style={{fontWeight:"bold"}}>{c.legalName}</div>
            <div style={{fontSize:12, color:"#666"}}>EPR: {c.eprCertificateNumber} · {c.thicknessMicrons}µ</div>
            <div style={{marginTop:8}}>
              {c.qrSlug ? (
                <QRCard slug={c.qrSlug} />
              ) : (
                <button onClick={() => issue(c._id)}>Generate QR</button>
              )}
              {c.qrSlug && <button onClick={() => rotate(c._id)} style={{marginLeft:8}}>Rotate</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QRCard({ slug }){
  const ref = useRef(null);
  const url = `${PUBLIC_BASE}/q/${slug}`;
  const download = () => {
    const canvas = ref.current?.querySelector("canvas");
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `client_QR.png`;
    a.click();
  };
  return (
    <div>
      <div ref={ref}><QRCode value={url} size={200} includeMargin /></div>
      <div style={{marginTop:6}}><code>{url}</code></div>
      <button onClick={download} style={{marginTop:6}}>Download PNG</button>
    </div>
  );
}
