import { expect, test } from "@playwright/test";

test("opens into the Mall Shelf Studio fixed floor plan shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mall Shelf Studio" })).toBeVisible();
  await expect(page.getByText("固定商场平面图")).toBeVisible();
  await expect(page.getByText("选择一个货柜组开始编辑陈列")).toBeVisible();
});
