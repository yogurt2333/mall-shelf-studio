import { describe, expect, test } from "vitest";

import { floorPlanConfig } from "../src/floorPlanConfig";

describe("packaged asset paths", () => {
  test("uses a base-relative floor plan image path for file protocol builds", () => {
    expect(floorPlanConfig.imagePath).toBe("./assets/floorplan.jpg");
    expect(floorPlanConfig.imagePath).not.toMatch(/^\/assets\//);
  });
});
