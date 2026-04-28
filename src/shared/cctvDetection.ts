import type { HazardSeverity, HazardType } from "./types";

export type CctvClipStatus = "clear" | "hazard";

export interface CctvSampleClip {
  id: string;
  label: string;
  locationHint: string;
  status: CctvClipStatus;
  hazardType?: HazardType;
  severity?: HazardSeverity;
  confidence: number;
  modelLabel: string;
  description: string;
  bbox?: { x: number; y: number; width: number; height: number };
}

export interface CctvDetectionResult {
  clipId: string;
  isHazard: boolean;
  label: string;
  confidence: number;
  hazardType?: HazardType;
  severity?: HazardSeverity;
  message: string;
  bbox?: CctvSampleClip["bbox"];
}

export const cctvSampleClips: CctvSampleClip[] = [
  {
    id: "clear-corridor",
    label: "Clear corridor CCTV",
    locationHint: "Main Junction",
    status: "clear",
    confidence: 0.94,
    modelLabel: "normal_scene",
    description: "Normal guest movement, no visible smoke, flame, panic, or obstruction."
  },
  {
    id: "smoke-east",
    label: "Smoke in east corridor",
    locationHint: "East Corridor",
    status: "hazard",
    hazardType: "smoke",
    severity: "high",
    confidence: 0.91,
    modelLabel: "smoke_plume",
    description: "Dense smoke-like region detected in the upper corridor view.",
    bbox: { x: 58, y: 18, width: 26, height: 34 }
  },
  {
    id: "fire-lobby",
    label: "Fire near lobby camera",
    locationHint: "Lobby CCTV",
    status: "hazard",
    hazardType: "fire",
    severity: "critical",
    confidence: 0.96,
    modelLabel: "open_flame",
    description: "High-confidence flame-colored moving region detected near the camera zone.",
    bbox: { x: 42, y: 42, width: 22, height: 32 }
  },
  {
    id: "gas-service",
    label: "Gas haze in service route",
    locationHint: "West Corridor",
    status: "hazard",
    hazardType: "gas",
    severity: "medium",
    confidence: 0.84,
    modelLabel: "abnormal_haze",
    description: "Low-contrast haze pattern detected; treat as gas/smoke candidate until verified.",
    bbox: { x: 18, y: 28, width: 32, height: 38 }
  }
];

export function runCctvYoloSimulation(clipId: string): CctvDetectionResult {
  const clip = cctvSampleClips.find((item) => item.id === clipId) ?? cctvSampleClips[0];
  const isHazard = clip.status === "hazard" && Boolean(clip.hazardType);

  return {
    clipId: clip.id,
    isHazard,
    label: clip.modelLabel,
    confidence: clip.confidence,
    hazardType: clip.hazardType,
    severity: clip.severity,
    bbox: clip.bbox,
    message: isHazard
      ? `${clip.modelLabel} detected at ${Math.round(clip.confidence * 100)}% confidence.`
      : `No hazard detected at ${Math.round(clip.confidence * 100)}% normal-scene confidence.`
  };
}
