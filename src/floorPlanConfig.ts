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

export const floorPlanConfig = {
  imagePath: "/assets/floorplan.jpg",
  imageAlt: "固定商场平面图",
  cabinetGroups: [
    {
      id: "A00",
      name: "中岛横向货柜组",
      cabinetCount: 3,
      status: "unedited",
      position: {
        leftPercent: 15.9,
        topPercent: 38.3,
        widthPercent: 46.3,
        heightPercent: 2.6,
      },
    },
    {
      id: "B00",
      name: "中岛竖向货柜组",
      cabinetCount: 5,
      status: "unedited",
      position: {
        leftPercent: 34.3,
        topPercent: 43.8,
        widthPercent: 15.0,
        heightPercent: 21.5,
      },
    },
    {
      id: "C00",
      name: "右侧横向货柜组",
      cabinetCount: 2,
      status: "unedited",
      position: {
        leftPercent: 69.6,
        topPercent: 68.1,
        widthPercent: 11.4,
        heightPercent: 4.0,
      },
    },
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
