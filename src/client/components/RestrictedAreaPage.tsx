import { AlertTriangle, Camera, Check, RadioTower, ScanEye, Upload, UserSearch, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AppState, LocalModelStatus, Node } from "../../shared/types";
import {
  hasLoadedYoloPersonModel,
  loadYoloPersonModel,
  loadYoloPersonModelFromUrl,
  runYoloPersonDetection,
  type PersonDetectionResult
} from "../ml/yoloPersonModel";
import { MapCanvas } from "./MapCanvas";

interface RestrictedAreaPageProps {
  state: AppState;
  selectedNodeId: string;
  busy: boolean;
  localModelStatus?: LocalModelStatus;
  onSelectNode: (nodeId: string) => void;
  onIntrusionDetected: (payload: { cameraLabel: string; nodeLabel: string; count: number; confidence: number }) => void;
  onClearSimulationData: () => void;
  onResetFloorMap: () => void;
}

export function RestrictedAreaPage({
  state,
  selectedNodeId,
  busy,
  localModelStatus,
  onSelectNode,
  onIntrusionDetected,
  onClearSimulationData,
  onResetFloorMap
}: RestrictedAreaPageProps) {
  const cameraNodes = state.nodes.filter((node) => node.type === "camera");
  const restrictedNodes = state.nodes.filter((node) => !["camera", "sensor", "actuator", "exit"].includes(node.type));
  const [cameraNodeId, setCameraNodeId] = useState(cameraNodes[0]?.id ?? "");
  const [restrictedNodeId, setRestrictedNodeId] = useState(selectedNodeId || restrictedNodes[0]?.id || "");
  const [allowedStart, setAllowedStart] = useState("08:00");
  const [allowedEnd, setAllowedEnd] = useState("18:00");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [uploadedVideoName, setUploadedVideoName] = useState("");
  const [modelName, setModelName] = useState("");
  const [modelStatus, setModelStatus] = useState("No COCO person ONNX model loaded.");
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelPickerResult, setModelPickerResult] = useState<"success" | "error" | null>(null);
  const [modelPickerMessage, setModelPickerMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [monitoring, setMonitoring] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [lastResult, setLastResult] = useState<PersonDetectionResult | undefined>();
  const inferenceRunningRef = useRef(false);
  const videoFrameCallbackRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectedCamera = state.nodes.find((node) => node.id === cameraNodeId) ?? cameraNodes[0];
  const restrictedNode = state.nodes.find((node) => node.id === restrictedNodeId) ?? restrictedNodes[0];
  const outsideAllowedTime = !isNowWithinTimeRange(allowedStart, allowedEnd);
  const hasModelSource = Boolean(localModelStatus?.hasOnnx || localModelStatus?.hasRemoteOnnx);

  const detectionRows = useMemo(
    () => [
      { label: "Model", value: hasLoadedYoloPersonModel() ? modelName || "YOLO COCO person ONNX" : "Not loaded" },
      { label: "Source", value: uploadedVideoName || "No uploaded video" },
      { label: "Camera", value: selectedCamera?.label ?? "Manual CCTV feed" },
      { label: "Restricted zone", value: restrictedNode?.label ?? "Select zone" },
      { label: "Schedule", value: outsideAllowedTime ? "Restricted now" : "Allowed now" },
      { label: "Frames checked", value: String(frameCount) }
    ],
    [frameCount, modelName, outsideAllowedTime, restrictedNode?.label, selectedCamera?.label, uploadedVideoName]
  );


  useEffect(() => {
    if (restrictedNode && restrictedNode.id !== selectedNodeId) {
      onSelectNode(restrictedNode.id);
    }
  }, [onSelectNode, restrictedNode?.id, selectedNodeId]);

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
  }, [monitoring, uploadedVideoUrl, restrictedNode?.id, outsideAllowedTime, alertTriggered]);

  async function handleModelUpload(file: File, andStart = false) {
    setLocalError("");
    setModelPickerResult(null);
    setModelPickerMessage("Reading model file…");
    setDownloadPercent(50);
    try {
      await loadYoloPersonModel(file);
      setDownloadPercent(null);
      setModelName(file.name);
      setModelStatus("COCO person ONNX loaded.");
      setModelPickerResult("success");
      setModelPickerMessage("Model loaded successfully.");
      if (andStart) setTimeout(() => { setShowModelPicker(false); void beginDetectionAfterLoad(); }, 1200);
    } catch (error) {
      setDownloadPercent(null);
      const msg = error instanceof Error ? error.message : "Could not load COCO person ONNX model.";
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
    setModelStatus("Downloading COCO person ONNX model from Hugging Face...");
    try {
      // Always go through our API proxy — direct HuggingFace URLs hit CORS issues
      // on deployed environments. The proxy fetches server-side and streams back.
      const modelUrl = "/api/models/person-coco/model.onnx";
      await loadYoloPersonModelFromUrl(modelUrl, (pct) => {
        setDownloadPercent(pct);
        setModelPickerMessage(pct < 100 ? `Downloading model… ${pct}%` : "Compiling ONNX model, please wait…");
      });
      setDownloadPercent(null);
      setModelName(localModelStatus?.hasOnnx ? "person_model_bin/resq-person-coco.onnx" : "Hugging Face COCO person ONNX");
      setModelStatus("COCO person ONNX loaded.");
      setModelPickerResult("success");
      setModelPickerMessage("Model loaded successfully.");
      if (andStart) setTimeout(() => { setShowModelPicker(false); void beginDetectionAfterLoad(); }, 1200);
    } catch (error) {
      setDownloadPercent(null);
      const msg = error instanceof Error ? error.message : "Could not load COCO person ONNX model.";
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
      setLocalError("Upload CCTV footage before starting restricted-area detection.");
      return;
    }

    setLocalError("");
    if (!hasLoadedYoloPersonModel()) {
      setShowModelPicker(true);
      return;
    }

    void beginDetectionAfterLoad();
  }

  async function runDetection() {
    if (!uploadedVideoUrl || !hasLoadedYoloPersonModel() || !videoRef.current || videoRef.current.paused || videoRef.current.ended || inferenceRunningRef.current) {
      return;
    }

    inferenceRunningRef.current = true;
    setLocalError("");
    let result: PersonDetectionResult;
    try {
      result = await runYoloPersonDetection(videoRef.current);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "COCO person inference failed.");
      inferenceRunningRef.current = false;
      return;
    }
    inferenceRunningRef.current = false;

    setLastResult(result);
    setFrameCount((count) => count + 1);

    if (!result.hasPerson || !outsideAllowedTime || !restrictedNode || alertTriggered) {
      return;
    }

    setAlertTriggered(true);
    onIntrusionDetected({
      cameraLabel: selectedCamera?.label ?? "CCTV",
      nodeLabel: restrictedNode.label,
      count: result.count,
      confidence: result.topDetection?.confidence ?? 0
    });
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
  }

  function clearSimulationData() {
    resetSimulation();
    onClearSimulationData();
  }

  return (
    <div className="cctv-page">
      <div className="dashboard-grid cctv-grid">
        <section className="workspace">
          <MapCanvas state={state} selectedNodeId={restrictedNode?.id} onNodeSelect={setRestrictedNodeId} onResetFloorMap={onResetFloorMap} />
        </section>

        <aside className="control-stack collapse-sidebar">
          <section className="panel collapse-video-panel">
            <h3>
              <UserSearch size={18} />
              Restricted Area Person Detection
            </h3>
            <div className="cctv-video cctv-video--uploaded cctv-video--collapse">
              {uploadedVideoUrl ? (
                <>
                  <video ref={videoRef} src={uploadedVideoUrl} controls muted playsInline preload="metadata" />
                  {lastResult?.topDetection?.bbox ? (
                    <span
                      className="cctv-bbox cctv-bbox--person"
                      style={{
                        left: `${lastResult.topDetection.bbox.x}%`,
                        top: `${lastResult.topDetection.bbox.y}%`,
                        width: `${lastResult.topDetection.bbox.width}%`,
                        height: `${lastResult.topDetection.bbox.height}%`
                      }}
                    />
                  ) : null}
                </>
              ) : (
                <div className="cctv-empty">
                  <Video size={28} />
                  <strong>Upload restricted-zone CCTV</strong>
                  <small>YOLO COCO person detection will scan for entry outside the allowed time.</small>
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
                <span>Upload restricted-area CCTV video</span>
                <small>{uploadedVideoName || "MP4, WebM, or MOV"}</small>
              </label>
            </section>

            <section className="panel">
              <h3>
                <ScanEye size={18} />
                COCO person model
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
                  <span>Upload YOLO COCO ONNX</span>
                  <small>{modelName || "Use YOLO11n or YOLOv8n pretrained on COCO"}</small>
                </label>
              ) : null}

              {!showModelPicker ? (
                <div className="panel-load-row">
                  <button className="secondary-action" onClick={() => { setModelPickerResult(null); setModelPickerMessage(""); setShowModelPicker(true); }}>
                    Load COCO person ONNX
                  </button>
                  <button className="secondary-action secondary-action--remote" onClick={() => { setModelPickerResult(null); setModelPickerMessage(""); setShowModelPicker(true); setTimeout(() => void handleLoadLocalOnnx(false), 0); }}>
                    Load from Hugging Face
                  </button>
                </div>
              ) : null}
              <div className="info-list">
                <span>Source model: Ultralytics YOLO11n/YOLOv8n pretrained on COCO; this page filters class 0: person.</span>
                {localModelStatus && downloadPercent === null ? <span>{localModelStatus.message}</span> : null}
                {downloadPercent === null ? <span>{modelStatus}</span> : null}
              </div>
            </section>

            <section className="panel">
              <h3>
                <Camera size={18} />
                Restricted area
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
                  Restricted node
                  <select value={restrictedNode?.id ?? ""} onChange={(event) => setRestrictedNodeId(event.target.value)}>
                    {restrictedNodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="coordinate-grid">
                  <label>
                    Allowed from
                    <input type="time" value={allowedStart} onChange={(event) => setAllowedStart(event.target.value)} />
                  </label>
                  <label>
                    Allowed until
                    <input type="time" value={allowedEnd} onChange={(event) => setAllowedEnd(event.target.value)} />
                  </label>
                </div>
                <div className={outsideAllowedTime ? "mapped-location mapped-location--alert" : "mapped-location"}>
                  <span>Current rule</span>
                  <strong>{outsideAllowedTime ? "Restricted now" : "Allowed now"}</strong>
                  <small>Alerts fire only when a person is detected outside the allowed range.</small>
                </div>
                <button className={monitoring ? "secondary-action secondary-action--live" : "danger-action"} disabled={busy || !restrictedNode} onClick={() => (monitoring ? setMonitoring(false) : void startDetection())}>
                  <RadioTower size={16} />
                  {monitoring ? "Stop person detection" : "Start restricted-area detection"}
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
              <div className="action-row">
                <button className="secondary-action" onClick={resetSimulation}>
                  Reset restricted-area simulation
                </button>
                <button className="secondary-action" onClick={clearSimulationData}>
                  Remove previous simulation data
                </button>
              </div>
              {lastResult ? (
                <div className={lastResult.hasPerson && outsideAllowedTime ? "cctv-result cctv-result--hazard" : "cctv-result cctv-result--clear"}>
                  {lastResult.hasPerson && outsideAllowedTime ? <UserSearch size={20} /> : <Check size={20} />}
                  <div>
                    <strong>{lastResult.hasPerson ? "Person detected" : "No person detected"}</strong>
                    <span>{lastResult.hasPerson ? "Restricted-area camera detected a person candidate." : "No person detected above threshold."}</span>
                    {lastResult.topDetection ? <small>Confidence: {Math.round(lastResult.topDetection.confidence * 100)}%</small> : null}
                  </div>
                </div>
              ) : (
                <p className="muted">Start detection to watch for people entering the selected area outside the allowed schedule.</p>
              )}
              {monitoring ? <p className="live-status">Live simulation scanning uploaded video frames...</p> : null}
              {alertTriggered ? <p className="live-status live-status--alert">Restricted-area intrusion notification sent.</p> : null}
              {localError ? <p className="status-message status-message--error">{localError}</p> : null}
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function isNowWithinTimeRange(start: string, end: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTime(start);
  const endMinutes = parseTime(end);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

function parseTime(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}
