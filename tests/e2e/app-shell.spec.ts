import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("opens into the Mall Shelf Studio fixed floor plan shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mall Shelf Studio" })).toBeVisible();
  await expect(page.getByText("固定商场平面图")).toBeVisible();
  await expect(page.getByRole("button", { name: "校准货柜组" })).toBeVisible();
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

test("shows a two-cabinet parallel preview for the selected cabinet group", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();

  await expect(page.getByRole("heading", { name: "并联预览" })).toBeVisible();
  await expect(page.getByText("A00-1")).toBeVisible();
  await expect(page.getByText("A00-2")).toBeVisible();
  await expect(page.getByText("A00-3")).toBeHidden();
  await expect(page.getByRole("button", { name: "上一组货柜" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "下一组货柜" })).toBeEnabled();
});

test("browses the selected cabinet group preview two cabinets at a time", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();
  await page.getByRole("button", { name: "下一组货柜" }).click();

  await expect(page.getByText("A00-1")).toBeHidden();
  await expect(page.getByText("A00-2")).toBeVisible();
  await expect(page.getByText("A00-3")).toBeVisible();
  await expect(page.getByRole("button", { name: "下一组货柜" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "上一组货柜" })).toBeEnabled();
});

test("opens single-cabinet template editing and validates layer budget", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();
  await page.getByRole("button", { name: "编辑模板" }).click();

  await expect(page.getByRole("heading", { name: "编辑货柜模板" })).toBeVisible();
  await expect(page.locator(".template-editor-header strong")).toHaveText("A00-1");

  await page.getByRole("button", { name: "下一货柜" }).click();
  await expect(page.locator(".template-editor-header strong")).toHaveText("A00-2");

  await page.getByLabel("第 1 层层高").fill("80");
  await page.getByLabel("第 2 层层高").fill("30");

  await expect(page.getByText("层高和层间距总和不能超过 100%")).toBeVisible();
  await expect(page.getByRole("button", { name: "保存此模板" })).toBeDisabled();
});

test("template editing changes only the current cabinet", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();
  await page.getByRole("button", { name: "编辑模板" }).click();
  await page.getByRole("button", { name: "下一货柜" }).click();
  await page.getByLabel("第 1 层层高").fill("35");
  await expect(page.getByLabel("第 1 层层高")).toHaveValue("35");

  await page.getByRole("button", { name: "上一货柜" }).click();

  await expect(page.locator(".template-editor-header strong")).toHaveText("A00-1");
  await expect(page.getByLabel("第 1 层层高")).toHaveValue("28");
});

test("template editor bounds slot count edits so the page stays usable", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();
  await page.getByRole("button", { name: "编辑模板" }).click();
  await page.getByLabel("第 1 层格子").fill("999");

  await expect(page.getByRole("heading", { name: "编辑货柜模板" })).toBeVisible();
  await expect(page.getByLabel("第 1 层格子")).toHaveValue("12");
});

test("saves and applies a single-cabinet template from the template library", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();
  await page.getByRole("button", { name: "编辑模板" }).click();
  await page.getByLabel("第 1 层层高").fill("35");
  await page.getByLabel("模板名称").fill("高层双格模板");
  await page.getByRole("button", { name: "保存此模板" }).click();

  await expect(page.getByRole("button", { name: "高层双格模板", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "下一货柜" }).click();
  await expect(page.getByLabel("第 1 层层高")).toHaveValue("28");
  await page.getByRole("button", { name: "应用模板" }).click();

  await expect(page.getByLabel("第 1 层层高")).toHaveValue("35");
});

test("deletes a template without changing an already applied cabinet", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "选择货柜组 A00" }).click();
  await page.getByRole("button", { name: "编辑模板" }).click();
  await page.getByLabel("第 1 层层高").fill("35");
  await page.getByLabel("模板名称").fill("高层双格模板");
  await page.getByRole("button", { name: "保存此模板" }).click();
  await page.getByRole("button", { name: "下一货柜" }).click();
  await page.getByRole("button", { name: "应用模板" }).click();
  await expect(page.getByLabel("第 1 层层高")).toHaveValue("35");

  await page.getByRole("button", { name: "删除模板 高层双格模板" }).click();

  await expect(page.getByText("高层双格模板")).toBeHidden();
  await expect(page.getByLabel("第 1 层层高")).toHaveValue("35");
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
  await expect(page.getByRole("heading", { name: "A00 中岛横向货柜组" })).toBeVisible();
  await expect(page.getByText("货柜组位置校准")).toBeHidden();
  await page.getByRole("button", { name: "校准货柜组" }).click();
  const cabinetCountInput = page.getByLabel("货柜数");
  await cabinetCountInput.fill("4");

  await expect(cabinetCountInput).toHaveValue("4");
});

test("drags a non-first cabinet group marker", async ({ page }) => {
  await page.goto("/");

  const marker = page.getByRole("button", { name: "选择货柜组 A01" });
  await page.getByRole("button", { name: "校准货柜组" }).click();
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
