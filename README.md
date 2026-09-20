# White-Label AI Demo Template

A generic web app shell: UI + Express API + MySQL. It has **no training data**, **no pretrained weights**, and **no fixed model**. You plug in any model later by editing **one file**.

## What this template does

- Captures an image (upload or webcam frame)
- Sends it to `POST /api/predict`
- Calls `predict()` in the model adapter
- Shows `{ label, confidence }` and stores a history row in MySQL
- Lets you change the app name, logo, and a descriptive model label from Settings (stored in MySQL, loaded on every page)

## Project layout

```
white-label-ai-demo/
  client/                 React (Vite) frontend
  server/                 Express backend
  server/model/adapter.js << ONLY FILE TO EDIT TO PLUG IN A MODEL
  server/db/              MySQL connection + queries
  uploads/                logos and captured inputs
  schema.sql              CREATE TABLE + seed settings row
```

---

## 1. Create the database

Start MySQL (XAMPP default: user `root`, empty password, port `3306`).

**phpMyAdmin:** Import `schema.sql`.

**CLI:**

```bash
mysql -u root < schema.sql
```

**Without the mysql CLI** (uses Node + credentials in `server/.env`):

```bash
cd server
npm run init-db
```

This creates database `white_label_ai_demo`, tables `settings` and `predictions`, and one settings row:

| Field | Seed value |
|---|---|
| app_name | My AI App |
| logo_path | /uploads/default-logo.svg |
| active_model_name | No model connected yet |

## 2. Configure the server

```bash
cd server
copy .env.example .env
```

Edit `.env` if your MySQL credentials differ:

```
PORT=3001
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=white_label_ai_demo
```

## 3. Install and run

From `white-label-ai-demo/`:

```bash
npm run install:all
npm run dev
```

Or run each process yourself:

```bash
# terminal 1
cd server
npm install
npm run dev

# terminal 2
cd client
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

The mock adapter returns dummy labels so the app works before any real model exists.

---

## How to plug in a real AI model

**Edit only:** `server/model/adapter.js`

Replace the body of `predict(inputData)` so it returns:

```js
{ label: "some-class", confidence: 0.93 }
```

`inputData` is:

```js
{
  buffer,      // Node.js Buffer of the image bytes
  mimeType,    // e.g. "image/jpeg"
  filename,    // original or generated name
  source,      // "upload" | "webcam"
}
```

### Example: HTTP API (another service that already hosts your model)

```js
async function predict(inputData) {
  const form = new FormData();
  form.append("file", new Blob([inputData.buffer]), inputData.filename);

  const res = await fetch("https://your-model-host/predict", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  return { label: data.label, confidence: data.confidence };
}
```

### Example: local TensorFlow.js

```js
const tf = require("@tensorflow/tfjs-node");
let model;

async function loadModel() {
  if (!model) {
    model = await tf.loadLayersModel("file://./models/model.json");
  }
  return model;
}

async function predict(inputData) {
  const m = await loadModel();
  // decode, resize, and run your own preprocessing here
  // const output = m.predict(tensor);
  return { label: "replace-me", confidence: 0 };
}
```

Do **not** put datasets or `.h5` / `.onnx` / weight files in this repo unless you are the person deploying a specific model. This template stays empty on purpose.

The Settings field **Active model name** is only a label shown in the UI. Changing it does not load a model.

---

## How to change branding

1. Open **Settings** in the app
2. Change **App name**
3. Upload a **logo**
4. Optionally set **Active model name** (e.g. `Hand Gesture Recognition v1`)

Values are stored in the `settings` table (one row, `id = 1`) and applied to the header, page title, and favicon. There is no hardcoded product name in the UI.

---

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/settings` | Current branding + model label |
| PUT | `/api/settings` | Update name / model label / logo |
| POST | `/api/predict` | Run adapter + save history |
| GET | `/api/predictions` | History, newest first |
| DELETE | `/api/predictions` | Clear history |

`POST /api/predict` expects `multipart/form-data` with field `image` and optional `source` (`upload` or `webcam`).
