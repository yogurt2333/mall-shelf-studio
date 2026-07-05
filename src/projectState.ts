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

export type CabinetStructureValidation = {
  isValid: boolean;
  usedPercent: number;
  bottomBlankPercent: number;
  message: string | null;
};

export type CabinetTemplate = {
  id: string;
  name: string;
  structure: CabinetStructure;
};

const MIN_LAYER_SLOT_COUNT = 1;
const MAX_LAYER_SLOT_COUNT = 12;

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
  cabinetTemplates: CabinetTemplate[];
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
    cabinetTemplates: [],
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

export function saveCabinetTemplate(
  state: ProjectState,
  name: string,
  structure: CabinetStructure,
): ProjectState {
  const templateName = name.trim();

  if (!templateName || !validateCabinetStructure(structure).isValid) {
    return state;
  }

  return {
    ...state,
    cabinetTemplates: [
      ...state.cabinetTemplates,
      {
        id: createCabinetTemplateId(state.cabinetTemplates.length + 1),
        name: templateName,
        structure: normalizeCabinetStructure(structure),
      },
    ],
  };
}

export function applyCabinetTemplate(
  state: ProjectState,
  cabinetGroupId: string,
  cabinetOrder: number,
  templateId: string,
): ProjectState {
  const template = state.cabinetTemplates.find((cabinetTemplate) => cabinetTemplate.id === templateId);

  if (!template) {
    return state;
  }

  return updateCabinetStructure(
    state,
    cabinetGroupId,
    cabinetOrder,
    cloneCabinetStructure(template.structure),
  );
}

export function deleteCabinetTemplate(state: ProjectState, templateId: string): ProjectState {
  return {
    ...state,
    cabinetTemplates: state.cabinetTemplates.filter((template) => template.id !== templateId),
  };
}

function createCabinetTemplateId(order: number) {
  return `template_${order.toString().padStart(3, "0")}`;
}

function cloneCabinetStructure(structure: CabinetStructure): CabinetStructure {
  return {
    bottomBlankPercent: structure.bottomBlankPercent,
    layers: structure.layers.map((layer) => ({ ...layer })),
  };
}

function normalizeCabinetStructure(structure: CabinetStructure): CabinetStructure {
  return {
    bottomBlankPercent: structure.bottomBlankPercent,
    layers: structure.layers.map((layer) => ({
      ...layer,
      slotCount: clampInteger(layer.slotCount, MIN_LAYER_SLOT_COUNT, MAX_LAYER_SLOT_COUNT),
    })),
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
  return normalizeCabinetStructure(structure).layers.flatMap((layer, layerIndex) =>
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

export function updateCabinetStructure(
  state: ProjectState,
  cabinetGroupId: string,
  cabinetOrder: number,
  structure: CabinetStructure,
): ProjectState {
  const cabinetGroup = state.cabinetGroups[cabinetGroupId];

  if (!cabinetGroup) {
    return state;
  }

  const normalizedStructure = normalizeCabinetStructure(structure);

  return {
    ...state,
    cabinetGroups: {
      ...state.cabinetGroups,
      [cabinetGroupId]: {
        ...cabinetGroup,
        status: "inProgress",
        cabinets: cabinetGroup.cabinets.map((cabinet) =>
          cabinet.order === cabinetOrder
            ? {
                ...cabinet,
                structure: normalizedStructure,
                slots: createProductSlots(normalizedStructure),
              }
            : cabinet,
        ),
      },
    },
  };
}

export function validateCabinetStructure(
  structure: CabinetStructure,
): CabinetStructureValidation {
  const usedPercent = structure.layers.reduce(
    (total, layer) => total + layer.heightPercent + layer.gapAfterPercent,
    0,
  );
  const bottomBlankPercent = Math.max(0, 100 - usedPercent);

  if (usedPercent > 100) {
    return {
      isValid: false,
      usedPercent,
      bottomBlankPercent,
      message: "层高和层间距总和不能超过 100%",
    };
  }

  return {
    isValid: true,
    usedPercent,
    bottomBlankPercent,
    message: null,
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
