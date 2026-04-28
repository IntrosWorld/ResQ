import { describe, expect, it } from "vitest";
import { runCctvYoloSimulation } from "./cctvDetection";

describe("runCctvYoloSimulation", () => {
  it("returns a clear result for normal CCTV", () => {
    const result = runCctvYoloSimulation("clear-corridor");

    expect(result.isHazard).toBe(false);
    expect(result.hazardType).toBeUndefined();
  });

  it("returns hazard metadata for fire and smoke clips", () => {
    const smoke = runCctvYoloSimulation("smoke-east");
    const fire = runCctvYoloSimulation("fire-lobby");

    expect(smoke).toEqual(expect.objectContaining({ isHazard: true, hazardType: "smoke", severity: "high" }));
    expect(fire).toEqual(expect.objectContaining({ isHazard: true, hazardType: "fire", severity: "critical" }));
  });
});
