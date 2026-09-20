const SETTINGS_ID = 1;

async function getSettings(pool) {
  const [rows] = await pool.query(
    "SELECT id, app_name, logo_path, active_model_name FROM settings WHERE id = ?",
    [SETTINGS_ID]
  );
  return rows[0] || null;
}

async function updateSettings(pool, { app_name, logo_path, active_model_name }) {
  const current = await getSettings(pool);
  if (!current) {
    throw new Error("Settings row is missing. Run schema.sql first.");
  }

  const next = {
    app_name: app_name != null ? app_name : current.app_name,
    logo_path: logo_path != null ? logo_path : current.logo_path,
    active_model_name:
      active_model_name != null ? active_model_name : current.active_model_name,
  };

  await pool.query(
    "UPDATE settings SET app_name = ?, logo_path = ?, active_model_name = ? WHERE id = ?",
    [next.app_name, next.logo_path, next.active_model_name, SETTINGS_ID]
  );

  return getSettings(pool);
}

async function insertPrediction(pool, { input_reference, label, confidence }) {
  const [result] = await pool.query(
    "INSERT INTO predictions (input_reference, label, confidence) VALUES (?, ?, ?)",
    [input_reference, label, confidence]
  );
  const [rows] = await pool.query(
    "SELECT id, input_reference, label, confidence, created_at FROM predictions WHERE id = ?",
    [result.insertId]
  );
  return rows[0];
}

async function listPredictions(pool) {
  const [rows] = await pool.query(
    "SELECT id, input_reference, label, confidence, created_at FROM predictions ORDER BY created_at DESC, id DESC"
  );
  return rows;
}

async function clearPredictions(pool) {
  await pool.query("DELETE FROM predictions");
}

module.exports = {
  getSettings,
  updateSettings,
  insertPrediction,
  listPredictions,
  clearPredictions,
};
