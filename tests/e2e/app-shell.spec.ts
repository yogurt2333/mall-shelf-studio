import { expect, test } from "@playwright/test";

test("opens into the Mall Shelf Studio fixed floor plan shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mall Shelf Studio" })).toBeVisible();
  await expect(page.getByText("固定商场平面图")).toBeVisible();
  await expect(page.getByText("选择一个货柜组开始编辑陈列")).toBeVisible();
});

test("focuses and selects a cabinet group from the fixed floor plan", async ({ page }) => {
  await page.goto("/");

  const group = page.getByRole("button", { name: "选择货柜组 A00" });
  await group.focus();
  await expect(group).toBeFocused();

  await group.click();

  await expect(page.getByRole("heading", { name: "A00 中岛横向货柜组" })).toBeVisible();
  await expect(page.getByText("已选中货柜组")).toBeVisible();
});

test("shows the fixed mall floor plan image and selected cabinet group details", async ({ page }) => {
  await page.goto("/");

  const floorPlan = page.getByRole("img", { name: "固定商场平面图" });
  await expect(floorPlan).toBeVisible();
  await expect(floorPlan).toHaveJSProperty("naturalWidth", 910);

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();

  await expect(page.getByText("状态")).toBeVisible();
  await expect(page.getByText("未编辑")).toBeVisible();
  await expect(page.getByText("货柜数量")).toBeVisible();
  await expect(page.getByText("3")).toBeVisible();
});
