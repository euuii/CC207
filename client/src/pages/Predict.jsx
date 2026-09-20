import { useEffect, useRef, useState } from "react";
import { runPredict } from "../api";

export default function PredictPage() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [source, setSource] = useState("upload");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Webcam not available: " + err.message);
    }
  }

  function onFile(e) {
    const next = e.target.files?.[0];
    if (!next) return;
    setFile(next);
    setSource("upload");
    setPreview(URL.createObjectURL(next));
    setResult(null);
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const captured = new File([blob], "webcam-frame.png", {
          type: "image/png",
        });
        setFile(captured);
        setSource("webcam");
        setPreview(URL.createObjectURL(captured));
        setResult(null);
      },
      "image/png",
      0.92
    );
  }

  async function submit() {
    if (!file) {
      setError("Choose an image or capture a webcam frame first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("source", source);
      const data = await runPredict(form);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h1>Input</h1>
      <p className="muted">
        Upload an image or capture a webcam frame. The server sends it to{" "}
        <code>server/model/adapter.js</code>.
      </p>

      <div className="row">
        <label className="btn">
          Upload image
          <input type="file" accept="image/*" onChange={onFile} hidden />
        </label>
        {!cameraOn ? (
          <button type="button" className="btn secondary" onClick={startCamera}>
            Open webcam
          </button>
        ) : (
          <>
            <button type="button" className="btn secondary" onClick={captureFrame}>
              Capture frame
            </button>
            <button type="button" className="btn ghost" onClick={stopCamera}>
              Stop webcam
            </button>
          </>
        )}
      </div>

      {cameraOn ? (
        <video ref={videoRef} autoPlay playsInline className="preview" />
      ) : null}

      {preview ? (
        <div>
          <div className="label">Selected input ({source})</div>
          <img src={preview} alt="Selected input" className="preview" />
        </div>
      ) : null}

      <button type="button" className="btn" onClick={submit} disabled={busy}>
        {busy ? "Running…" : "Run prediction"}
      </button>

      {error ? <p className="error-text">{error}</p> : null}

      {result ? (
        <div className="result">
          <h2>Result</h2>
          <p>
            <strong>Label:</strong> {result.label}
          </p>
          <p>
            <strong>Confidence:</strong>{" "}
            {(Number(result.confidence) * 100).toFixed(1)}%
          </p>
          <p>
            <strong>Timestamp:</strong>{" "}
            {new Date(result.created_at).toLocaleString()}
          </p>
        </div>
      ) : null}
    </section>
  );
}
