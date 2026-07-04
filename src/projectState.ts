import { floorPlanConfig, type CabinetGroupStatus } from "./floorPlanConfig";

export type ProjectStateCabinetGroup = {
  id: string;
  status: CabinetGroupStatus;
  cabinetCount: number;
  lastExportPath: string | null;
};

export type ProjectState = {
  floorPlan: {
    imagePath: string;
    cabinetGroups: Array<{
      id: string;
      name: string;
      cabinetCount: number;
    }>;
  };
  selectedCabinetGroupId: string | null;
  cabinetGroups: Record<string, ProjectStateCabinetGroup>;
};

export function createInitialProjectState(): ProjectState {
  return {
    floorPlan: {
      imagePath: "assets/floorplan.jpg",
      cabinetGroups: floorPlanConfig.cabinetGroups.map((group) => ({
        id: group.id,
        name: group.name,
        cabinetCount: group.cabinetCount,
      })),
    },
    selectedCabinetGroupId: null,
    cabinetGroups: Object.fromEntries(
      floorPlanConfig.cabinetGroups.map((group) => [
        group.id,
        {
          id: group.id,
          status: group.status,
          cabinetCount: group.cabinetCount,
          lastExportPath: null,
        },
      ]),
    ),
  };
}

export function selectCabinetGroup(state: ProjectState, cabinetGroupId: string): ProjectState {
  if (!state.cabinetGroups[cabinetGroupId]) {
    return state;
  }

  return {
    ...state,
    selectedCabinetGroupId: cabinetGroupId,
  };
}
