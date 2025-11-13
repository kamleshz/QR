import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import adminClients from "./routes/admin.clients.js";
import publicQr from "./routes/public.qr.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8182;

app.use(cors({ origin: [process.env.PUBLIC_BASE_URL || "http://localhost:5173"], credentials: false }));
app.use(express.json({ limit: "4mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/admin/clients", adminClients);
app.use("/api/public/qr", publicQr);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: true });
    console.log("Mongo connected.");
    app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
  } catch (e) {
    console.error("MongoDB connection error:", e.message);
    process.exit(1);
  }
};
start();
