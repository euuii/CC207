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
 * confidence is a number between 0 and 1 (the UI shows it as a %).
 *
 * This version loads a Teachable Machine model exported as TensorFlow.js.
 * Put the exported files (model.json, metadata.json, weights*.bin) in:
 *
 *   server/model/cat/
 *
 * (a folder named "cat" right next to this file)
 * =============================================================================
 */

const tf = require("@tensorflow/tfjs");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const MODEL_DIR = path.join(__dirname, "cat");

let model;
let labels;

// Custom IO handler so plain tfjs can load the model files from disk
function fileHandler(dir) {
  return {
    async load() {
      const modelJSON = JSON.parse(
        fs.readFileSync(path.join(dir, "model.json"), "utf8")
      );

      const buffers = [];
      for (const group of modelJSON.weightsManifest) {
        for (const p of group.paths) {
          buffers.push(fs.readFileSync(path.join(dir, p)));
        }
      }
      const all = Buffer.concat(buffers);
      const weightData = all.buffer.slice(
        all.byteOffset,
        all.byteOffset + all.byteLength
      );

      return {
        modelTopology: modelJSON.modelTopology,
        weightSpecs: modelJSON.weightsManifest.flatMap((g) => g.weights),
        weightData,
        format: modelJSON.format,
        generatedBy: modelJSON.generatedBy,
        convertedBy: modelJSON.convertedBy,
      };
    },
  };
}

async function loadModel() {
  if (!model) {
    model = await tf.loadLayersModel(fileHandler(MODEL_DIR));
    const meta = JSON.parse(
      fs.readFileSync(path.join(MODEL_DIR, "metadata.json"), "utf8")
    );
    labels = meta.labels;
  }
  return model;
}

async function predict(inputData) {
  if (!inputData || !inputData.buffer || !inputData.buffer.length) {
    throw new Error("predict() received empty input");
  }

  const m = await loadModel();

  // Teachable Machine image models expect 224x224 RGB scaled to [-1, 1]
  const { data } = await sharp(inputData.buffer)
    .removeAlpha()
    .resize(224, 224, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const scores = tf.tidy(() => {
    const img = tf.tensor3d(new Uint8Array(data), [224, 224, 3], "float32");
    const input = img.div(127.5).sub(1).expandDims(0);
    return m.predict(input);
  });

  const probs = Array.from(await scores.data());
  scores.dispose();

  let best = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[best]) best = i;
  }

  return { label: labels[best], confidence: Number(probs[best].toFixed(4)) };
}

module.exports = { predict };