/**
 * =============================================================================
 * MODEL ADAPTER — THIS IS THE ONLY FILE YOU NEED TO EDIT TO PLUG IN AN AI MODEL
 * =============================================================================
 *
 * Contract:
 *   predict(inputData) -> Promise<{ label: string, confidence: number }>
 *
 * inputData:
 *   {
 *     buffer: Buffer,       // raw image bytes
 *     mimeType: string,     // e.g. "image/jpeg" or "image/png"
 *     filename: string,
 *     source: string,       // "upload" | "webcam"
 *   }
 *
 * confidence should be a number between 0 and 1 (the UI shows it as a %).
 *
 * Swap this mock for:
 *   - a local TensorFlow.js / ONNX runtime call
 *   - an HTTP request to a model-serving API
 *   - any other inference code you already have
 *
 * Do not train models here. Do not ship datasets in this project.
 * =============================================================================
 */

const MOCK_LABELS = ["class_a", "class_b", "class_c", "class_d"];

async function predict(inputData) {
  if (!inputData || !inputData.buffer || !inputData.buffer.length) {
    throw new Error("predict() received empty input");
  }

  // ---------------------------------------------------------------------------
  // PLACEHOLDER MOCK — delete this block when you wire a real model.
  // Returns a dummy label so the rest of the app can be demoed immediately.
  // ---------------------------------------------------------------------------
  const label = MOCK_LABELS[Math.floor(Math.random() * MOCK_LABELS.length)];
  const confidence = 0.55 + Math.random() * 0.4;
  return { label, confidence: Number(confidence.toFixed(4)) };

  // Example: call an external inference API
  //
  // const form = new FormData();
  // form.append("file", new Blob([inputData.buffer]), inputData.filename);
  // const res = await fetch(process.env.MODEL_API_URL, { method: "POST", body: form });
  // const data = await res.json();
  // return { label: data.label, confidence: data.confidence };
}

module.exports = { predict };
