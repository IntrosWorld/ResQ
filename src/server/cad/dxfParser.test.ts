import { describe, expect, it } from "vitest";
import { parseDxfPreview } from "./dxfParser";

const simpleDxf = `0
SECTION
2
ENTITIES
0
LINE
8
WALLS
10
0
20
0
11
100
21
0
0
LWPOLYLINE
8
CORRIDORS
90
3
10
100
20
0
10
140
20
40
10
200
20
40
0
ENDSEC
0
EOF`;

describe("parseDxfPreview", () => {
  it("extracts line and lightweight polyline segments with layers and bounds", () => {
    const preview = parseDxfPreview(simpleDxf);

    expect(preview.segments).toEqual([
      { id: "seg-1", layer: "WALLS", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] },
      {
        id: "seg-2",
        layer: "CORRIDORS",
        points: [
          { x: 100, y: 0 },
          { x: 140, y: 40 },
          { x: 200, y: 40 }
        ]
      }
    ]);
    expect(preview.layers).toEqual(["CORRIDORS", "WALLS"]);
    expect(preview.bounds).toEqual({ minX: 0, minY: 0, maxX: 200, maxY: 40 });
  });
});
