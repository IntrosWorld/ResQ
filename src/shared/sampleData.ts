import type { AppState, DxfSegment, Edge, FloorMap, Node, PersonLocation } from "./types";

export const sampleSegments: DxfSegment[] = [
  { id: "wall-1", layer: "WALLS", points: [{ x: 40, y: 70 }, { x: 860, y: 70 }, { x: 860, y: 500 }, { x: 40, y: 500 }, { x: 40, y: 70 }] },
  { id: "wall-2", layer: "ROOMS", points: [{ x: 80, y: 110 }, { x: 250, y: 110 }, { x: 250, y: 220 }, { x: 80, y: 220 }, { x: 80, y: 110 }] },
  { id: "wall-3", layer: "ROOMS", points: [{ x: 80, y: 300 }, { x: 250, y: 300 }, { x: 250, y: 460 }, { x: 80, y: 460 }, { x: 80, y: 300 }] },
  { id: "wall-4", layer: "ROOMS", points: [{ x: 610, y: 110 }, { x: 820, y: 110 }, { x: 820, y: 230 }, { x: 610, y: 230 }, { x: 610, y: 110 }] },
  { id: "wall-5", layer: "ROOMS", points: [{ x: 610, y: 310 }, { x: 820, y: 310 }, { x: 820, y: 460 }, { x: 610, y: 460 }, { x: 610, y: 310 }] },
  { id: "corridor-1", layer: "CORRIDORS", points: [{ x: 280, y: 170 }, { x: 560, y: 170 }, { x: 560, y: 390 }, { x: 280, y: 390 }, { x: 280, y: 170 }] }
];

export const sampleFloorMap: FloorMap = {
  id: "map-sample",
  buildingId: "building-demo",
  floorId: "floor-1",
  name: "Sample Hotel Floor 1",
  sourceType: "sample",
  importStatus: "ready",
  message: "Sample map loaded. Upload DWG/DXF/SVG/image or edit nodes directly.",
  segments: sampleSegments,
  labels: [],
  circles: [],
  arcs: [],
  bounds: { minX: 0, minY: 0, maxX: 900, maxY: 560 }
};

export const sampleNodes: Node[] = [
  { id: "room-101", label: "Room 101", type: "room", x: 160, y: 165, floorId: "floor-1" },
  { id: "room-102", label: "Room 102", type: "room", x: 160, y: 380, floorId: "floor-1" },
  { id: "corridor-west", label: "West Corridor", type: "corridor", x: 300, y: 280, floorId: "floor-1" },
  { id: "junction-main", label: "Main Junction", type: "junction", x: 450, y: 280, floorId: "floor-1" },
  { id: "corridor-east", label: "East Corridor", type: "corridor", x: 590, y: 280, floorId: "floor-1" },
  { id: "room-201", label: "Room 201", type: "room", x: 710, y: 170, floorId: "floor-1" },
  { id: "room-202", label: "Room 202", type: "room", x: 710, y: 390, floorId: "floor-1" },
  { id: "exit-west", label: "West Exit", type: "exit", x: 45, y: 280, floorId: "floor-1" },
  { id: "exit-east", label: "East Exit", type: "exit", x: 855, y: 280, floorId: "floor-1" },
  { id: "stair-north", label: "North Staircase", type: "staircase", x: 450, y: 90, floorId: "floor-1" },
  { id: "ext-1", label: "Fire Extinguisher A", type: "extinguisher", x: 360, y: 230, floorId: "floor-1" },
  { id: "cam-lobby", label: "Lobby CCTV", type: "camera", x: 500, y: 220, floorId: "floor-1" },
  { id: "sensor-smoke-a", label: "Smoke Sensor A", type: "sensor", x: 540, y: 340, floorId: "floor-1" },
  { id: "ble-a", label: "BLE Beacon A", type: "ble_beacon", x: 300, y: 240, floorId: "floor-1" },
  { id: "qr-main", label: "QR Main Junction", type: "qr_checkpoint", x: 450, y: 310, floorId: "floor-1" }
];

export const sampleEdges: Edge[] = [
  { id: "edge-room-101-west", from: "room-101", to: "corridor-west", distance: 8, status: "open" },
  { id: "edge-room-102-west", from: "room-102", to: "corridor-west", distance: 9, status: "open" },
  { id: "edge-west-junction", from: "corridor-west", to: "junction-main", distance: 7, status: "open" },
  { id: "edge-junction-east", from: "junction-main", to: "corridor-east", distance: 7, status: "open" },
  { id: "edge-east-room-201", from: "corridor-east", to: "room-201", distance: 8, status: "open" },
  { id: "edge-east-room-202", from: "corridor-east", to: "room-202", distance: 8, status: "open" },
  { id: "edge-west-exit", from: "corridor-west", to: "exit-west", distance: 11, status: "open" },
  { id: "edge-east-exit", from: "corridor-east", to: "exit-east", distance: 11, status: "open" },
  { id: "edge-junction-stair", from: "junction-main", to: "stair-north", distance: 10, status: "open" }
];

export const samplePeople: PersonLocation[] = [
  { id: "guest-a", label: "Guest A", role: "guest", bleNodeId: "room-101", confidence: 0.74, updatedAt: new Date().toISOString() },
  { id: "guest-b", label: "Guest B", role: "guest", bleNodeId: "room-202", confidence: 0.68, updatedAt: new Date().toISOString() },
  { id: "staff-1", label: "Night Staff", role: "staff", bleNodeId: "junction-main", confidence: 0.9, updatedAt: new Date().toISOString() }
];

export function createSampleState(): AppState {
  return {
    floorMap: sampleFloorMap,
    nodes: [...sampleNodes],
    edges: [...sampleEdges],
    hazards: [],
    people: [...samplePeople]
  };
}
