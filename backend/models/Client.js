import mongoose from "mongoose";
import { nanoid } from "nanoid";

const PublicSnapshotSchema = new mongoose.Schema({
  legalName: { type: String, required: true },
  eprCertificateNumber: { type: String, required: true },
  thicknessMicrons: { type: String, required: true },
  updatedAt: Date
}, { _id: false });

const ClientSchema = new mongoose.Schema({
  clientCode: { type: String, unique: true, sparse: true },
  legalName: { type: String, required: true },
  eprCertificateNumber: { type: String, required: true },
  thicknessMicrons: { type: String, required: true },
  qrSlug: { type: String, unique: true, sparse: true, index: true },
  qrActive: { type: Boolean, default: true },
  publicSnapshot: PublicSnapshotSchema,
  scanCount: { type: Number, default: 0 },
  lastScanAt: Date
}, { timestamps: true });

ClientSchema.methods.ensureQr = function () {
  if (!this.qrSlug) this.qrSlug = nanoid(8);
};
ClientSchema.methods.refreshPublicSnapshot = function () {
  this.publicSnapshot = {
    legalName: this.legalName,
    eprCertificateNumber: this.eprCertificateNumber,
    thicknessMicrons: this.thicknessMicrons,
    updatedAt: new Date()
  };
};
export default mongoose.model("Client", ClientSchema);
