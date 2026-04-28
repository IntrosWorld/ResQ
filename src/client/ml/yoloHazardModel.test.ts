import { describe, expect, it } from "vitest";
import { parseYoloOutputForTest } from "./yoloHazardModel";

describe("parseYoloOutputForTest", () => {
  it("parses YOLOv10 exported rows shaped as x1 y1 x2 y2 confidence class", () => {
    const result = parseYoloOutputForTest(
      {
        dims: [1, 1, 6],
        data: new Float32Array([64, 128, 320, 384, 0.92, 0])
      },
      ["fire", "smoke"]
    );

    expect(result).toEqual(
      expect.objectContaining({
        isHazard: true,
        label: "fire",
        confidence: 0.92,
        hazardType: "fire",
        severity: "critical",
        bbox: expect.objectContaining({
          x: 10,
          y: 20,
          width: 40,
          height: 40
        })
      })
    );
  });
});
