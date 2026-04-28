import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FloorMap, Node } from "../../shared/types";
import { inferNodesFromDxfPreview, parseDxfPreview } from "./dxfParser";

export interface FloorMapImport {
  floorMap: FloorMap;
  inferredNodes: Array<Omit<Node, "id">>;
}

export async function importFloorMap(filePath: string, originalName: string): Promise<FloorMapImport> {
  const extension = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, extension);

  if (extension === ".dxf") {
    const preview = parseDxfPreview(await readFile(filePath, "utf8"));
    const floorId = "floor-1";
    const inferredNodes = inferNodesFromDxfPreview(preview, floorId);
    return {
      floorMap: {
        id: `map-${Date.now()}`,
        buildingId: "building-demo",
        floorId,
        name: base,
        sourceType: "dxf",
        importStatus: "ready",
        message: `Imported ${preview.segments.length} DXF paths, ${preview.labels.length} labels, and ${inferredNodes.length} editable nodes.`,
        segments: preview.segments,
        labels: preview.labels,
        circles: preview.circles,
        arcs: preview.arcs,
        bounds: preview.bounds
      },
      inferredNodes
    };
  }

  if (extension === ".dwg") {
    return {
      floorMap: {
        id: `map-${Date.now()}`,
        buildingId: "building-demo",
        floorId: "floor-1",
        name: base,
        sourceType: "dwg",
        importStatus: "needs_converter",
        message:
          "DWG uploaded. Configure DWG_CONVERTER_COMMAND with LibreDWG or ODA File Converter on the server to convert DWG to DXF for automatic preview.",
        segments: [],
        labels: [],
        circles: [],
        arcs: [],
        bounds: { minX: 0, minY: 0, maxX: 900, maxY: 560 }
      },
      inferredNodes: []
    };
  }

  if ([".svg", ".png", ".jpg", ".jpeg"].includes(extension)) {
    return {
      floorMap: {
        id: `map-${Date.now()}`,
        buildingId: "building-demo",
        floorId: "floor-1",
        name: base,
        sourceType: extension === ".svg" ? "svg" : "image",
        importStatus: "ready",
        message: "Raster/SVG floor map uploaded as an underlay. Place and connect graph nodes manually.",
        segments: [],
        labels: [],
        circles: [],
        arcs: [],
        bounds: { minX: 0, minY: 0, maxX: 900, maxY: 560 }
      },
      inferredNodes: []
    };
  }

  return {
    floorMap: {
      id: `map-${Date.now()}`,
      buildingId: "building-demo",
      floorId: "floor-1",
      name: base,
      sourceType: "image",
      importStatus: "unsupported",
      message: "Unsupported file type. Upload DWG, DXF, SVG, PNG, JPG, or JPEG.",
      segments: [],
      labels: [],
      circles: [],
      arcs: [],
      bounds: { minX: 0, minY: 0, maxX: 900, maxY: 560 }
    },
    inferredNodes: []
  };
}
