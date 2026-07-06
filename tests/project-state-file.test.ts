import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { createInitialProjectState } from "../src/projectState";
import { loadProjectState, saveProjectState } from "../src/projectStateFile";

describe("project state file", () => {
  test("creates a recoverable JSON state file with relative asset paths", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mall-shelf-studio-"));
    const statePath = join(directory, "project-state.json");
    const initialState = createInitialProjectState();

    await saveProjectState(statePath, {
      ...initialState,
      selectedCabinetGroupId: "A00",
      cabinetGroups: {
        ...initialState.cabinetGroups,
        A00: {
          ...initialState.cabinetGroups.A00,
          status: "inProgress",
        },
      },
    });

    const savedText = await readFile(statePath, "utf8");
    expect(savedText).toContain('"imagePath": "assets/floorplan.jpg"');
    expect(savedText).not.toContain(directory);

    const loadedState = await loadProjectState(statePath);
    expect(loadedState.selectedCabinetGroupId).toBe("A00");
    expect(loadedState.cabinetGroups.A00.status).toBe("inProgress");
    expect(loadedState.floorPlan.cabinetGroups[0]).toMatchObject({
      id: "A00",
      name: "中岛横向货柜组",
      cabinetCount: 3,
    });
  });

  test("creates local product asset and export directories beside the project state file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mall-shelf-studio-"));
    const statePath = join(directory, "project-state.json");

    await saveProjectState(statePath, createInitialProjectState());

    expect((await stat(join(directory, "assets", "products"))).isDirectory()).toBe(true);
    expect((await stat(join(directory, "exports"))).isDirectory()).toBe(true);
  });
});
