import { describe, expect, it } from "vitest";
import { generateAutoCameraNodes } from "./autoDevices";
import type { AppState } from "./types";

function createDeviceState(): AppState {
  return {
    floorMap: {
      id: "floor",
      buildingId: "building",
      floorId: "floor-1",
      name: "floor.dxf",
      sourceType: "dxf",
      importStatus: "ready",
      message: "Imported DXF",
      segments: [],
      labels: [],
      circles: [],
      arcs: [],
      bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 }
    },
    nodes: [
      { id: "hall", label: "HALL 1", type: "pathway", x: 20, y: 20, floorId: "floor-1" },
      { id: "bath", label: "BATH", type: "room", x: 50, y: 20, floorId: "floor-1" },
      { id: "bed", label: "BED ROOM", type: "room", x: 80, y: 20, floorId: "floor-1" },
      { id: "parking", label: "CAR PARKING", type: "room", x: 20, y: 70, floorId: "floor-1" },
      { id: "exit", label: "EXIT", type: "exit", x: 80, y: 70, floorId: "floor-1" }
    ],
    edges: [],
    hazards: [],
    people: []
  };
}

describe("generateAutoCameraNodes", () => {
  it("places cameras for public/operational areas and avoids private rooms", () => {
    const result = generateAutoCameraNodes(createDeviceState());

    expect(result.nodes.map((node) => node.label)).toEqual(["Camera - HALL 1", "Camera - CAR PARKING", "Camera - EXIT"]);
    expect(result.nodes.every((node) => node.type === "camera")).toBe(true);
  });

  it("skips candidate areas already covered by an existing camera", () => {
    const state = createDeviceState();
    state.nodes.push({ id: "camera-hall", label: "Camera - HALL 1", type: "camera", x: 21, y: 19, floorId: "floor-1" });

    const result = generateAutoCameraNodes(state);

    expect(result.nodes.map((node) => node.label)).not.toContain("Camera - HALL 1");
    expect(result.skipped).toBeGreaterThan(0);
  });
});
