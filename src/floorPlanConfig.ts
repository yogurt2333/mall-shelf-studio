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
        topPercent: 39.1,
        widthPercent: 30.9,
        heightPercent: 4.8,
      },
    },
    {
      id: "B00",
      name: "中岛竖向货柜组",
      cabinetCount: 5,
      status: "unedited",
      position: {
        leftPercent: 34.2,
        topPercent: 44.2,
        widthPercent: 7.5,
        heightPercent: 22.3,
      },
    },
    {
      id: "C00",
      name: "右侧横向货柜组",
      cabinetCount: 2,
      status: "unedited",
      position: {
        leftPercent: 69.4,
        topPercent: 68.5,
        widthPercent: 18.2,
        heightPercent: 4.9,
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
