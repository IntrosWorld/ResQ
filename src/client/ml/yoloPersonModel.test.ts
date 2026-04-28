import { describe, expect, it } from "vitest";
import { parseYoloPersonOutputForTest } from "./yoloPersonModel";

describe("parseYoloPersonOutputForTest", () => {
  it("returns person detections above threshold", () => {
    const result = parseYoloPersonOutputForTest({ dims: [1, 1, 6], data: new Float32Array([64, 96, 320, 416, 0.81, 0]) });

    expect(result).toEqual(
      expect.objectContaining({
        hasPerson: true,
        count: 1,
        topDetection: expect.objectContaining({ confidence: 0.81, bbox: expect.objectContaining({ x: 10, y: 15, width: 40, height: 50 }) })
      })
    );
  });

  it("ignores detections below threshold", () => {
    const result = parseYoloPersonOutputForTest({ dims: [1, 1, 6], data: new Float32Array([64, 96, 320, 416, 0.2, 0]) });

    expect(result.hasPerson).toBe(false);
    expect(result.count).toBe(0);
  });
});
