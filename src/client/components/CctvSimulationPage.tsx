import { AlertTriangle, Camera, Check, Flame, RadioTower, Route, ScanEye, ShieldAlert, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cctvSampleClips, runCctvYoloSimulation, type CctvDetectionResult } from "../../shared/cctvDetection";
import type { AppState, Hazard, LocalModelStatus, Node, RouteResult } from "../../shared/types";
import { hasLoadedYoloHazardModel, loadYoloHazardModel, loadYoloHazardModelFromUrl, runYoloHazardDetection } from "../ml/yoloHazardModel";
import { MapCanvas } from "./MapCanvas";

interface CctvSimulationPageProps {
  state: AppState;
  route?: RouteResult;
  selectedNodeId: string;
  busy: boolean;
  message: string;
  localModelStatus?: LocalModelStatus;
  onSelectNode: (nodeId: string) => void;
  onDetectedHazard: (hazard: Omit<Hazard, "id" | "createdAt">, routePayload: { personId?: string; startNodeId?: string }) => void;
  onCalculateRoute: (payload: { personId?: string; startNodeId?: string }) => void;
  onResetSimulation: () => void;
}

export function CctvSimulationPage({
  state,
  route,
  selectedNodeId,
  busy,
  message,
  localModelStatus,
  onSelectNode,
  onDetectedHazard,
  onCalculateRoute,
  onResetSimulation
}: CctvSimulationPageProps) {
  const cameraNodes = state.nodes.filter((node) => node.type === "camera");
  const hazardNodes = state.nodes.filter((node) => node.type !== "camera" && node.type !== "sensor" && node.type !== "actuator");
  const [clipId, setClipId] = useState(cctvSampleClips[1]?.id ?? cctvSampleClips[0].id);
  const [cameraNodeId, setCameraNodeId] = useState(cameraNodes[0]?.id ?? "");
  const [startNodeId, setStartNodeId] = useState("room-101");
  const [lastResult, setLastResult] = useState<CctvDetectionResult | undefined>();
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [uploadedVideoName, setUploadedVideoName] = useState("");
  const [modelName, setModelName] = useState("");
  const [modelStatus, setModelStatus] = useState("No ONNX model loaded.");
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelPickerResult, setModelPickerResult] = useState<"success" | "error" | null>(null);
  const [modelPickerMessage, setModelPickerMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [monitoring, setMonitoring] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const inferenceRunningRef = useRef(false);
  const videoFrameCallbackRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectedClip = cctvSampleClips.find((clip) => clip.id === clipId) ?? cctvSampleClips[0];
  const selectedNode = state.nodes.find((node) => node.id === selectedNodeId) ?? hazardNodes[0];
  const selectedCamera = state.nodes.find((node) => node.id === cameraNodeId) ?? cameraNodes[0];
  const startNode = state.nodes.find((node) => node.id === startNodeId) ?? state.nodes[0];
  const hasModelSource = Boolean(localModelStatus?.hasOnnx || localModelStatus?.hasRemoteOnnx);

  const detectionRows = useMemo(
    () => [
      { label: "Model", value: hasLoadedYoloHazardModel() ? modelName || "Uploaded YOLO ONNX" : "YOLO hazard simulation" },
      { label: "Source", value: uploadedVideoName || selectedClip.label },
      { label: "Camera", value: selectedCamera?.label ?? "Manual CCTV feed" },
      { label: "Mapped node", value: selectedNode?.label ?? "Select node" },
      { label: "Frames checked", value: String(frameCount) }
    ],
    [frameCount, modelName, selectedCamera?.label, selectedClip.label, selectedNode?.label, uploadedVideoName]
  );


  useEffect(() => {
    if (!monitoring) {
      return undefined;
    }

    const video = videoRef.current;
    const requestVideoFrameCallback = video?.requestVideoFrameCallback;
    if (video && requestVideoFrameCallback) {
      const onFrame: VideoFrameRequestCallback = () => {
        void runDetection({ fromLoop: true });
        if (videoFrameCallbackRef.current !== null) {
          videoFrameCallbackRef.current = video.requestVideoFrameCallback(onFrame);
        }
      };

      videoFrameCallbackRef.current = video.requestVideoFrameCallback(onFrame);
      return () => {
        if (videoFrameCallbackRef.current !== null) {
          video.cancelVideoFrameCallback(videoFrameCallbackRef.current);
          videoFrameCallbackRef.current = null;
        }
      };
    }

    const interval = window.setInterval(() => {
      void runDetection({ fromLoop: true });
    }, 180);

    return () => window.clearInterval(interval);
  }, [monitoring, uploadedVideoUrl, selectedNode?.id, startNode?.id, alertTriggered]);

  function primeSpeech() {
    if (!window.speechSynthesis) return;
    const primer = new SpeechSynthesisUtterance(" ");
    primer.volume = 0;
    window.speechSynthesis.speak(primer);
  }

  function speakAlert(hazardType: string) {
    if (!window.speechSynthesis) return;
    const text =
      hazardType === "fire"
        ? "Fire detected. Sending message to fire brigade."
        : hazardType === "smoke"
          ? "Smoke detected. Sending message to fire brigade."
          : `${hazardType} detected. Authorities have been alerted.`;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.75;
    msg.pitch = 1;
    msg.volume = 1;
    window.speechSynthesis.speak(msg);
  }

  async function runDetection(options: { fromLoop?: boolean } = {}) {
    if (options.fromLoop && (!uploadedVideoUrl || !hasLoadedYoloHazardModel() || !videoRef.current || videoRef.current.paused || videoRef.current.ended)) {
      return;
    }

    if (inferenceRunningRef.current) {
      return;
    }

    inferenceRunningRef.current = true;
    setLocalError("");
    let result: CctvDetectionResult;
    try {
      result =
        uploadedVideoUrl && hasLoadedYoloHazardModel() && videoRef.current
          ? await runYoloHazardDetection(videoRef.current)
          : runCctvYoloSimulation(clipId);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Model inference failed.");
      inferenceRunningRef.current = false;
      return;
    }
    inferenceRunningRef.current = false;

    setLastResult(result);
    setFrameCount((count) => count + 1);

    if (!result.isHazard || !result.hazardType || !result.severity || !selectedNode || alertTriggered) {
      return;
    }

    setAlertTriggered(true);
    setMonitoring(false);
    speakAlert(result.hazardType);
    onDetectedHazard(
      {
        type: result.hazardType,
        severity: result.severity,
        radius: result.severity === "critical" ? 145 : result.severity === "high" ? 115 : 85,
        label: `${result.hazardType} detected by ${selectedCamera?.label ?? "CCTV"} near ${selectedNode.label}`,
        nodeId: selectedNode.id,
        x: selectedNode.x,
        y: selectedNode.y,
        active: true
      },
      startNode ? { startNodeId: startNode.id } : {}
    );
  }

  async function handleModelUpload(file: File, andStart = false) {
    setLocalError("");
    setModelPickerResult(null);
    setModelPickerMessage("Reading model file…");
    setDownloadPercent(50);
    try {
      await loadYoloHazardModel(file);
      setDownloadPercent(null);
      setModelName(file.name);
      setModelStatus("ONNX model loaded.");
      setModelPickerResult("success");
      setModelPickerMessage("Model loaded successfully.");
      if (andStart) setTimeout(() => { setShowModelPicker(false); void beginDetectionAfterLoad(); }, 1200);
    } catch (error) {
      setDownloadPercent(null);
      const msg = error instanceof Error ? error.message : "Could not load ONNX model.";
      setModelStatus(`Model failed to load: ${msg}`);
      setModelPickerResult("error");
      setModelPickerMessage("Model did not load. Please try again or use a different file.");
      if (!andStart) setLocalError(msg);
    }
  }

  async function handleLoadLocalOnnx(andStart = false) {
    setLocalError("");
    setModelPickerResult(null);
    setModelPickerMessage("");
    setDownloadPercent(0);
    setModelStatus("Downloading ONNX model from Hugging Face...");
    try {
      // Always go through our API proxy — direct HuggingFace URLs hit CORS issues
      // on deployed environments. The proxy fetches server-side and streams back.
      const modelUrl = "/api/models/local-yolo/model.onnx";
      await loadYoloHazardModelFromUrl(modelUrl, (pct) => {
        setDownloadPercent(pct);
        setModelPickerMessage(pct < 100 ? `Downloading model… ${pct}%` : "Compiling ONNX model, please wait…");
      });
      setDownloadPercent(null);
      setModelName(localModelStatus?.hasOnnx ? "yolo_model_bin/resq-fire-smoke-yolo.onnx" : "Hugging Face fire-smoke ONNX");
      setModelStatus("ONNX model loaded.");
      setModelPickerResult("success");
      setModelPickerMessage("Model loaded successfully.");
      if (andStart) setTimeout(() => { setShowModelPicker(false); void beginDetectionAfterLoad(); }, 1200);
    } catch (error) {
      setDownloadPercent(null);
      const msg = error instanceof Error ? error.message : "Could not load ONNX model.";
      setModelStatus(`Model failed to load: ${msg}`);
      setModelPickerResult("error");
      setModelPickerMessage(`Model did not load: ${msg}`);
      if (!andStart) setLocalError(msg);
    }
  }

  async function beginDetectionAfterLoad() {
    if (!videoRef.current) return;
    setAlertTriggered(false);
    setMonitoring(true);
    primeSpeech();
    await videoRef.current.play().catch(() => {
      setMonitoring(false);
      setLocalError("The browser blocked video playback. Press play on the video, then start live simulation again.");
    });
    void runDetection({ fromLoop: true });
  }

  function handleVideoUpload(file: File) {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    setUploadedVideoUrl(URL.createObjectURL(file));
    setUploadedVideoName(file.name);
    setLastResult(undefined);
    setFrameCount(0);
    setAlertTriggered(false);
    setMonitoring(false);
  }

  async function startLiveSimulation() {
    if (!uploadedVideoUrl || !videoRef.current) {
      setLocalError("Upload a CCTV video before starting detection.");
      return;
    }

    setLocalError("");
    if (!hasLoadedYoloHazardModel()) {
      setShowModelPicker(true);
      return;
    }

    setAlertTriggered(false);
    setMonitoring(true);
    await videoRef.current.play().catch(() => {
      setMonitoring(false);
      setLocalError("The browser blocked video playback. Press play on the video, then start live simulation again.");
    });

    void runDetection({ fromLoop: true });
  }

  function stopLiveSimulation() {
    setMonitoring(false);
  }

  function resetSimulation() {
    setMonitoring(false);
    setLastResult(undefined);
    setFrameCount(0);
    setAlertTriggered(false);
    setLocalError("");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    onResetSimulation();
  }

  return (
    <div className="cctv-page">
      <div className="dashboard-grid cctv-grid">
        <section className="workspace">
          <h3 className="page-title">Simulating Hazard Through CCTV</h3>
          <MapCanvas state={state} selectedNodeId={selectedNode?.id} route={route} onNodeSelect={onSelectNode} />
        </section>

        <aside className="control-stack">
          <section className="panel">
            <h3>
              <Video size={18} />
              CCTV video source
            </h3>
            {uploadedVideoUrl ? (
              <div className="cctv-video cctv-video--uploaded">
                <video ref={videoRef} src={uploadedVideoUrl} controls muted playsInline preload="metadata" />
                {lastResult?.bbox ? (
                  <span
                    className="cctv-bbox"
                    style={{
                      left: `${lastResult.bbox.x}%`,
                      top: `${lastResult.bbox.y}%`,
                      width: `${lastResult.bbox.width}%`,
                      height: `${lastResult.bbox.height}%`
                    }}
                  />
                ) : null}
              </div>
            ) : (
              <div className={`cctv-video cctv-video--${selectedClip.status}`}>
                <div className="cctv-video__scan" />
                <div className="cctv-video__noise" />
                {selectedClip.bbox ? (
                  <span
                    className="cctv-bbox"
                    style={{
                      left: `${selectedClip.bbox.x}%`,
                      top: `${selectedClip.bbox.y}%`,
                      width: `${selectedClip.bbox.width}%`,
                      height: `${selectedClip.bbox.height}%`
                    }}
                  />
                ) : null}
                <strong>{selectedClip.label}</strong>
                <small>{selectedClip.description}</small>
              </div>
            )}
            <label className="file-drop file-drop--compact">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleVideoUpload(file);
                }}
              />
              <span>Upload CCTV video</span>
              <small>{uploadedVideoName || "MP4, WebM, or MOV"}</small>
            </label>
            {!uploadedVideoUrl ? (
              <label>
                Sample CCTV clip
                <select value={clipId} onChange={(event) => setClipId(event.target.value)}>
                  {cctvSampleClips.map((clip) => (
                    <option key={clip.id} value={clip.id}>
                      {clip.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </section>

          <section className="panel">
            <h3>
              <ScanEye size={18} />
              YOLO model
            </h3>

            {/* Model picker modal */}
            {showModelPicker ? (
              <div className="model-picker" onClick={(e) => { if (e.target === e.currentTarget && !downloadPercent) setShowModelPicker(false); }}>
                <div className="model-picker__dialog">
                  {/* Phase 1 — choose source */}
                  {modelPickerResult === null && downloadPercent === null ? (
                    <>
                      <p className="model-picker__title">Select model source</p>
                      <p className="model-picker__label">No ONNX model is loaded. Choose how to load it before starting detection.</p>
                      <div className="model-picker__options">
                        <label className="model-picker__option">
                          <input
                            type="file"
                            accept=".onnx,application/octet-stream"
                            style={{ display: "none" }}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void handleModelUpload(file, true);
                            }}
                          />
                          <span className="model-picker__btn">Upload local .onnx file</span>
                        </label>
                        <span className="model-picker__divider">or</span>
                        <button className="model-picker__btn model-picker__btn--remote" onClick={() => void handleLoadLocalOnnx(true)}>
                          Load from Hugging Face (remote)
                        </button>
                      </div>
                      <div className="model-picker__footer">
                        <button className="model-picker__cancel" onClick={() => setShowModelPicker(false)}>Cancel</button>
                      </div>
                    </>
                  ) : null}

                  {/* Phase 2 — loading */}
                  {downloadPercent !== null ? (
                    <div className="model-picker__loading">
                      <p className="model-picker__title">Loading model…</p>
                      <div className="model-picker__progress-track">
                        <div className="model-picker__progress-bar" style={{ width: `${downloadPercent}%` }} />
                      </div>
                      <p className="model-picker__label">{modelPickerMessage || `Downloading… ${downloadPercent}%`}</p>
                    </div>
                  ) : null}

                  {/* Phase 3 — result */}
                  {modelPickerResult !== null && downloadPercent === null ? (
                    <div className={`model-picker__result model-picker__result--${modelPickerResult}`}>
                      <span className="model-picker__result-icon">{modelPickerResult === "success" ? "✓" : "✕"}</span>
                      <p className="model-picker__title">{modelPickerResult === "success" ? "Model loaded successfully" : "Model did not load"}</p>
                      <p className="model-picker__label">{modelPickerMessage}</p>
                      <div className="model-picker__footer">
                        {modelPickerResult === "error" ? (
                          <button className="model-picker__btn model-picker__btn--remote" style={{ width: "auto", padding: "8px 16px" }}
                            onClick={() => { setModelPickerResult(null); setModelPickerMessage(""); }}>
                            Try again
                          </button>
                        ) : null}
                        <button className="model-picker__cancel" onClick={() => { setShowModelPicker(false); setModelPickerResult(null); }}>
                          {modelPickerResult === "success" ? "Close" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!showModelPicker ? (
              <label className="file-drop file-drop--compact">
                <input
                  type="file"
                  accept=".onnx,application/octet-stream"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleModelUpload(file);
                  }}
                />
                <span>Upload fire/smoke YOLO ONNX</span>
                <small>{modelName || "Export a trained YOLO fire-smoke model to ONNX"}</small>
              </label>
            ) : null}

            {!showModelPicker ? (
              <button className="secondary-action" onClick={() => { setModelPickerResult(null); setModelPickerMessage(""); setShowModelPicker(true); }}>
                Load fire-smoke ONNX
              </button>
            ) : null}
            <div className="info-list">
              {localModelStatus && downloadPercent === null ? <span>{localModelStatus.message}</span> : null}
              {downloadPercent === null ? <span>{modelStatus}</span> : null}
            </div>
          </section>

          <section className="panel">
            <h3>
              <Camera size={18} />
              Event mapping
            </h3>
            <div className="form-grid">
              <label>
                CCTV camera
                <select value={selectedCamera?.id ?? ""} onChange={(event) => setCameraNodeId(event.target.value)}>
                  <option value="">Manual CCTV feed</option>
                  {cameraNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Hazard node on map
                <select value={selectedNode?.id ?? ""} onChange={(event) => onSelectNode(event.target.value)}>
                  {hazardNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Evacuation start
                <select value={startNode?.id ?? ""} onChange={(event) => setStartNodeId(event.target.value)}>
                  {state.nodes
                    .filter((node) => node.type !== "camera" && node.type !== "sensor")
                    .map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                </select>
              </label>
              {uploadedVideoUrl ? (
                <button
                  className={monitoring ? "secondary-action secondary-action--live" : "danger-action"}
                  disabled={busy || !selectedNode}
                  onClick={() => { if (!monitoring) primeSpeech(); monitoring ? stopLiveSimulation() : void startLiveSimulation(); }}
                >
                  <RadioTower size={16} />
                  {monitoring ? "Stop detection" : "Start video and detect hazards"}
                </button>
              ) : (
                <button className="danger-action" disabled={busy || !selectedNode} onClick={() => { primeSpeech(); void runDetection(); }}>
                  <ScanEye size={16} />
                  Run sample detection
                </button>
              )}
            </div>
            <div className="cctv-details">
              {detectionRows.map((row) => (
                <span key={row.label}>
                  <strong>{row.label}</strong>
                  {row.value}
                </span>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3>
              <AlertTriangle size={18} />
              Detection result
            </h3>
            {lastResult ? (
              <div className={lastResult.isHazard ? "cctv-result cctv-result--hazard" : "cctv-result cctv-result--clear"}>
                {lastResult.isHazard ? <Flame size={20} /> : <Check size={20} />}
                <div>
                  <strong>{lastResult.isHazard ? "Hazard detected" : "No hazard detected"}</strong>
                  <span>{lastResult.message}</span>
                  <small>Class: {lastResult.label}</small>
                </div>
              </div>
            ) : (
              <p className="muted">
                {uploadedVideoUrl ? "Click Start video and detect hazards to scan the uploaded footage continuously." : "Run sample detection to classify the selected CCTV sample."}
              </p>
            )}
            {monitoring ? <p className="live-status">Live simulation scanning uploaded video frames...</p> : null}
            {alertTriggered ? <p className="live-status live-status--alert">Hazard alert triggered from live video stream.</p> : null}
            {localError ? <p className="status-message status-message--error">{localError}</p> : null}
            {route ? (
              <div className={`route-result route-result--${route.status}`}>
                <strong>{route.status === "ok" ? "Best path recalculated" : "No safe route"}</strong>
                <span>{route.message}</span>
              </div>
            ) : null}
            <button className="secondary-action" onClick={() => speakAlert("fire")}>
              Test audio alert
            </button>
            <button className="secondary-action" disabled={!startNode} onClick={() => startNode && onCalculateRoute({ startNodeId: startNode.id })}>
              Calculate route only
            </button>
            <button className="secondary-action" onClick={resetSimulation}>
              Reset CCTV simulation
            </button>
            {message ? <p className="status-message">{message}</p> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
