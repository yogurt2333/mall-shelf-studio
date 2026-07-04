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
  cabinets: Cabinet[];
  locked: boolean;
  position: CabinetGroupPosition;
  lastExportPath: string | null;
};

export type Cabinet = {
  order: number;
  structure: CabinetStructure;
  slots: ProductSlot[];
};

export type CabinetStructure = {
  layers: CabinetLayer[];
  bottomBlankPercent: number;
};

export type CabinetLayer = {
  heightPercent: number;
  gapAfterPercent: number;
  slotCount: number;
};

export type ProductSlot = {
  layerIndex: number;
  slotIndex: number;
  imagePath: string | null;
  name: string;
  code: string;
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
          cabinets: createCabinets(group.cabinetCount),
          locked: false,
          position: group.position,
          lastExportPath: null,
        },
      ]),
    ),
  };
}

export function createCabinets(cabinetCount: number): Cabinet[] {
  return Array.from({ length: clampInteger(cabinetCount, 1, 12) }, (_, index) => ({
    order: index + 1,
    structure: createDefaultCabinetStructure(),
    slots: createProductSlots(createDefaultCabinetStructure()),
  }));
}

function createDefaultCabinetStructure(): CabinetStructure {
  return {
    layers: [
      {
        heightPercent: 28,
        gapAfterPercent: 2,
        slotCount: 3,
      },
      {
        heightPercent: 28,
        gapAfterPercent: 2,
        slotCount: 3,
      },
      {
        heightPercent: 30,
        gapAfterPercent: 0,
        slotCount: 2,
      },
    ],
    bottomBlankPercent: 10,
  };
}

function createProductSlots(structure: CabinetStructure): ProductSlot[] {
  return structure.layers.flatMap((layer, layerIndex) =>
    Array.from({ length: layer.slotCount }, (_, slotIndex) => ({
      layerIndex,
      slotIndex,
      imagePath: null,
      name: "",
      code: "",
    })),
  );
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
        cabinets: createCabinets(cabinetCount),
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
