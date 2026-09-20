import { useEffect, useState } from "react";
import { updateSettings } from "../api";
import { useBrand } from "../BrandContext.jsx";

export default function SettingsPage() {
  const { settings, refresh, loading } = useBrand();
  const [appName, setAppName] = useState("");
  const [modelName, setModelName] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setAppName(settings.app_name || "");
    setModelName(settings.active_model_name || "");
  }, [settings]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("app_name", appName);
      form.append("active_model_name", modelName);
      if (logoFile) form.append("logo", logoFile);
      await updateSettings(form);
      await refresh();
      setLogoFile(null);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading && !settings) {
    return <section className="panel">Loading settings…</section>;
  }

  return (
    <section className="panel">
      <h1>Settings</h1>
      <p className="muted">
        Branding is stored in MySQL and applied to the header, title, and
        favicon. The model name is a display label only.
      </p>

      <form onSubmit={onSubmit} className="form">
        <label>
          App name
          <input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            required
          />
        </label>

        <label>
          Active model name
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g. Hand Gesture Recognition v1"
          />
        </label>

        <label>
          Logo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
          />
        </label>

        {settings?.logo_path ? (
          <div>
            <div className="label">Current logo</div>
            <img src={settings.logo_path} alt="" className="logo-preview" />
          </div>
        ) : null}

        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>

      {message ? <p className="ok-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
