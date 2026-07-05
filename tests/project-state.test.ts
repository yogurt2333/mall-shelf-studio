import { describe, expect, test } from "vitest";
import {
  applyCabinetTemplate,
  createInitialProjectState,
  deleteCabinetTemplate,
  saveCabinetTemplate,
  clearProductSlot,
  countEmptyProductSlots,
  createParallelViewExportPath,
  hasUnexportedCabinetGroupEdits,
  markParallelViewExported,
  setCabinetGroupLocked,
  updateProductSlot,
  updateCabinetStructure,
  updateCabinetGroupCabinetCount,
  updateCabinetGroupPosition,
  validateCabinetStructure,
} from "../src/projectState";
import { createProductImageAssetPath } from "../src/productImageAssets";

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

  test("bounds product slot counts before generating cabinet slots", () => {
    const state = createInitialProjectState();

    const updatedState = updateCabinetStructure(state, "A00", 1, {
      layers: [{ heightPercent: 50, gapAfterPercent: 0, slotCount: 999 }],
      bottomBlankPercent: 50,
    });

    expect(updatedState.cabinetGroups.A00.cabinets[0].structure.layers[0].slotCount).toBe(12);
    expect(updatedState.cabinetGroups.A00.cabinets[0].slots).toHaveLength(12);
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

  test("preserves compatible product slots and drops removed slots when applying a template", () => {
    const customStructure = {
      layers: [
        { heightPercent: 60, gapAfterPercent: 0, slotCount: 2 },
        { heightPercent: 30, gapAfterPercent: 0, slotCount: 1 },
      ],
      bottomBlankPercent: 10,
    };
    const savedState = saveCabinetTemplate(createInitialProjectState(), "two layer", customStructure);
    const stateWithProducts = updateProductSlot(
      updateProductSlot(savedState, "A00", 1, 0, 1, {
        imagePath: "assets/products/kept.png",
        name: "kept",
        code: "KEEP",
      }),
      "A00",
      1,
      2,
      1,
      {
        imagePath: "assets/products/removed.png",
        name: "removed",
        code: "DROP",
      },
    );

    const appliedState = applyCabinetTemplate(
      stateWithProducts,
      "A00",
      1,
      savedState.cabinetTemplates[0].id,
    );
    const appliedSlots = appliedState.cabinetGroups.A00.cabinets[0].slots;

    expect(appliedSlots).toHaveLength(3);
    expect(appliedSlots.find((slot) => slot.layerIndex === 0 && slot.slotIndex === 1)).toEqual({
      layerIndex: 0,
      slotIndex: 1,
      imagePath: "assets/products/kept.png",
      name: "kept",
      code: "KEEP",
    });
    expect(appliedSlots.find((slot) => slot.name === "removed")).toBeUndefined();
  });
});

describe("project state product slot editing", () => {
  test("updates only the selected product slot", () => {
    const state = createInitialProjectState();

    const updatedState = updateProductSlot(state, "A00", 1, 0, 1, {
      imagePath: "assets/products/bag.png",
      name: "女款休闲包",
      code: "MEFBCOA52",
    });

    expect(updatedState.cabinetGroups.A00.status).toBe("inProgress");
    expect(updatedState.cabinetGroups.A00.cabinets[0].slots[1]).toEqual({
      layerIndex: 0,
      slotIndex: 1,
      imagePath: "assets/products/bag.png",
      name: "女款休闲包",
      code: "MEFBCOA52",
    });
    expect(updatedState.cabinetGroups.A00.cabinets[0].slots[0].name).toBe("");
    expect(updatedState.cabinetGroups.A00.cabinets[1].slots[1].name).toBe("");
  });

  test("clears the selected product slot without changing its position", () => {
    const state = updateProductSlot(createInitialProjectState(), "A00", 1, 0, 1, {
      imagePath: "assets/products/bag.png",
      name: "女款休闲包",
      code: "MEFBCOA52",
    });

    const updatedState = clearProductSlot(state, "A00", 1, 0, 1);

    expect(updatedState.cabinetGroups.A00.cabinets[0].slots[1]).toEqual({
      layerIndex: 0,
      slotIndex: 1,
      imagePath: null,
      name: "",
      code: "",
    });
  });

  test("stores uploaded product image assets as relative project paths", () => {
    const imagePath = createProductImageAssetPath(
      "C:/Users/demo/Desktop/Bag Photo.JPG",
      new Date("2026-07-04T15:30:12"),
      7,
    );
    const state = updateProductSlot(createInitialProjectState(), "A00", 1, 0, 1, {
      imagePath,
    });

    expect(imagePath).toBe("assets/products/product_20260704153012_007.jpg");
    expect(imagePath).not.toMatch(/^[a-z]:/i);
    expect(imagePath).not.toContain("base64");
    expect(state.cabinetGroups.A00.cabinets[0].slots[1].imagePath).toBe(imagePath);
  });
});

describe("project state parallel view export", () => {
  test("creates a relative PNG export path from cabinet group id and date", () => {
    expect(createParallelViewExportPath("A00", new Date("2026-07-04T15:30:00"))).toBe(
      "exports/A00_20260704_1530.png",
    );
  });

  test("marks a cabinet group's latest exported PNG path", () => {
    const state = createInitialProjectState();

    const updatedState = markParallelViewExported(state, "A00", "exports/A00_20260704_1530.png");

    expect(updatedState.cabinetGroups.A00.lastExportPath).toBe("exports/A00_20260704_1530.png");
    expect(updatedState.cabinetGroups.A00.status).toBe("saved");
    expect(updatedState.cabinetGroups.A01.lastExportPath).toBeNull();
  });

  test("moves a saved cabinet group back to in progress after product edits", () => {
    const state = markParallelViewExported(
      createInitialProjectState(),
      "A00",
      "exports/A00_20260704_1530.png",
    );

    const updatedState = updateProductSlot(state, "A00", 1, 0, 1, {
      name: "女款休闲包",
    });

    expect(updatedState.cabinetGroups.A00.status).toBe("inProgress");
    expect(updatedState.cabinetGroups.A00.lastExportPath).toBe("exports/A00_20260704_1530.png");
  });

  test("detects cabinet groups with edits that have not been exported to PNG", () => {
    const editedState = updateProductSlot(createInitialProjectState(), "A00", 1, 0, 1, {
      name: "bag",
    });
    const exportedState = markParallelViewExported(
      editedState,
      "A00",
      "exports/A00_20260704_1530.png",
    );

    expect(hasUnexportedCabinetGroupEdits(editedState.cabinetGroups.A00)).toBe(true);
    expect(hasUnexportedCabinetGroupEdits(exportedState.cabinetGroups.A00)).toBe(false);
    expect(hasUnexportedCabinetGroupEdits(createInitialProjectState().cabinetGroups.A00)).toBe(
      false,
    );
  });

  test("counts empty product slots for one cabinet group", () => {
    const state = updateProductSlot(createInitialProjectState(), "A00", 1, 0, 1, {
      imagePath: "assets/products/bag.png",
      name: "女款休闲包",
      code: "MEFBCOA52",
    });

    expect(countEmptyProductSlots(state.cabinetGroups.A00)).toBe(23);
  });
});
