import type { Bounds, DxfArc, DxfCircle, DxfSegment, DxfTextLabel, Node, NodeType, Point } from "../../shared/types";

interface DxfPair {
  code: string;
  value: string;
}

export interface DxfPreview {
  segments: DxfSegment[];
  labels: DxfTextLabel[];
  circles: DxfCircle[];
  arcs: DxfArc[];
  layers: string[];
  bounds: Bounds;
}

export function parseDxfPreview(content: string): DxfPreview {
  const pairs = toPairs(content);
  const segments: DxfSegment[] = [];
  const labels: DxfTextLabel[] = [];
  const circles: DxfCircle[] = [];
  const arcs: DxfArc[] = [];

  let segmentIndex = 1;
  let labelIndex = 1;
  let circleIndex = 1;
  let arcIndex = 1;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair.code !== "0") {
      continue;
    }

    if (pair.value === "LINE") {
      const { entity } = readEntity(pairs, index + 1);
      const layer = readString(entity, "8") ?? "0";
      const start = { x: readNumber(entity, "10") ?? 0, y: readNumber(entity, "20") ?? 0 };
      const end = { x: readNumber(entity, "11") ?? start.x, y: readNumber(entity, "21") ?? start.y };
      segments.push({ id: `seg-${segmentIndex}`, layer, points: [start, end], closed: false });
      segmentIndex += 1;
      continue;
    }

    if (pair.value === "LWPOLYLINE") {
      const { entity } = readEntity(pairs, index + 1);
      const layer = readString(entity, "8") ?? "0";
      const points = readPolylinePoints(entity);
      const closed = ((readNumber(entity, "70") ?? 0) & 1) === 1;
      if (points.length >= 2) {
        segments.push({ id: `seg-${segmentIndex}`, layer, points, closed });
        segmentIndex += 1;
      }
      continue;
    }

    if (pair.value === "POLYLINE") {
      const polyline = readLegacyPolyline(pairs, index + 1);
      const layer = readString(polyline.header, "8") ?? "0";
      const closed = ((readNumber(polyline.header, "70") ?? 0) & 1) === 1;
      if (polyline.points.length >= 2) {
        segments.push({ id: `seg-${segmentIndex}`, layer, points: polyline.points, closed });
        segmentIndex += 1;
      }
      index = polyline.endIndex;
      continue;
    }

    if (pair.value === "TEXT" || pair.value === "MTEXT") {
      const { entity } = readEntity(pairs, index + 1);
      const text = cleanDxfText(readAllStrings(entity, ["1", "3"]).join(""));
      if (text) {
        labels.push({
          id: `label-${labelIndex}`,
          layer: readString(entity, "8") ?? "0",
          text,
          x: readNumber(entity, "10") ?? 0,
          y: readNumber(entity, "20") ?? 0,
          height: readNumber(entity, "40") ?? 10,
          rotation: readNumber(entity, "50") ?? 0
        });
        labelIndex += 1;
      }
      continue;
    }

    if (pair.value === "CIRCLE") {
      const { entity } = readEntity(pairs, index + 1);
      circles.push({
        id: `circle-${circleIndex}`,
        layer: readString(entity, "8") ?? "0",
        x: readNumber(entity, "10") ?? 0,
        y: readNumber(entity, "20") ?? 0,
        radius: readNumber(entity, "40") ?? 0
      });
      circleIndex += 1;
      continue;
    }

    if (pair.value === "ARC") {
      const { entity } = readEntity(pairs, index + 1);
      arcs.push({
        id: `arc-${arcIndex}`,
        layer: readString(entity, "8") ?? "0",
        x: readNumber(entity, "10") ?? 0,
        y: readNumber(entity, "20") ?? 0,
        radius: readNumber(entity, "40") ?? 0,
        startAngle: readNumber(entity, "50") ?? 0,
        endAngle: readNumber(entity, "51") ?? 0
      });
      arcIndex += 1;
    }
  }

  return {
    segments,
    labels,
    circles,
    arcs,
    layers: [...new Set([...segments.map((segment) => segment.layer), ...labels.map((label) => label.layer), ...circles.map((circle) => circle.layer), ...arcs.map((arc) => arc.layer)])].sort(),
    bounds: calculateBounds(collectBoundsPoints(segments, labels, circles, arcs))
  };
}

