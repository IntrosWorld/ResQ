import { AlertTriangle, Camera, Check, RadioTower, ScanEye, ShieldAlert, Upload, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CctvDetectionResult } from "../../shared/cctvDetection";
import type { AppState, Hazard, LocalModelStatus, Node, RouteResult } from "../../shared/types";
import {
  hasLoadedYoloCollapseModel,
  loadYoloCollapseModel,
  loadYoloCollapseModelFromUrl,
  runYoloCollapseDetection
} from "../ml/yoloCollapseModel";
import { MapCanvas } from "./MapCanvas";

interface CollapseDetectionPageProps {
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
  onResetFloorMap: () => void;
}

export function CollapseDetectionPage({
  state,
  route,
  selectedNodeId,
  busy,
  message,
  localModelStatus,
  onSelectNode,
  onDetectedHazard,
  onCalculateRoute,
  onResetSimulation,
  onResetFloorMap
}: CollapseDetectionPageProps) {
  const cameraNodes = state.nodes.filter((node) => node.type === "camera");
  const mapNodes = state.nodes.filter((node) => node.type !== "camera" && node.type !== "sensor" && node.type !== "actuator");
  const [cameraNodeId, setCameraNodeId] = useState(cameraNodes[0]?.id ?? "");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [uploadedVideoName, setUploadedVideoName] = useState("");
  const [modelName, setModelName] = useState("");
  const [modelStatus, setModelStatus] = useState("No FallSafe ONNX model loaded.");
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelPickerResult, setModelPickerResult] = useState<"success" | "error" | null>(null);
  const [modelPickerMessage, setModelPickerMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [monitoring, setMonitoring] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [lastResult, setLastResult] = useState<CctvDetectionResult | undefined>();
  const inferenceRunningRef = useRef(false);
  const videoFrameCallbackRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectedCamera = state.nodes.find((node) => node.id === cameraNodeId) ?? cameraNodes[0];
  const detectedLocation = resolveDetectedLocation(selectedCamera, mapNodes, selectedNodeId);
  const hasModelSource = Boolean(localModelStatus?.hasOnnx || localModelStatus?.hasRemoteOnnx);

  const detectionRows = useMemo(
    () => [
      { label: "Model", value: hasLoadedYoloCollapseModel() ? modelName || "FallSafe YOLO11 ONNX" : "Not loaded" },
      { label: "Source", value: uploadedVideoName || "No uploaded video" },
      { label: "Camera", value: selectedCamera?.label ?? "Manual CCTV feed" },
      { label: "Detected location", value: detectedLocation?.label ?? "Select camera" },
      { label: "Frames checked", value: String(frameCount) }
    ],
    [detectedLocation?.label, frameCount, modelName, selectedCamera?.label, uploadedVideoName]
  );


  useEffect(() => {
    if (!monitoring) {
      return undefined;
    }

    const video = videoRef.current;
    const requestVideoFrameCallback = video?.requestVideoFrameCallback;
    if (video && requestVideoFrameCallback) {
      const onFrame: VideoFrameRequestCallback = () => {
        void runDetection();
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
      void runDetection();
    }, 180);

    return () => window.clearInterval(interval);
  }, [monitoring, uploadedVideoUrl, detectedLocation?.id, alertTriggered]);

  useEffect(() => {
    if (detectedLocation && detectedLocation.id !== selectedNodeId) {
      onSelectNode(detectedLocation.id);
    }
  }, [detectedLocation?.id, selectedNodeId, onSelectNode]);

  async function handleModelUpload(file: File, andStart = false) {
    setLocalError("");
    setModelPickerResult(null);
    setModelPickerMessage("Reading model file…");
    setDownloadPercent(50);
    try {
      await loadYoloCollapseModel(file);
      setDownloadPercent(null);
      setModelName(file.name);
      setModelStatus("FallSafe ONNX loaded.");
      setModelPickerResult("success");
      setModelPickerMessage("Model loaded successfully.");
      if (andStart) setTimeout(() => { setShowModelPicker(false); void beginDetectionAfterLoad(); }, 1200);
    } catch (error) {
      setDownloadPercent(null);
      const msg = error instanceof Error ? error.message : "Could not load FallSafe ONNX model.";
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
    setModelStatus("Downloading FallSafe ONNX model from Hugging Face...");
    try {
      // Always go through our API proxy — direct HuggingFace URLs hit CORS issues
      // on deployed environments. The proxy fetches server-side and streams back.
      const modelUrl = "/api/models/fallsafe/model.onnx";
      await loadYoloCollapseModelFromUrl(modelUrl, (pct) => {
        setDownloadPercent(pct);
        setModelPickerMessage(pct < 100 ? `Downloading model… ${pct}%` : "Compiling ONNX model, please wait…");
      });
      setDownloadPercent(null);
      setModelName(localModelStatus?.hasOnnx ? "fallsafe_model_bin/resq-fallsafe-collapse.onnx" : "Hugging Face FallSafe ONNX");
      setModelStatus("FallSafe ONNX loaded.");
      setModelPickerResult("success");
      setModelPickerMessage("Model loaded successfully.");
      if (andStart) setTimeout(() => { setShowModelPicker(false); void beginDetectionAfterLoad(); }, 1200);
    } catch (error) {
      setDownloadPercent(null);
      const msg = error instanceof Error ? error.message : "Could not load FallSafe ONNX model.";
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
    await videoRef.current.play().catch(() => {
      setMonitoring(false);
      setLocalError("The browser blocked video playback. Press play on the video, then start detection again.");
    });
    void runDetection();
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

  async function startDetection() {
    if (!uploadedVideoUrl || !videoRef.current) {
      setLocalError("Upload a CCTV video before starting collapse detection.");
      return;
    }

    setLocalError("");
    if (!hasLoadedYoloCollapseModel()) {
      setShowModelPicker(true);
      return;
    }

    void beginDetectionAfterLoad();
  }

  async function runDetection() {
    if (!uploadedVideoUrl || !hasLoadedYoloCollapseModel() || !videoRef.current || videoRef.current.paused || videoRef.current.ended || inferenceRunningRef.current) {
      return;
    }

    inferenceRunningRef.current = true;
    setLocalError("");
    let result: CctvDetectionResult;
    try {
      result = await runYoloCollapseDetection(videoRef.current);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "FallSafe inference failed.");
      inferenceRunningRef.current = false;
      return;
    }
    inferenceRunningRef.current = false;

    setLastResult(result);
    setFrameCount((count) => count + 1);

    if (!result.isHazard || !result.severity || !detectedLocation || alertTriggered) {
      return;
    }

    setAlertTriggered(true);
    setMonitoring(false);
    onDetectedHazard(
      {
        type: "structural",
        severity: result.severity,
        radius: result.severity === "critical" ? 70 : result.severity === "high" ? 55 : 40,
        label: `Collapse/fall detected by ${selectedCamera?.label ?? "CCTV"} near ${detectedLocation.label}`,
        x: detectedLocation.x + 12,
        y: detectedLocation.y + 12,
        active: true
      },
      { startNodeId: detectedLocation.id }
    );
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
          <MapCanvas state={state} selectedNodeId={detectedLocation?.id} route={route} onNodeSelect={onSelectNode} onResetFloorMap={onResetFloorMap} />
        </section>

        <aside className="control-stack collapse-sidebar">
          <section className="panel collapse-video-panel">
            <h3>
              <ShieldAlert size={18} />
              Emergency Collapse Detection
            </h3>
            <div className="cctv-video cctv-video--uploaded cctv-video--collapse">
              {uploadedVideoUrl ? (
                <>
                  <video ref={videoRef} src={uploadedVideoUrl} controls muted playsInline preload="metadata" />
                  {lastResult?.bbox ? (
                    <span
                      className="cctv-bbox cctv-bbox--collapse"
                      style={{
                        left: `${lastResult.bbox.x}%`,
                        top: `${lastResult.bbox.y}%`,
                        width: `${lastResult.bbox.width}%`,
                        height: `${lastResult.bbox.height}%`
                      }}
                    />
                  ) : null}
                </>
              ) : (
                <div className="cctv-empty">
                  <Video size={28} />
                  <strong>Upload CCTV footage</strong>
                  <small>FallSafe YOLO11 will scan frames like a live camera stream.</small>
                </div>
              )}
            </div>
          </section>

          <div className="collapse-scroll-stack">
            <section className="panel">
              <h3>
                <Upload size={18} />
                Video source
              </h3>
              <label className={uploadedVideoName ? "file-drop file-drop--compact file-drop--inline" : "file-drop file-drop--compact"}>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleVideoUpload(file);
                  }}
                />
                <Upload size={16} />
                <span>Upload collapse CCTV video</span>
                <small>{uploadedVideoName || "MP4, WebM, or MOV"}</small>
              </label>
            </section>

            <section className="panel">
              <h3>
                <ScanEye size={18} />
                FallSafe model
              </h3>

              {showModelPicker ? (
                <div className="model-picker" onClick={(e) => { if (e.target === e.currentTarget && !downloadPercent) setShowModelPicker(false); }}>
                  <div className="model-picker__dialog">
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
                    {downloadPercent !== null ? (
                      <div className="model-picker__loading">
                        <p className="model-picker__title">Loading model…</p>
                        <div className="model-picker__progress-track">
                          <div className="model-picker__progress-bar" style={{ width: `${downloadPercent}%` }} />
                        </div>
                        <p className="model-picker__label">{modelPickerMessage || `Downloading… ${downloadPercent}%`}</p>
                      </div>
                    ) : null}
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
                  <span>Upload FallSafe YOLO11 ONNX</span>
                  <small>{modelName || "Export FallSafe model/model.pt to ONNX"}</small>
                </label>
              ) : null}

              {!showModelPicker ? (
                <button className="secondary-action" onClick={() => { setModelPickerResult(null); setModelPickerMessage(""); setShowModelPicker(true); }}>
                  Load FallSafe ONNX
                </button>
              ) : null}
              <div className="info-list">
                <span>Source model: FallSafe/FallSafe-yolo11, trained with `fall` and `nofall` labels.</span>
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
                <div className="mapped-location">
                  <span>Detected location</span>
                  <strong>{detectedLocation?.label ?? "Select a camera"}</strong>
                  <small>Auto-mapped from the selected CCTV camera.</small>
                </div>
                <button className={monitoring ? "secondary-action secondary-action--live" : "danger-action"} disabled={busy || !detectedLocation} onClick={() => (monitoring ? setMonitoring(false) : void startDetection())}>
                  <RadioTower size={16} />
                  {monitoring ? "Stop collapse detection" : "Start video and detect collapse"}
                </button>
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
                  {lastResult.isHazard ? <ShieldAlert size={20} /> : <Check size={20} />}
                  <div>
                    <strong>{lastResult.isHazard ? "Collapse emergency detected" : "No collapse detected"}</strong>
                    <span>{lastResult.message}</span>
                    <small>Class: {lastResult.label}</small>
                  </div>
                </div>
              ) : (
                <p className="muted">Click Start video and detect collapse to scan uploaded footage continuously.</p>
              )}
              {monitoring ? <p className="live-status">Live simulation scanning uploaded video frames...</p> : null}
              {alertTriggered ? <p className="live-status live-status--alert">Collapse alert triggered from live video stream.</p> : null}
              {localError ? <p className="status-message status-message--error">{localError}</p> : null}
              {route ? (
                <div className={`route-result route-result--${route.status}`}>
                  <strong>{route.status === "ok" ? "Best path recalculated" : "No safe route"}</strong>
                  <span>{route.message}</span>
                </div>
              ) : null}
              <button className="secondary-action" disabled={!detectedLocation} onClick={() => detectedLocation && onCalculateRoute({ startNodeId: detectedLocation.id })}>
                Calculate route from detected location
              </button>
              <button className="secondary-action" onClick={resetSimulation}>
                Reset collapse simulation
              </button>
              {message ? <p className="status-message">{message}</p> : null}
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function resolveDetectedLocation(camera: Node | undefined, nodes: Node[], fallbackNodeId: string): Node | undefined {
  if (!camera) {
    return nodes.find((node) => node.id === fallbackNodeId) ?? nodes[0];
  }

  return nodes.reduce<Node | undefined>((nearest, node) => {
    if (!nearest) {
      return node;
    }

    const nearestDistance = distance(camera, nearest);
    const nodeDistance = distance(camera, node);
    return nodeDistance < nearestDistance ? node : nearest;
  }, undefined);
}

function distance(a: Pick<Node, "x" | "y">, b: Pick<Node, "x" | "y">): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
