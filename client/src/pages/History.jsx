import { useEffect, useState } from "react";
import { clearPredictions, getPredictions } from "../api";

function pct(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setRows(await getPredictions());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onClear() {
    if (!window.confirm("Clear all prediction history?")) return;
    setBusy(true);
    try {
      await clearPredictions();
      setRows([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="row space">
        <h1>History</h1>
        <button type="button" className="btn ghost" onClick={onClear} disabled={busy}>
          Clear history
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {rows.length === 0 ? (
        <p className="muted">No predictions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Label</th>
              <th>Confidence</th>
              <th>Input</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>{row.label}</td>
                <td>{pct(row.confidence)}</td>
                <td>
                  {row.input_reference ? (
                    <a href={row.input_reference} target="_blank" rel="noreferrer">
                      {row.input_reference}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
