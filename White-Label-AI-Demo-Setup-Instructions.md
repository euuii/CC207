# White-Label AI Demo — Setup Guide (Windows + Linux/Fedora)

## Step 0: Install Node.js (one time only)

`npm install` does not work until Node.js is installed. Install the **LTS** version (v20 or newer; the guide was tested on v24).

**Windows**

1. Go to **nodejs.org** and download the **LTS** version.
2. Run the installer and keep every default option checked, especially "Add to PATH".
3. Close all open terminal windows, then open a **new** Command Prompt or PowerShell.
4. Check that it worked:

```
node -v
npm -v
```

You should see version numbers. If you see "not recognized", restart your computer and try again.

**Linux (Fedora)**

```
sudo dnf install nodejs npm
node -v
npm -v
```

**Linux requirement:** keep the project on a Linux filesystem (ext4, xfs, btrfs). NTFS and exFAT drives break `node_modules`. Check with `df -T <your folder>`.

## Steps 1-3: Get the files and open a terminal in the right folder

Most setup errors come from a bad extract or a terminal opened in the wrong folder.

1. Unzip `white-label-ai-demo.zip` somewhere easy to find (Desktop on Windows, your home or a project folder on Linux).
2. If the zip is "invalid" or "corrupted", get a fresh copy. Do not force it open, because missing files cause errors later.
3. Open the extracted folder and look for `package.json`. A zip sometimes extracts into a nested folder (`white-label-ai-demo/white-label-ai-demo/`), so open the inner one.
4. Open a terminal **inside that folder**:
   - **Windows:** click the File Explorer address bar, type `cmd`, press Enter.
   - **Linux:** right-click the folder, choose "Open in Terminal", or run `cd /path/to/white-label-ai-demo`.
5. Confirm you are in the right place. You should see `package.json` plus the `client` and `server` folders:

```
dir        # Windows
ls         # Linux
```

## Step 4: Install dependencies (including TensorFlow.js and sharp)

The server's `model/adapter.js` needs `@tensorflow/tfjs` and `sharp`. If either is missing, the backend crashes on startup. The app then shows "Could not load settings from MySQL (500)" even when MySQL is fine.

From the project folder, run:

```
npm install
cd server
npm install
cd ../client
npm install
cd ..
npm install @tensorflow/tfjs sharp
```

Notes:

- Installing `@tensorflow/tfjs` and `sharp` in the **root** folder works, because Node finds packages by looking up the folder tree. Installing them in `server` also works.
- Use `@tensorflow/tfjs` (pure JavaScript). Avoid `@tensorflow/tfjs-node`, which often fails to build on new Node versions.
- npm may report "3 moderate severity vulnerabilities" and an `allow-scripts` warning for `core-js`. Both are safe to ignore here. Do **not** run `npm audit fix --force`.

**Linux clean reinstall** (only if installs fail or behave strangely):

```
rm -rf node_modules package-lock.json
cd server && rm -rf node_modules package-lock.json && cd ..
cd client && rm -rf node_modules package-lock.json && cd ..
```

Then repeat the install commands above.

## Step 5: Set up MySQL (XAMPP) and import schema.sql

1. Start MySQL.
   - **Windows:** open the XAMPP Control Panel and click Start next to MySQL.
   - **Linux:** run `sudo /opt/lampp/lampp start`. The repeated `egrep: warning: egrep is obsolescent` lines are harmless, and "already running" means it is up.
2. Open phpMyAdmin at `http://localhost/phpmyadmin`.
3. Import `schema.sql`: click the **Import** tab, choose the file, then click Import. It creates the database `white_label_ai_demo` with the `settings` and `predictions` tables, and one settings row ("My AI App"). You can also paste the file into the **SQL** tab.
4. Create `server/.env`. Copy `server/.env.example` and rename the copy to exactly `.env` (not `_env`, not `.env.example`). The XAMPP default looks like this:

```
PORT=3001
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=white_label_ai_demo
```

If `localhost` fails as a host, use `127.0.0.1`, because on Linux `localhost` can try a socket instead of TCP. Restart the backend after any `.env` change, since it only reads the file at startup.

