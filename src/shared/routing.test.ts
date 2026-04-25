import { describe, expect, it } from "vitest";
import { calculateEvacuationRoute, resolvePersonStartNode } from "./routing";
import type { Edge, Hazard, Node, PersonLocation } from "./types";

const nodes: Node[] = [
  { id: "lobby", label: "Lobby", type: "room", x: 120, y: 220, floorId: "floor-1" },
  { id: "corridor-a", label: "Corridor A", type: "corridor", x: 260, y: 220, floorId: "floor-1" },
  { id: "junction", label: "Main Junction", type: "junction", x: 420, y: 220, floorId: "floor-1" },
  { id: "exit-east", label: "East Exit", type: "exit", x: 640, y: 180, floorId: "floor-1" },
  { id: "exit-west", label: "West Exit", type: "exit", x: 60, y: 180, floorId: "floor-1" },
  { id: "service", label: "Service Corridor", type: "corridor", x: 420, y: 340, floorId: "floor-1" }
];

const edges: Edge[] = [
  { id: "e-lobby-corridor", from: "lobby", to: "corridor-a", distance: 5, status: "open" },
  { id: "e-corridor-junction", from: "corridor-a", to: "junction", distance: 7, status: "open" },
  { id: "e-junction-east", from: "junction", to: "exit-east", distance: 8, status: "open" },
  { id: "e-lobby-west", from: "lobby", to: "exit-west", distance: 16, status: "open" },
  { id: "e-junction-service", from: "junction", to: "service", distance: 3, status: "open" },
  { id: "e-service-west", from: "service", to: "exit-west", distance: 22, status: "open" }
];

describe("calculateEvacuationRoute", () => {
  it("chooses the lowest-cost safe exit when no hazards block the graph", () => {
    const route = calculateEvacuationRoute({
      nodes,
      edges,
      hazards: [],
      startNodeId: "lobby"
    });

    expect(route.status).toBe("ok");
    expect(route.exitNodeId).toBe("exit-west");
    expect(route.nodeIds).toEqual(["lobby", "exit-west"]);
    expect(route.totalDistance).toBe(16);
  });

  it("routes around a hazard that blocks the nearest exit path", () => {
    const hazards: Hazard[] = [
      {
        id: "hazard-1",
        type: "fire",
        label: "Lobby west smoke",
        nodeId: "exit-west",
        x: 60,
        y: 180,
        radius: 80,
        severity: "high",
        active: true,
        createdAt: "2026-04-26T00:00:00.000Z"
      }
    ];

    const route = calculateEvacuationRoute({
      nodes,
      edges,
      hazards,
      startNodeId: "lobby"
    });

    expect(route.status).toBe("ok");
    expect(route.exitNodeId).toBe("exit-east");
    expect(route.nodeIds).toEqual(["lobby", "corridor-a", "junction", "exit-east"]);
    expect(route.blockedNodeIds).toContain("exit-west");
  });

  it("returns no_route when all exits are blocked", () => {
    const hazards: Hazard[] = [
      {
        id: "hazard-east",
        type: "fire",
        label: "East fire",
        nodeId: "exit-east",
        x: 640,
        y: 180,
        radius: 90,
        severity: "critical",
        active: true,
        createdAt: "2026-04-26T00:00:00.000Z"
      },
      {
        id: "hazard-west",
        type: "smoke",
        label: "West smoke",
        nodeId: "exit-west",
        x: 60,
        y: 180,
        radius: 90,
        severity: "critical",
        active: true,
        createdAt: "2026-04-26T00:00:00.000Z"
      }
    ];

    const route = calculateEvacuationRoute({
      nodes,
      edges,
      hazards,
      startNodeId: "lobby"
    });

    expect(route.status).toBe("no_route");
    expect(route.nodeIds).toEqual([]);
  });
});

describe("resolvePersonStartNode", () => {
  it("uses QR-confirmed location over BLE-estimated location", () => {
    const person: PersonLocation = {
      id: "guest-101",
      label: "Guest 101",
      role: "guest",
      bleNodeId: "corridor-a",
      qrNodeId: "junction",
      confidence: 0.62,
      updatedAt: "2026-04-26T00:00:00.000Z"
    };

    expect(resolvePersonStartNode(person)).toBe("junction");
  });
});
