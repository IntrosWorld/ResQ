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
  const [localError, setLocalError] = useState("");
  const [monitoring, setMonitoring] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [lastResult, setLastResult] = useState<PersonDetectionResult | undefined>();
  const autoLoadAttemptedRef = useRef(false);
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
    if (!hasModelSource || hasLoadedYoloPersonModel() || autoLoadAttemptedRef.current) {
      return;
    }

    autoLoadAttemptedRef.current = true;
    void handleLoadLocalOnnx();
  }, [hasModelSource]);

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

  async function handleModelUpload(file: File) {
    setLocalError("");
    setModelStatus("Loading COCO person ONNX model...");
    try {
      await loadYoloPersonModel(file);
      setModelName(file.name);
      setModelStatus("COCO person ONNX loaded. Uploaded video detection will use browser inference.");
    } catch (error) {
      setModelStatus("COCO person model failed to load.");
      setLocalError(error instanceof Error ? error.message : "Could not load COCO person ONNX model.");
    }
  }

  async function handleLoadLocalOnnx() {
    setLocalError("");
    setModelStatus("Loading local COCO person ONNX model...");
    try {
      await loadYoloPersonModelFromUrl("/api/models/person-coco/model.onnx");
      setModelName(localModelStatus?.hasOnnx ? "person_model_bin/resq-person-coco.onnx" : localModelStatus?.remoteOnnxUrl ?? "Hugging Face COCO person ONNX");
      setModelStatus("COCO person ONNX loaded. Uploaded video detection will use browser inference.");
    } catch (error) {
      setModelStatus("Local COCO person model failed to load.");
      setLocalError(error instanceof Error ? error.message : "Could not load person_model_bin/resq-person-coco.onnx.");
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

  async function startDetection() {
    if (!uploadedVideoUrl || !videoRef.current) {
      setLocalError("Upload CCTV footage before starting restricted-area detection.");
      return;
    }

    setLocalError("");
    if (!hasLoadedYoloPersonModel()) {
      await handleLoadLocalOnnx();
    }

    if (!hasLoadedYoloPersonModel()) {
      setLocalError("Local COCO person ONNX could not be loaded. Export YOLO11n or YOLOv8n to person_model_bin/resq-person-coco.onnx.");
      return;
    }

    setAlertTriggered(false);
    setMonitoring(true);
    await videoRef.current.play().catch(() => {
      setMonitoring(false);
      setLocalError("The browser blocked video playback. Press play on the video, then start detection again.");
    });

    void runDetection();
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
              {hasModelSource ? (
                <button className="secondary-action" onClick={() => void handleLoadLocalOnnx()}>
                  Load COCO person ONNX
                </button>
              ) : null}
              <div className="info-list">
                <span>Source model: Ultralytics YOLO11n/YOLOv8n pretrained on COCO; this page filters class 0: person.</span>
                {localModelStatus ? <span>{localModelStatus.message}</span> : null}
                <span>{modelStatus}</span>
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
