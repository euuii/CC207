const JSON_HEADERS = { "Content-Type": "application/json" };

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function getSettings() {
  return fetch("/api/settings").then(parse);
}

export function updateSettings(formData) {
  return fetch("/api/settings", { method: "PUT", body: formData }).then(parse);
}

export function runPredict(formData) {
  return fetch("/api/predict", { method: "POST", body: formData }).then(parse);
}

export function getPredictions() {
  return fetch("/api/predictions").then(parse);
}

export function clearPredictions() {
  return fetch("/api/predictions", {
    method: "DELETE",
    headers: JSON_HEADERS,
  }).then(parse);
}
