import { useEffect, useState } from "react";
import { createInitialProjectState, type ProjectState } from "./projectState";

const projectStateStorageKey = "mall-shelf-studio.project-state";

function loadBrowserProjectState(): ProjectState {
  const fallbackState = createInitialProjectState();

  try {
    const savedState = window.localStorage.getItem(projectStateStorageKey);
    return savedState ? (JSON.parse(savedState) as ProjectState) : fallbackState;
  } catch {
    return fallbackState;
  }
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
