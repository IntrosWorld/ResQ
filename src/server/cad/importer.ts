import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FloorMap } from "../../shared/types";
import { parseDxfPreview } from "./dxfParser";

export async function importFloorMap(filePath: string, originalName: string): Promise<FloorMap> {
  const extension = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, extension);

  if (extension === ".dxf") {
    const preview = parseDxfPreview(await readFile(filePath, "utf8"));
    return {
      id: `map-${Date.now()}`,
      buildingId: "building-demo",
      floorId: "floor-1",
      name: base,
      sourceType: "dxf",
      importStatus: "ready",
      message: `Imported ${preview.segments.length} DXF geometry segments. Manually confirm nodes before finalizing routes.`,
      segments: preview.segments,
      bounds: preview.bounds
    };
  }

  if (extension === ".dwg") {
    return {
      id: `map-${Date.now()}`,
      buildingId: "building-demo",
      floorId: "floor-1",
      name: base,
      sourceType: "dwg",
      importStatus: "needs_converter",
      message:
        "DWG uploaded. Configure DWG_CONVERTER_COMMAND with LibreDWG or ODA File Converter on the server to convert DWG to DXF for automatic preview.",
      segments: [],
      bounds: { minX: 0, minY: 0, maxX: 900, maxY: 560 }
    };
  }

  if ([".svg", ".png", ".jpg", ".jpeg"].includes(extension)) {
    return {
      id: `map-${Date.now()}`,
      buildingId: "building-demo",
      floorId: "floor-1",
      name: base,
      sourceType: extension === ".svg" ? "svg" : "image",
      importStatus: "ready",
      message: "Raster/SVG floor map uploaded as an underlay. Place and connect graph nodes manually.",
      segments: [],
      bounds: { minX: 0, minY: 0, maxX: 900, maxY: 560 }
    };
  }

  return {
    id: `map-${Date.now()}`,
    buildingId: "building-demo",
    floorId: "floor-1",
    name: base,
    sourceType: "image",
    importStatus: "unsupported",
    message: "Unsupported file type. Upload DWG, DXF, SVG, PNG, JPG, or JPEG.",
    segments: [],
    bounds: { minX: 0, minY: 0, maxX: 900, maxY: 560 }
  };
}
