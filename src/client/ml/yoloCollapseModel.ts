import * as ort from "onnxruntime-web";
import type { HazardSeverity } from "../../shared/types";
import type { CctvDetectionResult } from "../../shared/cctvDetection";

const inputSize = 640;
const fallLabels = ["fall"];
const clearLabels = ["nofall", "no_fall", "normal", "person"];
const defaultLabels = ["fall", "nofall"];

let sessionPromise: Promise<ort.InferenceSession> | undefined;

ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/";

export async function loadYoloCollapseModel(modelFile: File): Promise<void> {
  const buffer = await modelFile.arrayBuffer();
  await loadYoloCollapseModelBuffer(buffer);
}

export async function loadYoloCollapseModelFromUrl(url: string, onProgress?: (percent: number) => void): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to fetch FallSafe ONNX model (HTTP ${response.status})${body ? `: ${body}` : ""}`);
  }
  const buffer = await readResponseWithProgress(response, onProgress);
  await loadYoloCollapseModelBuffer(buffer);
}

async function readResponseWithProgress(response: Response, onProgress?: (percent: number) => void): Promise<ArrayBuffer> {
  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  if (!response.body || total === 0) {
    onProgress?.(50);
    const buffer = await response.arrayBuffer();
    onProgress?.(100);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.(Math.round((received / total) * 100));
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged.buffer;
}

async function loadYoloCollapseModelBuffer(buffer: ArrayBuffer): Promise<void> {
  sessionPromise = ort.InferenceSession.create(buffer, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all"
  });
  await sessionPromise;
}

export function hasLoadedYoloCollapseModel(): boolean {
  return Boolean(sessionPromise);
}

export async function runYoloCollapseDetection(video: HTMLVideoElement, labels = defaultLabels): Promise<CctvDetectionResult> {
  if (!sessionPromise) {
    throw new Error("Upload or load a FallSafe YOLO11 ONNX model before running collapse detection.");
  }

  const session = await sessionPromise;
  const frame = extractFrame(video);
  const feeds: Record<string, ort.Tensor> = {
    [session.inputNames[0]]: new ort.Tensor("float32", frame.tensor, [1, 3, inputSize, inputSize])
  };
  const outputMap = await session.run(feeds);
  const output = outputMap[session.outputNames[0]];
  const detection = parseYoloOutput(output, labels);

  return {
    clipId: "uploaded-collapse-video",
    isHazard: detection.isHazard,
    label: detection.label,
    confidence: detection.confidence,
    hazardType: detection.isHazard ? "structural" : undefined,
    severity: detection.severity,
    bbox: detection.bbox,
    message: detection.isHazard
      ? `FallSafe YOLO11 detected a collapse/fall at ${Math.round(detection.confidence * 100)}% confidence.`
      : "FallSafe YOLO11 did not detect a fall above threshold."
  };
}

function extractFrame(video: HTMLVideoElement): { tensor: Float32Array } {
  const canvas = document.createElement("canvas");
  canvas.width = inputSize;
  canvas.height = inputSize;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas is not available for video frame processing.");
  }

  context.drawImage(video, 0, 0, inputSize, inputSize);
  const { data } = context.getImageData(0, 0, inputSize, inputSize);
  const tensor = new Float32Array(3 * inputSize * inputSize);
  const planeSize = inputSize * inputSize;

  for (let index = 0; index < planeSize; index += 1) {
    tensor[index] = data[index * 4] / 255;
    tensor[index + planeSize] = data[index * 4 + 1] / 255;
    tensor[index + planeSize * 2] = data[index * 4 + 2] / 255;
  }

  return { tensor };
}

export function parseYoloCollapseOutputForTest(output: { dims: readonly number[]; data: Float32Array }, labels = defaultLabels) {
  return parseYoloOutput(output, labels);
}

function parseYoloOutput(output: { dims: readonly number[]; data: unknown }, labels: string[]) {
  const dims = output.dims.map(Number);
  const data = output.data as Float32Array;
  const rows = toDetectionRows(data, dims);
  let best = {
    label: "normal_posture",
    confidence: 0,
    isHazard: false,
    hazardType: undefined as "structural" | undefined,
    severity: undefined as HazardSeverity | undefined,
    bbox: undefined as CctvDetectionResult["bbox"]
  };

  for (const row of rows) {
    const label = labels[row.classIndex] ?? `class_${row.classIndex}`;
    const normalized = label.toLowerCase();
    const isFall = fallLabels.some((word) => normalized.includes(word)) && !clearLabels.some((word) => normalized === word);
    if (!isFall || row.confidence < 0.35 || row.confidence <= best.confidence) {
      continue;
    }

    best = {
      label,
      confidence: round(row.confidence),
      isHazard: true,
      hazardType: "structural",
      severity: row.confidence > 0.85 ? "critical" : row.confidence > 0.65 ? "high" : "medium",
      bbox: {
        x: clampPercent((row.cx - row.width / 2) * 100),
        y: clampPercent((row.cy - row.height / 2) * 100),
        width: clampPercent(row.width * 100),
        height: clampPercent(row.height * 100)
      }
    };
  }

  return best;
}

function toDetectionRows(data: Float32Array, dims: number[]) {
  const rows: Array<{ cx: number; cy: number; width: number; height: number; confidence: number; classIndex: number }> = [];
  const [, first = 0, second = 0] = dims;

  if (dims.length === 3 && first > 4 && second > first) {
    for (let column = 0; column < second; column += 1) {
      const cx = data[column];
      const cy = data[second + column];
      const width = data[second * 2 + column];
      const height = data[second * 3 + column];
      const classScores = Array.from({ length: first - 4 }, (_, classIndex) => data[second * (classIndex + 4) + column]);
      const { classIndex, confidence } = maxScore(classScores);
      rows.push({ cx, cy, width, height, confidence, classIndex });
    }
    return rows;
  }

  const rowLength = dims[dims.length - 1] || 0;
  if (rowLength >= 6) {
    for (let offset = 0; offset + rowLength <= data.length; offset += rowLength) {
      if (rowLength === 6) {
        const x1 = normalizeCoordinate(data[offset]);
        const y1 = normalizeCoordinate(data[offset + 1]);
        const x2 = normalizeCoordinate(data[offset + 2]);
        const y2 = normalizeCoordinate(data[offset + 3]);
        rows.push({
          cx: (x1 + x2) / 2,
          cy: (y1 + y2) / 2,
          width: Math.max(0, x2 - x1),
          height: Math.max(0, y2 - y1),
          confidence: data[offset + 4],
          classIndex: Math.max(0, Math.round(data[offset + 5]))
        });
        continue;
      }

      const cx = normalizeCoordinate(data[offset]);
      const cy = normalizeCoordinate(data[offset + 1]);
      const width = normalizeCoordinate(data[offset + 2]);
      const height = normalizeCoordinate(data[offset + 3]);
      const objectness = data[offset + 4];
      const classScores = Array.from(data.slice(offset + 5, offset + rowLength));
      const { classIndex, confidence } = maxScore(classScores);
      rows.push({ cx, cy, width, height, confidence: confidence * objectness, classIndex });
    }
  }

  return rows;
}

function normalizeCoordinate(value: number): number {
  return value > 1 ? value / inputSize : value;
}

function maxScore(scores: number[]): { classIndex: number; confidence: number } {
  return scores.reduce(
    (best, score, classIndex) => (score > best.confidence ? { classIndex, confidence: score } : best),
    { classIndex: 0, confidence: 0 }
  );
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, round(value)));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
