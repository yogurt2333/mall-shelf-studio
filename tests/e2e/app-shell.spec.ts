import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

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
  await expect(page.locator(".floor-plan-canvas")).toHaveCSS("width", "910px");
  await expect(page.locator(".floor-plan-canvas")).toHaveCSS("height", "1254px");
  await expect(page.getByRole("button", { name: /^选择货柜组 A/ })).toHaveCount(21);

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();

  await expect(page.getByText("状态")).toBeVisible();
  await expect(page.getByText("未编辑")).toBeVisible();
  await expect(page.getByText("货柜数量")).toBeVisible();
  await expect(page.locator(".cabinet-group-details dd").filter({ hasText: /^3$/ })).toBeVisible();
});

test("auto-saves and restores the selected cabinet group", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();
  await expect(page.getByText("自动保存：已保存")).toBeVisible();

  await page.reload();

  await expect(page.getByRole("heading", { name: "A00 中岛横向货柜组" })).toBeVisible();
  await expect(page.getByRole("button", { name: "选择货柜组 A00" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("calibrates selected cabinet group cabinet count", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();
  await page.getByLabel("货柜数").fill("4");

  await expect(page.getByText("货柜数量")).toBeVisible();
  await expect(page.locator(".cabinet-group-details dd").filter({ hasText: /^4$/ })).toBeVisible();
});

test("drags a non-first cabinet group marker", async ({ page }) => {
  await page.goto("/");

  const marker = page.getByRole("button", { name: "选择货柜组 A01" });
  await marker.scrollIntoViewIfNeeded();
  const before = await marker.boundingBox();
  expect(before).not.toBeNull();
  const hitLabel = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label"),
    { x: before!.x + before!.width / 2, y: before!.y + before!.height / 2 },
  );
  expect(hitLabel).toBe("选择货柜组 A01");

  await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
  await page.mouse.down();
  await page.mouse.move(before!.x + before!.width / 2 + 30, before!.y + before!.height / 2 + 30, {
    steps: 10,
  });
  await page.mouse.up();

  const after = await marker.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.x).toBeGreaterThan(before!.x + 5);
  expect(after!.y).toBeGreaterThan(before!.y + 5);
});
