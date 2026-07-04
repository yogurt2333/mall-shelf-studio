import { describe, expect, test } from "vitest";
import {
  createInitialProjectState,
  setCabinetGroupLocked,
  updateCabinetGroupCabinetCount,
  updateCabinetGroupPosition,
} from "../src/projectState";

describe("project state cabinet group calibration", () => {
  test("creates cabinet instances for each cabinet group count", () => {
    const state = createInitialProjectState();

    expect(state.cabinetGroups.A00.cabinets).toHaveLength(3);
    expect(state.cabinetGroups.A00.cabinets.map((cabinet) => cabinet.order)).toEqual([1, 2, 3]);
  });

  test("updates cabinet group position and clamps it inside the floor plan", () => {
    const state = createInitialProjectState();

    const updatedState = updateCabinetGroupPosition(state, "A00", {
      leftPercent: 99,
      topPercent: 99,
      widthPercent: 10,
      heightPercent: 10,
    });

    expect(updatedState.cabinetGroups.A00.position).toEqual({
      leftPercent: 90,
      topPercent: 90,
      widthPercent: 10,
      heightPercent: 10,
    });
  });

  test("does not move a locked cabinet group", () => {
    const state = setCabinetGroupLocked(createInitialProjectState(), "A00", true);

    const updatedState = updateCabinetGroupPosition(state, "A00", {
      leftPercent: 1,
      topPercent: 1,
      widthPercent: 1,
      heightPercent: 1,
    });

    expect(updatedState.cabinetGroups.A00.position).toEqual(state.cabinetGroups.A00.position);
  });

  test("updates cabinet count as a bounded integer", () => {
    const state = createInitialProjectState();

    const updatedState = updateCabinetGroupCabinetCount(state, "A00", 4.6);

    expect(updatedState.cabinetGroups.A00.cabinetCount).toBe(5);
  });
});