**Linux check:** if Fedora's own `mariadb` or `mysqld` service holds port 3306, XAMPP's MySQL cannot take it. Check with `sudo ss -ltnp | grep 3306`, then stop the other service with `sudo systemctl stop mariadb mysqld`.

## Steps 6-8: Start the app and try it out

From the project root, one command starts both the server and the client:

```
npm run dev
```

If your project is set up with separate frontend and backend scripts instead, open two terminals: one in the root running `npm run dev`, the other in `server` running `npm run dev`. Leave them open while you use the app.

**Open it in your browser**

- UI: `http://localhost:5173`
- API: `http://localhost:3001`

**Quick health check**

```
curl http://localhost:3001/api/settings
```

This should return JSON containing "My AI App". The terminal should show the server listening, with no stack trace.

**What the app does**

- **Predict:** upload an image or use your webcam. It sends the image to `/api/predict` and shows a label.
- **History:** past predictions logged in MySQL, newest first, with a Clear History button.
- **Settings:** change the app name and logo and see the model label. The header, page title and favicon update automatically from the `settings` table.

## Step 9 (the assignment): Plug in your own trained model

Edit **only** `server/model/adapter.js`. Replace the mock `predict()` so it returns this exact shape:

```js
{ label: "your_label", confidence: 0.94 }
```

Choose the option that matches how you built your model.

**Option A: Teachable Machine (no code)**

1. Train your model at teachablemachine.withgoogle.com.
2. Export it as **TensorFlow.js**.
3. Load it in `adapter.js` with `@tensorflow/tfjs` and run predictions there.

**Option B: TensorFlow.js (JavaScript)**

Train and save a TensorFlow.js model, then load and run it inside `adapter.js`.

**Option C: Python model plus HTTP bridge (most common for ML classes)**

1. Train your model in Python (TensorFlow/Keras, PyTorch or scikit-learn) and save it, for example as `.keras`, `.h5` or `.pt`.
2. Write a small Flask or FastAPI script that loads the model and exposes one endpoint:

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

3. Run it separately with `python app.py`, alongside the Node app.
4. In `adapter.js`, call the Python server and return its response:

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

**Option C reminder:** the Python server must be running before you test Predict. The model file it loads (for example `chemical_sign_model.keras`) must exist in the folder the script expects. If training did not finish, the file will be missing and you will get a "file not found" error.

## Common problems and fixes

The first rows cover the most frequent failure: the settings error caused by a backend crash.

| Problem | Likely cause | Fix |
| --- | --- | --- |
| "Could not load settings from MySQL: Request failed (500)" | The backend crashed or is not running, so Vite reports a 500 | Read the backend terminal. Fix the error shown there (usually a missing package), then restart |
| `Cannot find module '@tensorflow/tfjs'` or `'sharp'` | Package not installed | Run `npm install @tensorflow/tfjs sharp` in the root (or `server`) folder |
| `ECONNREFUSED` to port 3306 | MySQL not running, or another MySQL service is on 3306 | Start MySQL (`sudo /opt/lampp/lampp start` on Linux). Check `sudo ss -ltnp \| grep 3306` |
| `Access denied for user` | Wrong username or password in `server/.env` | XAMPP default is `root` with an empty password |
| `Unknown database` or `Table ... settings doesn't exist` | `schema.sql` not imported into `white_label_ai_demo` | Re-import it in phpMyAdmin (Import or SQL tab) |
| `.env` changes have no effect | Backend not restarted, or file misnamed | Name it exactly `server/.env` and restart the backend |
| `npm install` says "not recognized" | Node.js not installed | Redo Step 0 |
| `npm install` fails, or no `package.json` found | Terminal in the wrong folder, or incomplete zip | Redo Steps 1-3 and confirm with `dir` / `ls` |
| Zip will not extract | Corrupted download | Get a fresh copy of the zip |
| `npm install` fails on Linux | Drive is NTFS/exFAT, or stale `node_modules` | Use an ext4/xfs/btrfs drive. Delete `node_modules` and `package-lock.json`, then reinstall |
| Predict always shows the same fake label | `adapter.js` not edited yet | Complete Step 9 |
| Python model app says "File not found: model.keras" | Training never finished or saved elsewhere | Re-run training and confirm the `.keras` file exists before starting the Python server |
