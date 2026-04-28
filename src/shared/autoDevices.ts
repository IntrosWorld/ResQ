import type { AppState, Node, Point } from "./types";

export interface AutoCameraGenerationResult {
  nodes: Array<Omit<Node, "id">>;
  skipped: number;
  message: string;
}

const privateLabelWords = ["BATH", "WASH", "TOILET", "WC", "RESTROOM", "BED ROOM", "BEDROOM", "BED"];
const cameraLabelWords = ["HALL", "PASSAGE", "CORRIDOR", "LOBBY", "STAIR", "EXIT", "PARKING", "VERANDA", "KITCHEN", "ENTRANCE", "RECEPTION"];
const cameraNodeTypes = new Set<Node["type"]>(["pathway", "corridor", "junction", "staircase", "exit"]);

export function generateAutoCameraNodes(state: AppState): AutoCameraGenerationResult {
  const existingCameraNodes = state.nodes.filter((node) => node.type === "camera");
  const boundsDiagonal = Math.max(
    1,
    Math.hypot(state.floorMap.bounds.maxX - state.floorMap.bounds.minX, state.floorMap.bounds.maxY - state.floorMap.bounds.minY)
  );
  const coverageRadius = boundsDiagonal * 0.035;
  const offset = Math.max(boundsDiagonal * 0.01, 0.8);
  const candidates = state.nodes.filter(isCameraCandidate);
  const labels = new Set(state.nodes.map((node) => normalizedLabel(node.label)));
  const generated: Array<Omit<Node, "id">> = [];
  let skipped = 0;

  for (const candidate of candidates) {
    const alreadyCovered = [...existingCameraNodes, ...generated].some((camera) => distanceBetween(candidate, camera) <= coverageRadius);
    if (alreadyCovered) {
      skipped += 1;
      continue;
    }

    generated.push({
      label: uniqueCameraLabel(candidate.label, labels),
      type: "camera",
      x: round(candidate.x + offset),
      y: round(candidate.y - offset),
      floorId: candidate.floorId,
      metadata: {
        inferredFrom: "auto-camera",
        coverageForNodeId: candidate.id,
        coverageForLabel: candidate.label
      }
    });
  }

  return {
    nodes: generated,
    skipped,
    message: `Generated ${generated.length} camera nodes for public route and operational areas.`
  };
}

function isCameraCandidate(node: Node): boolean {
  if (node.type === "camera") {
    return false;
  }

  const label = normalizedLabel(node.label);
  if (privateLabelWords.some((word) => label.includes(word))) {
    return false;
  }

  return cameraNodeTypes.has(node.type) || cameraLabelWords.some((word) => label.includes(word));
}

function uniqueCameraLabel(sourceLabel: string, labels: Set<string>): string {
  const base = `Camera - ${sourceLabel}`;
  let candidate = base;
  let index = 2;

  while (labels.has(normalizedLabel(candidate))) {
    candidate = `${base} ${index}`;
    index += 1;
  }

  labels.add(normalizedLabel(candidate));
  return candidate;
}

function normalizedLabel(label: string): string {
  return label.replace(/\s+/g, " ").trim().toUpperCase();
}

function distanceBetween(from: Point, to: Point): number {
  return Math.hypot(from.x - to.x, from.y - to.y);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
