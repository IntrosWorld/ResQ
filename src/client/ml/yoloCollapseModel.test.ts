import { describe, expect, it } from "vitest";
import { parseYoloCollapseOutputForTest } from "./yoloCollapseModel";

describe("parseYoloCollapseOutputForTest", () => {
  it("marks FallSafe YOLO fall detections as structural collapse emergencies", () => {
    const result = parseYoloCollapseOutputForTest(
      {
        dims: [1, 1, 6],
        data: new Float32Array([96, 128, 352, 416, 0.88, 0])
      },
      ["fall", "nofall"]
    );

    expect(result).toEqual(
      expect.objectContaining({
        isHazard: true,
        label: "fall",
        confidence: 0.88,
        hazardType: "structural",
        severity: "critical",
        bbox: expect.objectContaining({
          x: 15,
          y: 20,
          width: 40,
          height: 45
        })
      })
    );
  });

  it("does not alert for FallSafe nofall detections", () => {
    const result = parseYoloCollapseOutputForTest(
      {
        dims: [1, 1, 6],
        data: new Float32Array([96, 128, 352, 416, 0.93, 1])
      },
      ["fall", "nofall"]
    );

    expect(result.isHazard).toBe(false);
    expect(result.label).toBe("normal_posture");
  });
});