export function inferNodesFromDxfPreview(preview: DxfPreview, floorId: string): Array<Omit<Node, "id">> {
  const nodes: Array<Omit<Node, "id">> = [];
  const usedLabelIds = new Set<string>();

  for (const segment of preview.segments) {
    if (segment.points.length < 2) {
      continue;
    }

    const label = segment.closed ? findLabelInsideSegment(segment, preview.labels, usedLabelIds) : undefined;
    const type = inferNodeType(segment.layer, segment.closed ? label?.text ?? "" : "");
    if (!type) {
      continue;
    }

    const center = segment.closed ? polygonCenter(segment.points) : pointsCenter(segment.points);
    if (label) {
      usedLabelIds.add(label.id);
    }

    nodes.push({
      label: label?.text ?? defaultNodeLabel(segment.layer, type, nodes.length + 1),
      type,
      x: Math.round(center.x * 100) / 100,
      y: Math.round(center.y * 100) / 100,
      floorId,
      metadata: {
        inferredFrom: "dxf",
        dxfLayer: segment.layer,
        sourceSegmentId: segment.id
      }
    });
  }

  for (const label of preview.labels) {
    if (usedLabelIds.has(label.id)) {
      continue;
    }

    const type = inferNodeType(label.layer, label.text);
    if (!type) {
      continue;
    }

    nodes.push({
      label: label.text,
      type,
      x: label.x,
      y: label.y,
      floorId,
      metadata: {
        inferredFrom: "dxf",
        dxfLayer: label.layer,
        sourceLabelId: label.id
      }
    });
  }

  return makeUniqueNodeLabels(nodes);
}

function toPairs(content: string): DxfPair[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const pairs: DxfPair[] = [];
  for (let index = 0; index < lines.length - 1; index += 2) {
    pairs.push({ code: lines[index], value: lines[index + 1] });
  }
  return pairs;
}

function readEntity(pairs: DxfPair[], startIndex: number): { entity: DxfPair[]; endIndex: number } {
  const entity: DxfPair[] = [];
  let index = startIndex;
  for (; index < pairs.length; index += 1) {
    if (pairs[index].code === "0") {
      break;
    }
    entity.push(pairs[index]);
  }
  return { entity, endIndex: index };
}

function readLegacyPolyline(pairs: DxfPair[], startIndex: number): { header: DxfPair[]; points: Point[]; endIndex: number } {
  const headerResult = readEntity(pairs, startIndex);
  const points: Point[] = [];
  let index = headerResult.endIndex;

  while (index < pairs.length) {
    const pair = pairs[index];
    if (pair.code === "0" && pair.value === "SEQEND") {
      return { header: headerResult.entity, points, endIndex: index };
    }

    if (pair.code === "0" && pair.value === "VERTEX") {
      const { entity, endIndex } = readEntity(pairs, index + 1);
      const x = readNumber(entity, "10");
      const y = readNumber(entity, "20");
      if (x !== undefined && y !== undefined) {
        points.push({ x, y });
      }
      index = endIndex;
      continue;
    }

    index += 1;
  }

  return { header: headerResult.entity, points, endIndex: index };
}

function readString(entity: DxfPair[], code: string): string | undefined {
  return entity.find((pair) => pair.code === code)?.value;
}

function readAllStrings(entity: DxfPair[], codes: string[]): string[] {
  return entity.filter((pair) => codes.includes(pair.code)).map((pair) => pair.value);
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

    const yPair = entity.slice(index + 1).find((pair) => pair.code === "20");
    const x = Number.parseFloat(entity[index].value);
    const y = yPair ? Number.parseFloat(yPair.value) : Number.NaN;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }
  return points;
}

