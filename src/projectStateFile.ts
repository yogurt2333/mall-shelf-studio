import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createInitialProjectState, type ProjectState } from "./projectState";

export async function loadProjectState(path: string): Promise<ProjectState> {
  try {
    const text = await readFile(path, "utf8");
    return JSON.parse(text) as ProjectState;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return createInitialProjectState();
    }

    throw error;
  }
}

export async function saveProjectState(path: string, state: ProjectState): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
