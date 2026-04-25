import type { Edge, Hazard, Node, PersonLocation, RouteInput, RouteResult, RouteStep } from "./types";

const BLOCK_RADIUS_FACTOR = 0.6;

export function resolvePersonStartNode(person: PersonLocation): string | undefined {
  return person.qrNodeId ?? person.bleNodeId;
}

export function calculateEvacuationRoute(input: RouteInput): RouteResult {
  const { nodes, edges, hazards, startNodeId } = input;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const startNode = nodeById.get(startNodeId);
  const activeHazards = hazards.filter((hazard) => hazard.active);
  const blockedNodeIds = findBlockedNodes(nodes, activeHazards);
  const blockedEdgeIds = findBlockedEdges(edges, blockedNodeIds);

  if (!startNode) {
    return emptyRoute("invalid_start", "The selected start location is not in the evacuation graph.", blockedNodeIds, blockedEdgeIds);
  }

  if (blockedNodeIds.has(startNodeId)) {
    return emptyRoute("invalid_start", "The selected start location is inside a blocked danger zone.", blockedNodeIds, blockedEdgeIds);
  }

  const exits = nodes.filter((node) => node.type === "exit" && !blockedNodeIds.has(node.id));
  if (exits.length === 0) {
    return emptyRoute("no_route", "No safe exit is currently reachable because every exit is blocked.", blockedNodeIds, blockedEdgeIds);
  }

  const graph = buildGraph(edges, nodeById, activeHazards, blockedNodeIds, blockedEdgeIds);
  const shortest = dijkstra(startNodeId, graph);

  let bestExitId: string | undefined;
  let bestCost = Number.POSITIVE_INFINITY;
  for (const exit of exits) {
    const cost = shortest.distance.get(exit.id) ?? Number.POSITIVE_INFINITY;
    if (cost < bestCost) {
      bestCost = cost;
      bestExitId = exit.id;
    }
  }

  if (!bestExitId || !Number.isFinite(bestCost)) {
    return emptyRoute("no_route", "No safe route can reach an exit after removing unsafe paths.", blockedNodeIds, blockedEdgeIds);
  }

  const nodeIds = reconstructPath(bestExitId, shortest.previous);
  const steps = buildRouteSteps(nodeIds, nodeById, edges);

  return {
    status: "ok",
    nodeIds,
    exitNodeId: bestExitId,
    totalDistance: Math.round(bestCost * 100) / 100,
    blockedNodeIds: [...blockedNodeIds],
    blockedEdgeIds: [...blockedEdgeIds],
    steps,
    message: `Safest route selected toward ${nodeById.get(bestExitId)?.label ?? "exit"}.`
  };
}

function emptyRoute(
  status: RouteResult["status"],
  message: string,
  blockedNodeIds: Set<string>,
  blockedEdgeIds: Set<string>
): RouteResult {
  return {
    status,
    nodeIds: [],
    totalDistance: 0,
    blockedNodeIds: [...blockedNodeIds],
    blockedEdgeIds: [...blockedEdgeIds],
    steps: [],
    message
  };
}

function findBlockedNodes(nodes: Node[], hazards: Hazard[]): Set<string> {
  const blocked = new Set<string>();
  for (const hazard of hazards) {
    if (hazard.nodeId) {
      blocked.add(hazard.nodeId);
    }

    const blockRadius = hazard.radius * BLOCK_RADIUS_FACTOR;
    for (const node of nodes) {
      if (distance(node, hazard) <= blockRadius) {
        blocked.add(node.id);
      }
    }
  }
  return blocked;
}

function findBlockedEdges(edges: Edge[], blockedNodeIds: Set<string>): Set<string> {
  const blocked = new Set<string>();
  for (const edge of edges) {
    if (edge.status === "blocked" || blockedNodeIds.has(edge.from) || blockedNodeIds.has(edge.to)) {
      blocked.add(edge.id);
    }
  }
  return blocked;
}

