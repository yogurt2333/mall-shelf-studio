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
    cabinetTemplates: savedState.cabinetTemplates ?? fallbackState.cabinetTemplates,
    cabinetGroups: Object.fromEntries(
      Object.entries(fallbackState.cabinetGroups).map(([id, fallbackCabinetGroup]) => [
        id,
        {
          ...fallbackCabinetGroup,
          ...savedState.cabinetGroups?.[id],
          cabinets:
            savedState.cabinetGroups?.[id]?.cabinets?.length ===
            (savedState.cabinetGroups?.[id]?.cabinetCount ?? fallbackCabinetGroup.cabinetCount)
              ? savedState.cabinetGroups[id].cabinets
              : fallbackCabinetGroup.cabinets,
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
  const [isDesktopStateLoaded, setIsDesktopStateLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadDesktopProjectState() {
      try {
        const desktopState = await window.mallShelfStudio?.loadProjectState?.();

        if (!isCancelled && desktopState) {
          setProjectState(mergeWithFallbackState(desktopState as ProjectState));
        }
      } finally {
        if (!isCancelled) {
          setIsDesktopStateLoaded(true);
        }
      }
    }

    if (window.mallShelfStudio?.loadProjectState) {
      void loadDesktopProjectState();
      return () => {
        isCancelled = true;
      };
    }

    setIsDesktopStateLoaded(true);

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isDesktopStateLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(projectStateStorageKey, JSON.stringify(projectState));
    } catch {
      if (!window.mallShelfStudio?.saveProjectState) {
        setSaveStatus("failed");
        return;
      }
    }

    async function saveProjectState() {
      try {
        if (window.mallShelfStudio?.saveProjectState) {
          await window.mallShelfStudio.saveProjectState(projectState);
        }

        setSaveStatus("saved");
      } catch {
        setSaveStatus("failed");
      }
    }

    void saveProjectState();
  }, [isDesktopStateLoaded, projectState]);

  return {
    projectState,
    saveStatus,
    setProjectState,
  };
}
