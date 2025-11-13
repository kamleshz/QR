import { Router } from "express";
import Client from "../models/Client.js";
import useragent from "express-useragent";

const r = Router();
r.use(useragent.express());

r.get("/:slug", async (req, res) => {
  const c = await Client.findOne({ qrSlug: req.params.slug }).lean();
  if (!c || !c.qrActive) return res.status(404).json({ error: "QR invalid or disabled" });
  await Client.updateOne({ _id: c._id }, { $inc: { scanCount: 1 }, $set: { lastScanAt: new Date() } });
  res.json({ ok: true, data: c.publicSnapshot || {
    legalName: c.legalName,
    eprCertificateNumber: c.eprCertificateNumber,
    thicknessMicrons: c.thicknessMicrons,
    updatedAt: c.updatedAt || c.createdAt
  }});
});

export default r;