function buildGraph(
  edges: Edge[],
  nodeById: Map<string, Node>,
  hazards: Hazard[],
  blockedNodeIds: Set<string>,
  blockedEdgeIds: Set<string>
): Map<string, Array<{ nodeId: string; cost: number; edgeId: string }>> {
  const graph = new Map<string, Array<{ nodeId: string; cost: number; edgeId: string }>>();

  for (const edge of edges) {
    if (blockedEdgeIds.has(edge.id) || blockedNodeIds.has(edge.from) || blockedNodeIds.has(edge.to)) {
      continue;
    }

    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) {
      continue;
    }

    const cost = edge.distance + riskPenalty(from, to, hazards);
    addNeighbor(graph, edge.from, { nodeId: edge.to, cost, edgeId: edge.id });
    addNeighbor(graph, edge.to, { nodeId: edge.from, cost, edgeId: edge.id });
  }

  return graph;
}

function addNeighbor(
  graph: Map<string, Array<{ nodeId: string; cost: number; edgeId: string }>>,
  nodeId: string,
  neighbor: { nodeId: string; cost: number; edgeId: string }
): void {
  const neighbors = graph.get(nodeId) ?? [];
  neighbors.push(neighbor);
  graph.set(nodeId, neighbors);
}

function riskPenalty(from: Node, to: Node, hazards: Hazard[]): number {
  const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  let penalty = 0;

  for (const hazard of hazards) {
    const d = distance(midpoint, hazard);
    if (d <= hazard.radius) {
      const severityMultiplier = hazard.severity === "critical" ? 8 : hazard.severity === "high" ? 5 : hazard.severity === "medium" ? 3 : 1.5;
      penalty += (1 - d / hazard.radius) * severityMultiplier * 10;
    }
  }

  return penalty;
}

function dijkstra(
  startNodeId: string,
  graph: Map<string, Array<{ nodeId: string; cost: number; edgeId: string }>>
): { distance: Map<string, number>; previous: Map<string, string> } {
  const distanceById = new Map<string, number>([[startNodeId, 0]]);
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  const queue = new Set<string>([startNodeId]);

  while (queue.size > 0) {
    let current: string | undefined;
    let currentDistance = Number.POSITIVE_INFINITY;

    for (const nodeId of queue) {
      const candidateDistance = distanceById.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (candidateDistance < currentDistance) {
        current = nodeId;
        currentDistance = candidateDistance;
      }
    }

    if (!current) {
      break;
    }

    queue.delete(current);
    visited.add(current);

    for (const neighbor of graph.get(current) ?? []) {
      if (visited.has(neighbor.nodeId)) {
        continue;
      }

      const nextDistance = currentDistance + neighbor.cost;
      if (nextDistance < (distanceById.get(neighbor.nodeId) ?? Number.POSITIVE_INFINITY)) {
        distanceById.set(neighbor.nodeId, nextDistance);
        previous.set(neighbor.nodeId, current);
        queue.add(neighbor.nodeId);
      }
    }
  }

  return { distance: distanceById, previous };
}

function reconstructPath(exitNodeId: string, previous: Map<string, string>): string[] {
  const path = [exitNodeId];
  let current = exitNodeId;
  while (previous.has(current)) {
    current = previous.get(current)!;
    path.unshift(current);
  }
  return path;
}

function buildRouteSteps(nodeIds: string[], nodeById: Map<string, Node>, edges: Edge[]): RouteStep[] {
  return nodeIds.map((nodeId, index) => {
    const node = nodeById.get(nodeId);
    const previousNodeId = nodeIds[index - 1];
    const distanceFromPrevious = previousNodeId ? findEdgeDistance(previousNodeId, nodeId, edges) : 0;
    const instruction =
      index === 0
        ? `Start from ${node?.label ?? nodeId}.`
        : node?.type === "exit"
          ? `Exit through ${node.label}.`
          : `Move to ${node?.label ?? nodeId}.`;

    return {
      nodeId,
      label: node?.label ?? nodeId,
      instruction,
      distanceFromPrevious
    };
  });
}

function findEdgeDistance(from: string, to: string, edges: Edge[]): number {
  return edges.find((edge) => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from))?.distance ?? 0;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
