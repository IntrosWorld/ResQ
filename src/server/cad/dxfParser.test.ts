import { describe, expect, it } from "vitest";
import { inferNodesFromDxfPreview, parseDxfPreview } from "./dxfParser";

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

const labeledRoomDxf = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
ROOMS
70
1
90
4
10
10
20
10
10
110
20
10
10
110
20
70
10
10
20
70
0
TEXT
8
ROOM_LABELS
10
60
20
42
40
8
1
Room 204
0
CIRCLE
8
SENSORS
10
160
20
45
40
12
0
ARC
8
DOORS
10
110
20
10
40
22
50
0
51
90
0
POLYLINE
8
PATHWAYS
70
0
0
VERTEX
8
PATHWAYS
10
130
20
20
0
VERTEX
8
PATHWAYS
10
210
20
20
0
SEQEND
0
ENDSEC
0
EOF`;

const genericLabeledRoomDxf = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
70
1
90
4
10
0
20
0
10
100
20
0
10
100
20
80
10
0
20
80
0
TEXT
8
ANNOTATION
10
42
20
32
40
6
1
BED ROOM
0
ENDSEC
0
EOF`;

const labelOnlyRoomsDxf = `0
SECTION
2
ENTITIES
0
TEXT
8
ANNOTATION
10
0
20
100
40
4
1
FIRST FLOOR
0
TEXT
8
ROOM_LABELS
10
10
20
10
40
4
1
KITCHEN
0
TEXT
8
ROOM_LABELS
10
40
20
10
40
4
1
BED ROOM
0
TEXT
8
ROOM_LABELS
10
70
20
10
40
4
1
BATH
0
TEXT
8
ROOM_LABELS
10
10
20
40
40
4
1
HALL
0
TEXT
8
ROOM_LABELS
10
40
20
40
40
4
1
HALL
0
TEXT
8
ROOM_LABELS
10
70
20
40
40
4
1
CAR PARKING
0
TEXT
8
ROOM_LABELS
10
10
20
70
40
4
1
PASSAGE 6FEET WIDE
0
ENDSEC
0
EOF`;

describe("parseDxfPreview", () => {
  it("extracts line and lightweight polyline segments with layers and bounds", () => {
    const preview = parseDxfPreview(simpleDxf);

    expect(preview.segments).toEqual([
      { id: "seg-1", layer: "WALLS", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], closed: false },
      {
        id: "seg-2",
        layer: "CORRIDORS",
        points: [
          { x: 100, y: 0 },
          { x: 140, y: 40 },
          { x: 200, y: 40 }
        ],
        closed: false
      }
    ]);
    expect(preview.layers).toEqual(["CORRIDORS", "WALLS"]);
    expect(preview.bounds).toEqual({ minX: 0, minY: 0, maxX: 200, maxY: 40 });
  });

  it("keeps labels, circles, arcs, old polylines, and closed room state", () => {
    const preview = parseDxfPreview(labeledRoomDxf);

    expect(preview.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ layer: "ROOMS", closed: true }),
        expect.objectContaining({ layer: "PATHWAYS", points: [{ x: 130, y: 20 }, { x: 210, y: 20 }] })
      ])
    );
    expect(preview.labels).toEqual([
      expect.objectContaining({ layer: "ROOM_LABELS", text: "Room 204", x: 60, y: 42, height: 8 })
    ]);
    expect(preview.circles).toEqual([expect.objectContaining({ layer: "SENSORS", x: 160, y: 45, radius: 12 })]);
    expect(preview.arcs).toEqual([expect.objectContaining({ layer: "DOORS", x: 110, y: 10, radius: 22, startAngle: 0, endAngle: 90 })]);
    expect(preview.bounds).toEqual({ minX: 10, minY: -12, maxX: 210, maxY: 70 });
  });
});

describe("inferNodesFromDxfPreview", () => {
  it("places editable room nodes at closed-room centers and uses original labels", () => {
    const preview = parseDxfPreview(labeledRoomDxf);
    const nodes = inferNodesFromDxfPreview(preview, "floor-1");

    expect(nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Room 204",
          type: "room",
          x: 60,
          y: 40,
          floorId: "floor-1",
          metadata: expect.objectContaining({ inferredFrom: "dxf", dxfLayer: "ROOMS" })
        }),
        expect.objectContaining({
          label: "PATHWAYS pathway",
          type: "pathway",
          x: 170,
          y: 20
        })
      ])
    );
  });

  it("uses room labels to classify generic closed outlines without adding duplicate label nodes", () => {
    const preview = parseDxfPreview(genericLabeledRoomDxf);
    const nodes = inferNodesFromDxfPreview(preview, "floor-1");

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toEqual(
      expect.objectContaining({
        label: "BED ROOM",
        type: "room",
        x: 50,
        y: 40,
        floorId: "floor-1",
        metadata: expect.objectContaining({ inferredFrom: "dxf", sourceSegmentId: "seg-1" })
      })
    );
  });

  it("creates editable nodes from room labels and numbers duplicate names", () => {
    const preview = parseDxfPreview(labelOnlyRoomsDxf);
    const nodes = inferNodesFromDxfPreview(preview, "floor-1");

    expect(nodes.map((node) => node.label)).toEqual([
      "KITCHEN",
      "BED ROOM",
      "BATH",
      "HALL 1",
      "HALL 2",
      "CAR PARKING",
      "PASSAGE 6FEET WIDE"
    ]);
    expect(nodes.find((node) => node.label === "FIRST FLOOR")).toBeUndefined();
    expect(nodes.find((node) => node.label === "KITCHEN")).toEqual(expect.objectContaining({ type: "room", x: 10, y: 10 }));
    expect(nodes.find((node) => node.label === "PASSAGE 6FEET WIDE")).toEqual(expect.objectContaining({ type: "pathway" }));
  });
});
