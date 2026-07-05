import { describe, expect, test } from "vitest";
import {
  applyCabinetTemplate,
  createInitialProjectState,
  deleteCabinetTemplate,
  saveCabinetTemplate,
  setCabinetGroupLocked,
  updateCabinetStructure,
  updateCabinetGroupCabinetCount,
  updateCabinetGroupPosition,
  validateCabinetStructure,
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

describe("project state cabinet structure editing", () => {
  test("updates only the selected cabinet structure", () => {
    const state = createInitialProjectState();

    const updatedState = updateCabinetStructure(state, "A00", 1, {
      layers: [
        { heightPercent: 40, gapAfterPercent: 5, slotCount: 2 },
        { heightPercent: 30, gapAfterPercent: 0, slotCount: 4 },
      ],
      bottomBlankPercent: 25,
    });

    expect(updatedState.cabinetGroups.A00.cabinets[0].structure.layers).toHaveLength(2);
    expect(updatedState.cabinetGroups.A00.cabinets[0].slots).toHaveLength(6);
    expect(updatedState.cabinetGroups.A00.cabinets[1].structure.layers).toHaveLength(3);
  });

  test("validates cabinet layer height and spacing budget", () => {
    expect(
      validateCabinetStructure({
        layers: [
          { heightPercent: 60, gapAfterPercent: 10, slotCount: 2 },
          { heightPercent: 40, gapAfterPercent: 0, slotCount: 2 },
        ],
        bottomBlankPercent: 0,
      }),
    ).toEqual({
      isValid: false,
      usedPercent: 110,
      bottomBlankPercent: 0,
      message: "层高和层间距总和不能超过 100%",
    });
  });
});

describe("project state cabinet template library", () => {
  test("saves and applies a copied cabinet template to one cabinet", () => {
    const state = createInitialProjectState();
    const customStructure = {
      layers: [{ heightPercent: 50, gapAfterPercent: 0, slotCount: 2 }],
      bottomBlankPercent: 50,
    };

    const savedState = saveCabinetTemplate(state, "单层双格", customStructure);
    const appliedState = applyCabinetTemplate(
      savedState,
      "A00",
      2,
      savedState.cabinetTemplates[0].id,
    );

    expect(savedState.cabinetTemplates).toHaveLength(1);
    expect(savedState.cabinetTemplates[0].name).toBe("单层双格");
    expect(appliedState.cabinetGroups.A00.cabinets[1].structure).toEqual(customStructure);
    expect(appliedState.cabinetGroups.A00.cabinets[0].structure.layers).toHaveLength(3);
  });

  test("deleting a cabinet template does not change already applied cabinet structure", () => {
    const state = createInitialProjectState();
    const customStructure = {
      layers: [{ heightPercent: 50, gapAfterPercent: 0, slotCount: 2 }],
      bottomBlankPercent: 50,
    };

    const savedState = saveCabinetTemplate(state, "单层双格", customStructure);
    const appliedState = applyCabinetTemplate(
      savedState,
      "A00",
      2,
      savedState.cabinetTemplates[0].id,
    );
    const deletedState = deleteCabinetTemplate(appliedState, savedState.cabinetTemplates[0].id);

    expect(deletedState.cabinetTemplates).toHaveLength(0);
    expect(deletedState.cabinetGroups.A00.cabinets[1].structure).toEqual(customStructure);
  });
});
