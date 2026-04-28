export type NodeType =
  | "room"
  | "pathway"
  | "corridor"
  | "junction"
  | "staircase"
  | "exit"
  | "extinguisher"
  | "camera"
  | "sensor"
  | "actuator"
  | "ble_beacon"
  | "qr_checkpoint";

export type EdgeStatus = "open" | "blocked";
export type HazardType = "fire" | "smoke" | "gas" | "structural" | "security" | "other";
export type HazardSeverity = "low" | "medium" | "high" | "critical";
export type PersonRole = "guest" | "staff" | "contractor" | "unknown";

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Node extends Point {
  id: string;
  label: string;
  type: NodeType;
  floorId: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  distance: number;
  status: EdgeStatus;
}

export interface Hazard extends Point {
  id: string;
  type: HazardType;
  label: string;
  nodeId?: string;
  radius: number;
  severity: HazardSeverity;
  active: boolean;
  createdAt: string;
}

export interface PersonLocation {
  id: string;
  label: string;
  role: PersonRole;
  bleNodeId?: string;
  qrNodeId?: string;
  confidence: number;
  updatedAt: string;
}

export interface DxfSegment {
  id: string;
  layer: string;
  points: Point[];
  closed?: boolean;
}

export interface DxfTextLabel extends Point {
  id: string;
  layer: string;
  text: string;
  height: number;
  rotation: number;
}

export interface DxfCircle extends Point {
  id: string;
  layer: string;
  radius: number;
}

export interface DxfArc extends DxfCircle {
  startAngle: number;
  endAngle: number;
}

export interface FloorMap {
  id: string;
  buildingId: string;
  floorId: string;
  name: string;
  sourceType: "sample" | "dwg" | "dxf" | "svg" | "image";
  importStatus: "ready" | "needs_converter" | "unsupported" | "failed";
  message: string;
  segments: DxfSegment[];
  labels: DxfTextLabel[];
  circles: DxfCircle[];
  arcs: DxfArc[];
  bounds: Bounds;
}

export interface RouteStep {
  nodeId: string;
  label: string;
  instruction: string;
  distanceFromPrevious: number;
}

export interface RouteResult {
  status: "ok" | "no_route" | "invalid_start";
  nodeIds: string[];
  exitNodeId?: string;
  totalDistance: number;
  blockedNodeIds: string[];
  blockedEdgeIds: string[];
  steps: RouteStep[];
  message: string;
}

export interface RouteInput {
  nodes: Node[];
  edges: Edge[];
  hazards: Hazard[];
  startNodeId: string;
}

export interface AppState {
  floorMap: FloorMap;
  nodes: Node[];
  edges: Edge[];
  hazards: Hazard[];
  people: PersonLocation[];
}

export interface LocalModelStatus {
  hasOnnx: boolean;
  hasRemoteOnnx?: boolean;
  hasBestPt: boolean;
  hasPytorchBin: boolean;
  hasConfig: boolean;
  hasSafetensors: boolean;
  onnxPath?: string;
  remoteOnnxUrl?: string;
  bestPtPath?: string;
  pytorchBinPath?: string;
  message: string;
}

export type SystemNotificationKind = "fire" | "collapse" | "intrusion" | "system";

export interface SystemNotification {
  id: string;
  kind: SystemNotificationKind;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