function cleanDxfText(text: string): string {
  return text
    .replace(/\\P/g, " ")
    .replace(/\\[A-Za-z]+[0-9.;,-]*/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferNodeType(layer: string, text = ""): NodeType | undefined {
  const source = `${layer} ${text}`.toUpperCase();
  const label = text.toUpperCase().replace(/\s+/g, " ").trim();
  if (/^(GROUND|FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\s+FLOOR$/.test(label)) return undefined;
  if (source.includes("EXIT") || source.includes("ELEVATION OUT")) return "exit";
  if (source.includes("STAIR")) return "staircase";
  if (source.includes("CAMERA") || source.includes("CCTV")) return "camera";
  if (source.includes("SENSOR") || source.includes("SMOKE") || source.includes("GAS")) return "sensor";
  if (source.includes("BEACON") || source.includes("BLE")) return "ble_beacon";
  if (source.includes("QR")) return "qr_checkpoint";
  if (source.includes("ACTUATOR") || source.includes("ALARM")) return "actuator";
  if (source.includes("EXTINGUISHER") || source.includes("FIRE_EQUIPMENT")) return "extinguisher";
  if (source.includes("CORRIDOR") || source.includes("PATH") || source.includes("PASSAGE") || source.includes("HALL") || source.includes("WALKWAY")) return "pathway";
  if (
    source.includes("ROOM") ||
    source.includes("UNIT") ||
    source.includes("SUITE") ||
    source.includes("OFFICE") ||
    source.includes("KITCHEN") ||
    source.includes("BATH") ||
    source.includes("TOILET") ||
    source.includes("WASH") ||
    source.includes("VERANDA") ||
    source.includes("PARKING") ||
    source.includes("LOBBY") ||
    source.includes("STORE")
  ) {
    return "room";
  }
  return undefined;
}

function makeUniqueNodeLabels(nodes: Array<Omit<Node, "id">>): Array<Omit<Node, "id">> {
  const counts = new Map<string, number>();
  const seen = new Map<string, number>();

  for (const node of nodes) {
    const key = normalizedLabelKey(node.label);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return nodes.map((node) => {
    const key = normalizedLabelKey(node.label);
    const total = counts.get(key) ?? 0;
    if (total <= 1) {
      return node;
    }

    const index = (seen.get(key) ?? 0) + 1;
    seen.set(key, index);
    return {
      ...node,
      label: `${node.label} ${index}`
    };
  });
}

function normalizedLabelKey(label: string): string {
  return label.replace(/\s+/g, " ").trim().toUpperCase();
}

function findLabelInsideSegment(segment: DxfSegment, labels: DxfTextLabel[], usedLabelIds: Set<string>): DxfTextLabel | undefined {
  return labels.find((label) => !usedLabelIds.has(label.id) && pointInPolygon(label, segment.points));
}

function defaultNodeLabel(layer: string, type: NodeType, index: number): string {
  const normalizedLayer = layer.trim() || "DXF";
  if (type === "room") return `${normalizedLayer} room ${index}`;
  if (type === "pathway") return `${normalizedLayer} pathway`;
  return `${normalizedLayer} ${type.replace("_", " ")}`;
}

function polygonCenter(points: Point[]): Point {
  const bounds = calculateBounds(points);
  return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
}

function pointsCenter(points: Point[]): Point {
  const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x < ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) / (previousPoint.y - currentPoint.y) + currentPoint.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function collectBoundsPoints(segments: DxfSegment[], labels: DxfTextLabel[], circles: DxfCircle[], arcs: DxfArc[]): Point[] {
  return [
    ...segments.flatMap((segment) => segment.points),
    ...labels.map((label) => ({ x: label.x, y: label.y })),
    ...circles.flatMap(circleBoundsPoints),
    ...arcs.flatMap(circleBoundsPoints)
  ];
}

function circleBoundsPoints(circle: DxfCircle): Point[] {
  return [
    { x: circle.x - circle.radius, y: circle.y - circle.radius },
    { x: circle.x + circle.radius, y: circle.y + circle.radius }
  ];
}

function calculateBounds(points: Point[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 600 };
  }

  const rawBounds = points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y)
    }),
    { minX: points[0].x, minY: points[0].y, maxX: points[0].x, maxY: points[0].y }
  );

  return {
    minX: round(rawBounds.minX),
    minY: round(rawBounds.minY),
    maxX: round(rawBounds.maxX),
    maxY: round(rawBounds.maxY)
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
