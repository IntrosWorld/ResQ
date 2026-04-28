import { describe, expect, it } from "vitest";
import { createSampleState } from "./sampleData";
import { generateAutoPathEdges } from "./autoPaths";
import type { AppState } from "./types";

describe("generateAutoPathEdges", () => {
  it("creates route-capable edges with measured distances", () => {
    const state = createSampleState();
    state.edges = [];

    const result = generateAutoPathEdges(state);

    expect(result.edges.length).toBeGreaterThan(0);
    expect(result.edges[0]).toEqual(
      expect.objectContaining({
        from: expect.any(String),
        to: expect.any(String),
        distance: expect.any(Number),
        status: "open"
      })
    );
    expect(result.edges.every((edge) => edge.distance > 0)).toBe(true);
  });

  it("does not duplicate existing manual connections", () => {
    const state = createSampleState();
    const duplicate = state.edges[0];
    state.nodes = state.nodes.filter((node) => node.id === duplicate.from || node.id === duplicate.to);

    const result = generateAutoPathEdges(state);

    expect(result.edges).toHaveLength(0);
    expect(result.skipped).toBeGreaterThan(0);
  });

  it("prefers a visible corridor connection when wall geometry blocks another candidate", () => {
    const state: AppState = {
      floorMap: {
        id: "floor",
        buildingId: "building",
        floorId: "floor-1",
        name: "blocked.dxf",
        sourceType: "dxf",
        importStatus: "ready",
        message: "Imported DXF",
        labels: [],
        circles: [],
        arcs: [],
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
        segments: [
          {
            id: "wall-1",
            layer: "WALLS",
            points: [
              { x: 40, y: 0 },
              { x: 40, y: 80 }
            ],
            closed: false
          }
        ]
      },
      nodes: [
        { id: "room", label: "Room", type: "room", x: 10, y: 10, floorId: "floor-1" },
        { id: "blocked-exit", label: "Exit behind wall", type: "exit", x: 60, y: 10, floorId: "floor-1" },
        { id: "corridor", label: "Corridor", type: "corridor", x: 10, y: 70, floorId: "floor-1" }
      ],
      edges: [],
      hazards: [],
      people: []
    };

    const result = generateAutoPathEdges(state);

    expect(result.edges[0]).toEqual(expect.objectContaining({ from: "room", to: "corridor" }));
  });
});
