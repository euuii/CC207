const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const { createPool } = require("./db/connection");
const queries = require("./db/queries");
const { predict } = require("./model/adapter");

const ROOT = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const LOGOS_DIR = path.join(UPLOADS_DIR, "logos");
const INPUTS_DIR = path.join(UPLOADS_DIR, "inputs");

for (const dir of [UPLOADS_DIR, LOGOS_DIR, INPUTS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

const pool = createPool();
const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function publicUploadPath(subdir, filename) {
  return `/uploads/${subdir}/${filename}`;
}

function saveBuffer(dir, originalName, buffer) {
  const ext = path.extname(originalName || "").toLowerCase() || ".png";
  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  return filename;
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (err) {
    res.status(500).json({ ok: false, database: "error", error: err.message });
  }
});

app.get("/api/settings", async (_req, res) => {
  try {
    const settings = await queries.getSettings(pool);
    if (!settings) {
      return res.status(500).json({
        error: "Settings row missing. Import schema.sql into MySQL.",
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/settings", upload.single("logo"), async (req, res) => {
  try {
    const payload = {
      app_name: req.body.app_name,
      active_model_name: req.body.active_model_name,
    };

    if (req.file) {
      const filename = saveBuffer(
        LOGOS_DIR,
        req.file.originalname,
        req.file.buffer
      );
      payload.logo_path = publicUploadPath("logos", filename);
    }

    const settings = await queries.updateSettings(pool, payload);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/predict", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Send an image in the 'image' field." });
    }

    const source = req.body.source === "webcam" ? "webcam" : "upload";
    const filename = saveBuffer(
      INPUTS_DIR,
      req.file.originalname || `${source}.png`,
      req.file.buffer
    );
    const input_reference = publicUploadPath("inputs", filename);

    const result = await predict({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      filename: req.file.originalname || filename,
      source,
    });

    if (!result || typeof result.label !== "string") {
      return res.status(500).json({
        error: "adapter.predict() must return { label, confidence }",
      });
    }

    const confidence = Number(result.confidence);
    const row = await queries.insertPrediction(pool, {
      input_reference,
      label: result.label,
      confidence,
    });

    res.json({
      label: row.label,
      confidence: row.confidence,
      created_at: row.created_at,
      input_reference: row.input_reference,
      id: row.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/predictions", async (_req, res) => {
  try {
    const rows = await queries.listPredictions(pool);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/predictions", async (_req, res) => {
  try {
    await queries.clearPredictions(pool);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
