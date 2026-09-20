# White-Label AI Demo — Student Setup Instructions

---

## Step 0: Install Node.js (do this first, one time only)

`npm install` will not work at all until Node.js is installed on your computer.

## Linux
1. Directory must be in linux friendly filesystem type
2. in directory /client and /server, rm -rf node_modules package-lock.json
3. npm install in main directory, /client and /server directory

1. Open a browser and go to **nodejs.org**
2. Download the **LTS** version (the button usually says "Recommended for Most Users")
3. Run the installer and click **Next** through all screens, keeping every default option checked (especially "Add to PATH")
4. When installation finishes, **close any open Command Prompt / PowerShell / terminal windows**
5. Open a **new** Command Prompt or PowerShell window and check it worked:
   ```
   node -v
   npm -v
   ```
   You should see version numbers (e.g. `v20.11.0`). If you see "not recognized," restart your computer and try again.

---

## Step 1: Get the files

1. Unzip `white-label-ai-demo.zip` to your **Desktop** (or any folder you can find easily).
   - Right-click the zip file → **Extract All** → choose a destination → **Extract**
2. **If you get an error saying the zip is invalid or corrupted:**
   - The file was likely damaged during download or transfer
   - Ask your instructor for a fresh copy, or re-download it
   - Do not try to force-open a corrupted zip — it will cause missing-file errors later

---

## Step 2: Confirm you have the right folder (fixes the "no package.json" error)

Before running `npm install`, confirm the folder actually contains project files.

1. Open the extracted `white-label-ai-demo` folder in File Explorer
2. You should see a file named **`package.json`** somewhere inside (in the root folder, and/or inside a `server` folder if the project is split into frontend/backend)
3. **If you do NOT see a `package.json` file anywhere:**
   - The zip extracted incorrectly or was incomplete — go back to Step 1 and re-extract, or get a fresh zip file
   - You may have opened the wrong folder — check for a nested folder inside (sometimes a zip extracts into `white-label-ai-demo/white-label-ai-demo/`)
4. **If you see `package.json` but `npm install` still fails**, it's almost always because your terminal is open in the wrong folder — see Step 3.

---

## Step 3: Open a terminal in the correct folder

This is the step most students get wrong. The terminal must be opened **inside the project folder**, not the Desktop or anywhere else.

**Easiest method:**
1. Open the `white-label-ai-demo` folder in File Explorer
2. Click once in the address bar at the top (where the folder path is shown)
3. Type `cmd` and press **Enter**
4. A black terminal window opens, already inside the correct folder

**Confirm you're in the right place:**
```
dir
```
You should see `package.json` listed in the output. If you don't, you're in the wrong folder — go back and repeat the steps above.

---

## Step 4: Install dependencies

With your terminal open inside the project folder (confirmed in Step 3):

```
npm install
```

Wait for it to finish — this can take a minute or two and will create a new `node_modules` folder.

**If the project has a separate backend folder** (e.g. a folder named `server`):
1. In the same terminal, move into that folder:
   ```
   cd server
   ```
2. Run `npm install` again inside it
3. Move back out when done:
   ```
   cd ..
   ```

---

## Step 5: Set up MySQL

1. Make sure MySQL is running (e.g. start it from the **XAMPP Control Panel**)
2. Check your MySQL login:
   - If it uses the XAMPP default (username `root`, no password), skip to step 3 below
   - Otherwise, copy `server/.env.example` and rename the copy to `server/.env`, then open it in a text editor and fill in your actual MySQL username and password
3. Create the database. Open phpMyAdmin (or any MySQL client) and run:
   ```sql
   CREATE DATABASE white_label_ai_demo;
   ```

---

## Step 6: Start the app

From your terminal, still inside the project folder:

```
npm run dev
```

If the frontend and backend are separate, you need **two terminals running at the same time**:
1. One terminal inside the root folder running `npm run dev` (frontend)
2. Another terminal inside `server` running `npm run dev` (backend)

Leave both terminal windows open while you use the app — closing them shuts the app down.

---

## Step 7: Open it in your browser

- **UI:** http://localhost:5173
- **API:** http://localhost:3001

---

## Step 8: Try it out

- **Predict** — upload an image or use your webcam → sends the image to `/api/predict` and shows a label
- **History** — view past predictions logged in MySQL, newest first, with a "Clear History" button
- **Settings** — change the app name, upload a logo, and view the model label. These update the header, page title, and favicon automatically (all pulled from the `settings` table in the database)

---

## Step 9 (the actual assignment): Plug in your own trained model

Edit **only** this one file:
```
server/model/adapter.js
```

Replace the mock `predict()` function so it returns real results in this exact shape:
```js
{ label: "your_label", confidence: 0.94 }
```

You have three options depending on how you built your model:

### Option A — Teachable Machine (no-code)
1. Train your model at teachablemachine.withgoogle.com
2. Export it as **TensorFlow.js**
3. Load it inside `adapter.js` using the `@tensorflow/tfjs` library and run predictions there

### Option B — TensorFlow.js (JavaScript)
Train and save a TensorFlow.js model directly, then load and run it inside `adapter.js`.

### Option C — Python model + HTTP bridge (most common for ML classes)
1. Train your model in Python (TensorFlow/Keras, PyTorch, scikit-learn — whatever you used in class)
2. Save the trained model file (e.g. `.keras`, `.h5`, `.pt`)
3. Write a small Python script using Flask or FastAPI that loads the model and exposes one endpoint, e.g.:
   ```python
   from flask import Flask, request, jsonify

   app = Flask(__name__)

   @app.route('/predict', methods=['POST'])
   def predict():
       image = request.files['image']
       # run your model here
       return jsonify({ "label": "example", "confidence": 0.94 })

   app.run(port=5000)
   ```
4. Run that Python script separately (`python app.py`) alongside the Node app
5. In `adapter.js`, call your Python server over HTTP and return its response:
   ```js
   async function predict(imageData) {
     const response = await fetch('http://localhost:5000/predict', {
       method: 'POST',
       body: imageData
     });
     const result = await response.json();
     return { label: result.label, confidence: result.confidence };
   }
   ```

**Important for Option C:** your Python server must be running before you test Predict in the app, and the model file it loads (e.g. `chemical_sign_model.keras`) must actually exist in the same folder your Python script expects — if training didn't finish successfully, this file won't exist and you'll get a "file not found" error.

---

## Common problems and fixes

| Problem | Likely cause | Fix |
|---|---|---|
| `npm install` says "not recognized" | Node.js isn't installed | Redo Step 0 |
| `npm install` fails, no error about missing packages | Terminal is in the wrong folder | Redo Step 3, confirm with `dir` |
| No `package.json` found anywhere | Zip extracted incorrectly / incomplete | Re-extract or get a fresh zip |
| Zip won't extract, "invalid" error | Corrupted download/transfer | Re-download or re-copy the zip file fresh |
| App loads but Predict always shows the same fake label | You haven't edited `adapter.js` yet | Complete Step 9 |
| Python model app says "File not found: model.keras" | Training script never finished or saved to a different folder | Re-run your training script fully and confirm the `.keras` file appears in the expected folder before starting the Python server |
