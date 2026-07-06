export type CabinetGroupStatus = "unedited" | "inProgress" | "saved";

export type CabinetGroupConfig = {
  id: string;
  name: string;
  cabinetCount: number;
  status: CabinetGroupStatus;
  position: {
    leftPercent: number;
    topPercent: number;
    widthPercent: number;
    heightPercent: number;
  };
};

function cabinetGroup(
  id: string,
  name: string,
  cabinetCount: number,
  position: CabinetGroupConfig["position"],
): CabinetGroupConfig {
  return {
    id,
    name,
    cabinetCount,
    status: "unedited",
    position,
  };
}

export const floorPlanConfig = {
  imagePath: "./assets/floorplan.jpg",
  imageAlt: "固定商场平面图",
  cabinetGroups: [
    cabinetGroup("A00", "中岛横向货柜组", 3, {
      leftPercent: 15.9,
      topPercent: 38.3,
      widthPercent: 46.3,
      heightPercent: 2.6,
    }),
    cabinetGroup("A01", "中岛竖向货柜组", 5, {
      leftPercent: 34.3,
      topPercent: 43.8,
      widthPercent: 15.0,
      heightPercent: 21.5,
    }),
    cabinetGroup("A02", "右侧横向货柜组", 2, {
      leftPercent: 69.6,
      topPercent: 68.1,
      widthPercent: 11.4,
      heightPercent: 4.0,
    }),
    cabinetGroup("A03", "左侧横向货柜组", 1, {
      leftPercent: 17.4,
      topPercent: 55.4,
      widthPercent: 10.2,
      heightPercent: 2.1,
    }),
    cabinetGroup("A04", "左侧横向货柜组", 1, {
      leftPercent: 17.2,
      topPercent: 62.6,
      widthPercent: 10.7,
      heightPercent: 2.4,
    }),
    cabinetGroup("A05", "左侧横向货柜组", 1, {
      leftPercent: 17.0,
      topPercent: 78.0,
      widthPercent: 11.2,
      heightPercent: 2.5,
    }),
    cabinetGroup("A06", "中岛竖向货柜组", 1, {
      leftPercent: 35.7,
      topPercent: 65.8,
      widthPercent: 4.0,
      heightPercent: 9.1,
    }),
    cabinetGroup("A07", "中岛竖向货柜组", 1, {
      leftPercent: 44.6,
      topPercent: 65.8,
      widthPercent: 3.7,
      heightPercent: 9.1,
    }),
    cabinetGroup("A08", "中岛竖向货柜组", 1, {
      leftPercent: 53.1,
      topPercent: 65.8,
      widthPercent: 3.7,
      heightPercent: 9.1,
    }),
    cabinetGroup("A09", "中岛竖向货柜组", 1, {
      leftPercent: 61.2,
      topPercent: 65.8,
      widthPercent: 3.7,
      heightPercent: 9.1,
    }),
    cabinetGroup("A10", "中岛竖向货柜组", 1, {
      leftPercent: 35.9,
      topPercent: 78.2,
      widthPercent: 4.1,
      heightPercent: 8.8,
    }),
    cabinetGroup("A11", "中岛竖向货柜组", 1, {
      leftPercent: 44.6,
      topPercent: 78.2,
      widthPercent: 3.8,
      heightPercent: 8.8,
    }),
    cabinetGroup("A12", "中岛竖向货柜组", 1, {
      leftPercent: 53.0,
      topPercent: 78.2,
      widthPercent: 3.8,
      heightPercent: 8.8,
    }),
    cabinetGroup("A13", "中岛竖向货柜组", 1, {
      leftPercent: 61.1,
      topPercent: 78.2,
      widthPercent: 3.8,
      heightPercent: 8.8,
    }),
    cabinetGroup("A14", "右侧横向货柜组", 1, {
      leftPercent: 70.8,
      topPercent: 75.4,
      widthPercent: 11.1,
      heightPercent: 2.7,
    }),
    cabinetGroup("A15", "右侧横向货柜组", 1, {
      leftPercent: 70.8,
      topPercent: 81.3,
      widthPercent: 11.2,
      heightPercent: 2.7,
    }),
    cabinetGroup("A16", "上方短横货柜组", 1, {
      leftPercent: 35.0,
      topPercent: 37.8,
      widthPercent: 12.4,
      heightPercent: 1.4,
    }),
    cabinetGroup("A17", "上方短横货柜组", 1, {
      leftPercent: 53.2,
      topPercent: 37.8,
      widthPercent: 9.4,
      heightPercent: 1.4,
    }),
    cabinetGroup("A18", "左下横向货柜组", 1, {
      leftPercent: 16.9,
      topPercent: 95.0,
      widthPercent: 11.7,
      heightPercent: 2.1,
    }),
    cabinetGroup("A19", "底部设备旁货柜组", 1, {
      leftPercent: 34.7,
      topPercent: 91.2,
      widthPercent: 8.2,
      heightPercent: 2.5,
    }),
    cabinetGroup("A20", "底部横向货柜组", 1, {
      leftPercent: 60.9,
      topPercent: 91.4,
      widthPercent: 8.4,
      heightPercent: 2.5,
    }),
  ] satisfies CabinetGroupConfig[],
};

export function getCabinetGroupStatusLabel(status: CabinetGroupStatus) {
  if (status === "inProgress") {
    return "编辑中";
  }

  if (status === "saved") {
    return "已保存";
  }

  return "未编辑";
}
