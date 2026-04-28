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
  const [localError, setLocalError] = useState("");
  const [monitoring, setMonitoring] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const inferenceRunningRef = useRef(false);
  const autoLoadAttemptedRef = useRef(false);
  const videoFrameCallbackRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectedClip = cctvSampleClips.find((clip) => clip.id === clipId) ?? cctvSampleClips[0];
  const selectedNode = state.nodes.find((node) => node.id === selectedNodeId) ?? hazardNodes[0];
  const selectedCamera = state.nodes.find((node) => node.id === cameraNodeId) ?? cameraNodes[0];
  const startNode = state.nodes.find((node) => node.id === startNodeId) ?? state.nodes[0];

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
    if (!localModelStatus?.hasOnnx || hasLoadedYoloHazardModel() || autoLoadAttemptedRef.current) {
      return;
    }

    autoLoadAttemptedRef.current = true;
    void handleLoadLocalOnnx();
  }, [localModelStatus?.hasOnnx]);

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

  async function handleModelUpload(file: File) {
    setLocalError("");
    setModelStatus("Loading ONNX model...");
    try {
      await loadYoloHazardModel(file);
      setModelName(file.name);
      setModelStatus("ONNX model loaded. Uploaded video detection will use real browser inference.");
    } catch (error) {
      setModelStatus("Model failed to load.");
      setLocalError(error instanceof Error ? error.message : "Could not load ONNX model.");
    }
  }

  async function handleLoadLocalOnnx() {
    setLocalError("");
    setModelStatus("Loading local ONNX model...");
    try {
      await loadYoloHazardModelFromUrl("/api/models/local-yolo/model.onnx");
      setModelName("yolo_model_bin/model.onnx");
      setModelStatus("Local ONNX model loaded. Uploaded video detection will use real browser inference.");
    } catch (error) {
      setModelStatus("Local ONNX model failed to load.");
      setLocalError(error instanceof Error ? error.message : "Could not load local ONNX model.");
    }
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
      await handleLoadLocalOnnx();
    }

    if (!hasLoadedYoloHazardModel()) {
      setLocalError("Local model.onnx could not be loaded. Check yolo_model_bin/model.onnx.");
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
            {localModelStatus?.hasOnnx ? (
              <button className="secondary-action" onClick={() => void handleLoadLocalOnnx()}>
                Load local model.onnx
              </button>
            ) : null}
            <div className="info-list">
              <span>Recommended pretrained source: TommyNgx/YOLOv10-Fire-and-Smoke-Detection on Hugging Face. It is gated, so download/export access must be handled by the project owner.</span>
              {localModelStatus ? <span>{localModelStatus.message}</span> : null}
              <span>{modelStatus}</span>
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
