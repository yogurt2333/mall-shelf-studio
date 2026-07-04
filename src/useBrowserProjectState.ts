import { useEffect, useState } from "react";
import { createInitialProjectState, type ProjectState } from "./projectState";

const projectStateStorageKey = "mall-shelf-studio.project-state";

function loadBrowserProjectState(): ProjectState {
  const fallbackState = createInitialProjectState();

  try {
    const savedState = window.localStorage.getItem(projectStateStorageKey);
    return savedState ? mergeWithFallbackState(JSON.parse(savedState) as ProjectState) : fallbackState;
  } catch {
    return fallbackState;
  }
}

function mergeWithFallbackState(savedState: ProjectState): ProjectState {
  const fallbackState = createInitialProjectState();

  return {
    ...fallbackState,
    ...savedState,
    floorPlan: {
      ...fallbackState.floorPlan,
      ...savedState.floorPlan,
    },
    cabinetGroups: Object.fromEntries(
      Object.entries(fallbackState.cabinetGroups).map(([id, fallbackCabinetGroup]) => [
        id,
        {
          ...fallbackCabinetGroup,
          ...savedState.cabinetGroups?.[id],
          position: {
            ...fallbackCabinetGroup.position,
            ...savedState.cabinetGroups?.[id]?.position,
          },
        },
      ]),
    ),
  };
}

export function useBrowserProjectState() {
  const [projectState, setProjectState] = useState<ProjectState>(() => loadBrowserProjectState());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "failed">("idle");

  useEffect(() => {
    try {
      window.localStorage.setItem(projectStateStorageKey, JSON.stringify(projectState));
      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    }
  }, [projectState]);

  return {
    projectState,
    saveStatus,
    setProjectState,
  };
}
