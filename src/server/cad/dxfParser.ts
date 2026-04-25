import type { Bounds, DxfSegment, Point } from "../../shared/types";

interface DxfPair {
  code: string;
  value: string;
}

export interface DxfPreview {
  segments: DxfSegment[];
  layers: string[];
  bounds: Bounds;
}

export function parseDxfPreview(content: string): DxfPreview {
  const pairs = toPairs(content);
  const segments: DxfSegment[] = [];
  let segmentIndex = 1;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair.code !== "0") {
      continue;
    }

    if (pair.value === "LINE") {
      const entity = readEntity(pairs, index + 1);
      const layer = readString(entity, "8") ?? "0";
      const start = { x: readNumber(entity, "10") ?? 0, y: readNumber(entity, "20") ?? 0 };
      const end = { x: readNumber(entity, "11") ?? start.x, y: readNumber(entity, "21") ?? start.y };
      segments.push({ id: `seg-${segmentIndex}`, layer, points: [start, end] });
      segmentIndex += 1;
    }

    if (pair.value === "LWPOLYLINE") {
      const entity = readEntity(pairs, index + 1);
      const layer = readString(entity, "8") ?? "0";
      const points = readPolylinePoints(entity);
      if (points.length >= 2) {
        segments.push({ id: `seg-${segmentIndex}`, layer, points });
        segmentIndex += 1;
      }
    }
  }

  return {
    segments,
    layers: [...new Set(segments.map((segment) => segment.layer))].sort(),
    bounds: calculateBounds(segments.flatMap((segment) => segment.points))
  };
}

function toPairs(content: string): DxfPair[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const pairs: DxfPair[] = [];
  for (let index = 0; index < lines.length - 1; index += 2) {
    pairs.push({ code: lines[index], value: lines[index + 1] });
  }
  return pairs;
}

function readEntity(pairs: DxfPair[], startIndex: number): DxfPair[] {
  const entity: DxfPair[] = [];
  for (let index = startIndex; index < pairs.length; index += 1) {
    if (pairs[index].code === "0") {
      break;
    }
    entity.push(pairs[index]);
  }
  return entity;
}

function readString(entity: DxfPair[], code: string): string | undefined {
  return entity.find((pair) => pair.code === code)?.value;
}

function readNumber(entity: DxfPair[], code: string): number | undefined {
  const value = readString(entity, code);
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readPolylinePoints(entity: DxfPair[]): Point[] {
  const points: Point[] = [];
  for (let index = 0; index < entity.length; index += 1) {
    if (entity[index].code !== "10") {
      continue;
    }

    const x = Number.parseFloat(entity[index].value);
    const nextY = entity.slice(index + 1).find((pair) => pair.code === "20");
    const y = nextY ? Number.parseFloat(nextY.value) : Number.NaN;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }
  return points;
}

function calculateBounds(points: Point[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 600 };
  }

  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y)
    }),
    { minX: points[0].x, minY: points[0].y, maxX: points[0].x, maxY: points[0].y }
  );
}
