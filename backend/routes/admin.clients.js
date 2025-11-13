import { Router } from "express";
import Client from "../models/Client.js";
import { nanoid } from "nanoid";
import multer from "multer";
import { parse as csvParse } from "csv-parse";
import XLSX from "xlsx";

const r = Router();

r.use((req, res, next) => {
  const key = req.header("x-admin-key");
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

r.post("/", async (req, res) => {
  const { clientCode, legalName, eprCertificateNumber, thicknessMicrons } = req.body || {};
  if (!legalName || !eprCertificateNumber || !thicknessMicrons) {
    return res.status(400).json({ error: "legalName, eprCertificateNumber, thicknessMicrons are required" });
  }
  const filter = clientCode ? { clientCode } : { legalName, eprCertificateNumber };
  const c = await Client.findOneAndUpdate(filter, { $set: { clientCode, legalName, eprCertificateNumber, thicknessMicrons } }, { upsert: true, new: true });
  res.json({ ok: true, client: c });
});

r.get("/", async (req, res) => {
  const items = await Client.find({}).sort({ createdAt: -1 }).lean();
  res.json({ ok: true, items, total: items.length });
});

r.post("/:id/qr/issue", async (req, res) => {
  const c = await Client.findById(req.params.id);
  if (!c) return res.status(404).json({ error: "Client not found" });
  if (!c.qrSlug) c.qrSlug = nanoid(8);
  c.refreshPublicSnapshot();
  await c.save();
  res.json({ ok: true, qrSlug: c.qrSlug, url: `${process.env.PUBLIC_BASE_URL}/q/${c.qrSlug}` });
});

r.post("/:id/qr/rotate", async (req, res) => {
  const c = await Client.findById(req.params.id);
  if (!c) return res.status(404).json({ error: "Client not found" });
  c.qrSlug = nanoid(8);
  c.refreshPublicSnapshot();
  await c.save();
  res.json({ ok: true, qrSlug: c.qrSlug, url: `${process.env.PUBLIC_BASE_URL}/q/${c.qrSlug}` });
});

r.post("/:id/qr/toggle", async (req, res) => {
  const { active } = req.body || {};
  const c = await Client.findByIdAndUpdate(req.params.id, { qrActive: !!active }, { new: true });
  if (!c) return res.status(404).json({ error: "Client not found" });
  res.json({ ok: true, qrActive: c.qrActive });
});

// Bulk upload
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
r.post("/import-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    csvParse(req.file.buffer.toString("utf8"), { columns: true, skip_empty_lines: true, trim: true }, async (err, records) => {
      if (err) return res.status(400).json({ error: "CSV parse error: " + err.message });
      for (const rec of records) {
        const { legalName, eprCertificateNumber, thicknessMicrons, clientCode } = rec;
        if (!legalName || !eprCertificateNumber || !thicknessMicrons) continue;
        await Client.updateOne(clientCode ? { clientCode } : { legalName, eprCertificateNumber }, { $set: { clientCode, legalName, eprCertificateNumber, thicknessMicrons } }, { upsert: true });
      }
      res.json({ ok: true, count: records.length });
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
r.post("/import-xlsx", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const records = XLSX.utils.sheet_to_json(ws, { defval: "" });
    let n = 0;
    for (const rec of records) {
      const legalName = rec.legalName || rec["Legal Name"] || rec["Name of the company"];
      const eprCertificateNumber = rec.eprCertificateNumber || rec["EPR Certificate Number"] || rec["EPR Certificate Number of (PIBO)"];
      const thicknessMicrons = rec.thicknessMicrons || rec["Thickness in Microns"];
      const clientCode = rec.clientCode || rec["Client Code"];
      if (!legalName || !eprCertificateNumber || !thicknessMicrons) continue;
      await Client.updateOne(clientCode ? { clientCode } : { legalName, eprCertificateNumber }, { $set: { clientCode, legalName, eprCertificateNumber, thicknessMicrons } }, { upsert: true });
      n += 1;
    }
    res.json({ ok: true, count: n });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;
