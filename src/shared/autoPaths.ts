import type { AppState, DxfSegment, Edge, Node, Point } from "./types";

export interface AutoPathGenerationResult {
  edges: Array<Omit<Edge, "id">>;
  skipped: number;
  message: string;
}

const nonRouteNodeTypes = new Set<Node["type"]>(["camera", "sensor", "actuator", "extinguisher"]);
const connectorNodeTypes = new Set<Node["type"]>(["pathway", "corridor", "junction", "staircase", "exit", "qr_checkpoint", "ble_beacon"]);

export function generateAutoPathEdges(state: AppState): AutoPathGenerationResult {
  const nodes = state.nodes.filter((node) => !nonRouteNodeTypes.has(node.type));
  if (nodes.length < 2) {
    return { edges: [], skipped: 0, message: "Need at least two route-capable nodes to generate paths." };
  }

  const existingPairs = new Set(state.edges.map((edge) => edgeKey(edge.from, edge.to)));
  const wallSegments = state.floorMap.segments.filter(isWallLikeSegment);
  const boundsDiagonal = Math.hypot(state.floorMap.bounds.maxX - state.floorMap.bounds.minX, state.floorMap.bounds.maxY - state.floorMap.bounds.minY);
  const maxDistance = Math.max(boundsDiagonal * 0.28, nearestDistance(nodes) * 2.4, 1);
  const candidates = buildCandidates(nodes, maxDistance, wallSegments);
  const edges: Array<Omit<Edge, "id">> = [];
  let skipped = 0;

  for (const candidate of candidates) {
    const key = edgeKey(candidate.from.id, candidate.to.id);
    if (existingPairs.has(key)) {
      skipped += 1;
      continue;
    }

    existingPairs.add(key);
    edges.push({
      from: candidate.from.id,
      to: candidate.to.id,
      distance: roundDistance(candidate.distance),
      status: "open"
    });
  }

  return {
    edges,
    skipped,
    message:
      wallSegments.length > 0
        ? `Generated ${edges.length} paths using ${wallSegments.length} wall-like DXF segments as blockers.`
        : `Generated ${edges.length} paths from nearest route-capable nodes. No wall-like DXF layers were detected.`
  };
}

function buildCandidates(nodes: Node[], maxDistance: number, wallSegments: DxfSegment[]) {
  const candidates: Array<{ from: Node; to: Node; distance: number; blocked: boolean; priority: number }> = [];
  const connectorNodes = nodes.filter((node) => connectorNodeTypes.has(node.type));

  for (const node of nodes) {
    const preferredTargets = connectorNodes.length > 0 && !connectorNodeTypes.has(node.type) ? connectorNodes : nodes.filter((item) => item.id !== node.id);
    const nearestTargets = preferredTargets
      .filter((target) => target.id !== node.id)
      .map((target) => ({ target, distance: distanceBetween(node, target), blocked: crossesWall(node, target, wallSegments) }))
      .sort((left, right) => Number(left.blocked) - Number(right.blocked) || left.distance - right.distance)
      .slice(0, connectorNodeTypes.has(node.type) ? 3 : 2);

    for (const target of nearestTargets) {
      if (target.distance <= maxDistance || nearestTargets.length <= 2) {
        candidates.push({
          from: node,
          to: target.target,
          distance: target.distance,
          blocked: target.blocked,
          priority: Number(target.blocked) * 10 + target.distance
        });
      }
    }
  }

  const unique = new Map<string, { from: Node; to: Node; distance: number; blocked: boolean; priority: number }>();
  for (const candidate of candidates.sort((left, right) => left.priority - right.priority)) {
    const key = edgeKey(candidate.from.id, candidate.to.id);
    if (!unique.has(key)) {
      unique.set(key, candidate);
    }
  }

  return [...unique.values()];
}

function crossesWall(from: Point, to: Point, wallSegments: DxfSegment[]): boolean {
  return wallSegments.some((segment) => {
    for (let index = 1; index < segment.points.length; index += 1) {
      if (linesIntersect(from, to, segment.points[index - 1], segment.points[index])) {
        return true;
      }
    }

    if (segment.closed && segment.points.length > 2) {
      return linesIntersect(from, to, segment.points[segment.points.length - 1], segment.points[0]);
    }

    return false;
  });
}

function linesIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const denominator = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (Math.abs(denominator) < 0.000001) {
    return false;
  }

  const ua = ((d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)) / denominator;
  const ub = ((b.x - a.x) * (a.y - c.y) - (b.y - a.y) * (a.x - c.x)) / denominator;
  return ua > 0.001 && ua < 0.999 && ub > 0.001 && ub < 0.999;
}

function isWallLikeSegment(segment: DxfSegment): boolean {
  const layer = segment.layer.toUpperCase();
  return layer.includes("WALL") || layer.includes("PARTITION") || layer.includes("STRUCT") || layer.includes("COLUMN");
}

function nearestDistance(nodes: Node[]): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (let outer = 0; outer < nodes.length; outer += 1) {
    for (let inner = outer + 1; inner < nodes.length; inner += 1) {
      nearest = Math.min(nearest, distanceBetween(nodes[outer], nodes[inner]));
    }
  }
  return Number.isFinite(nearest) ? nearest : 1;
}

function distanceBetween(from: Point, to: Point): number {
  return Math.hypot(from.x - to.x, from.y - to.y);
}

function roundDistance(value: number): number {
  return Math.max(0.01, Math.round(value * 100) / 100);
}

function edgeKey(from: string, to: string): string {
  return [from, to].sort().join("::");
}
