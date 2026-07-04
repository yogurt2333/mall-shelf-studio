import { floorPlanConfig, type CabinetGroupStatus } from "./floorPlanConfig";

export type CabinetGroupPosition = {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
};

export type ProjectStateCabinetGroup = {
  id: string;
  status: CabinetGroupStatus;
  cabinetCount: number;
  locked: boolean;
  position: CabinetGroupPosition;
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
          locked: false,
          position: group.position,
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

export function updateCabinetGroupPosition(
  state: ProjectState,
  cabinetGroupId: string,
  position: CabinetGroupPosition,
): ProjectState {
  const cabinetGroup = state.cabinetGroups[cabinetGroupId];

  if (!cabinetGroup || cabinetGroup.locked) {
    return state;
  }

  return {
    ...state,
    cabinetGroups: {
      ...state.cabinetGroups,
      [cabinetGroupId]: {
        ...cabinetGroup,
        position: clampCabinetGroupPosition(position),
      },
    },
  };
}

export function updateCabinetGroupCabinetCount(
  state: ProjectState,
  cabinetGroupId: string,
  cabinetCount: number,
): ProjectState {
  const cabinetGroup = state.cabinetGroups[cabinetGroupId];

  if (!cabinetGroup) {
    return state;
  }

  return {
    ...state,
    cabinetGroups: {
      ...state.cabinetGroups,
      [cabinetGroupId]: {
        ...cabinetGroup,
        cabinetCount: clampInteger(cabinetCount, 1, 12),
      },
    },
  };
}

export function setCabinetGroupLocked(
  state: ProjectState,
  cabinetGroupId: string,
  locked: boolean,
): ProjectState {
  const cabinetGroup = state.cabinetGroups[cabinetGroupId];

  if (!cabinetGroup) {
    return state;
  }

  return {
    ...state,
    cabinetGroups: {
      ...state.cabinetGroups,
      [cabinetGroupId]: {
        ...cabinetGroup,
        locked,
      },
    },
  };
}

function clampCabinetGroupPosition(position: CabinetGroupPosition): CabinetGroupPosition {
  const widthPercent = clampNumber(position.widthPercent, 1, 100);
  const heightPercent = clampNumber(position.heightPercent, 1, 100);

  return {
    leftPercent: clampNumber(position.leftPercent, 0, 100 - widthPercent),
    topPercent: clampNumber(position.topPercent, 0, 100 - heightPercent),
    widthPercent,
    heightPercent,
  };
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, roundToTenth(value)));
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}
