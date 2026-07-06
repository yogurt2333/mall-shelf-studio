import { describe, expect, test } from "vitest";

import { resolveProductImageSrc, shouldWarnBeforeUnload } from "../src/App";
import { createInitialProjectState, updateProductSlot } from "../src/projectState";

function createGroupWithUnexportedEdit() {
  const state = updateProductSlot(
    createInitialProjectState(),
    "A00",
    1,
    0,
    0,
    { name: "bag" },
  );

  return state.cabinetGroups.A00;
}

describe("desktop runtime behavior", () => {
  test("uses the Electron asset resolver for persisted product image paths", () => {
    const imageSrc = resolveProductImageSrc(
      "assets/products/product_20260704153012_001.svg",
      {},
      (relativePath) => `mall-shelf-studio-asset://project/${relativePath}`,
    );

    expect(imageSrc).toBe(
      "mall-shelf-studio-asset://project/assets/products/product_20260704153012_001.svg",
    );
  });

  test("keeps browser unload warnings but does not block desktop window close", () => {
    const group = createGroupWithUnexportedEdit();

    expect(shouldWarnBeforeUnload(group, false)).toBe(true);
    expect(shouldWarnBeforeUnload(group, true)).toBe(false);
  });
});
