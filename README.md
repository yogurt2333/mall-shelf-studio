# Mall Shelf Studio

Mall Shelf Studio is a local desktop planogram tool for mall cabinet groups. It opens directly into a fixed mall floor plan, lets one user edit cabinet structures and product placements, and exports front-facing parallel-view PNGs.

## 项目文档 / Project Documents

- [MVP Spec](./docs/MVP_SPEC.md)
- [Domain Context](./docs/CONTEXT.md)

## 中文用户手册

### 适用场景

Mall Shelf Studio 用于商场货柜陈列规划。你可以在固定平面图上选择货柜组，编辑每个货柜的层数、层高、格子数、铺/挂属性，再给商品位填写图片、名称和编码，最后导出该货柜组的并联图 PNG。

### 启动方式

开发模式：

```bash
npm install
npm run dev
```

桌面模式：

```bash
npm run desktop
```

Windows 打包：

```bash
npm run package:win
```

打包产物会生成在 `release/` 目录。

### 基本流程

1. 打开应用后进入固定商场平面图。
2. 点击平面图上的蓝色货柜组编号，例如 `A00`。
3. 在右侧查看该货柜组的并联预览和状态。
4. 点击 `编辑模板` 设置货柜结构。
5. 点击 `编辑商品位` 给格子填写商品信息。
6. 点击 `保存并联图` 导出当前货柜组 PNG。

### 货柜组状态

- `未编辑`：该货柜组还没有做陈列编辑。
- `编辑中`：结构或商品信息有修改，但还没有导出最新 PNG。
- `已保存`：当前货柜组已成功导出并联图。

如果编辑后离开货柜组或返回主页，系统会提示是否先保存并联图，避免误以为只自动保存 JSON 就已经保存了视觉输出。

### 编辑货柜模板

在选中货柜组后点击 `编辑模板`：

- 用左右箭头切换当前货柜。
- 设置层数。
- 设置每一层的层高、层间距、格子数。
- 每一层可以选择 `铺` 或 `挂`。
- 选择 `挂` 后，该层预览会在上边框下方显示一条灰色横线。
- 层高和层间距总和不能超过 100%。
- 可以给当前结构命名并保存为模板。
- 可以从模板库选择模板并应用到当前货柜。

如果当前货柜已有商品信息，应用模板前会出现确认框。确认后，相同层号和格子号的商品会保留，不再存在的格子会被删除。

### 编辑商品位

在选中货柜组后点击 `编辑商品位`：

- 用左右箭头切换当前货柜。
- 点击左侧预览中的某个格子。
- 上传商品图片。
- 填写商品名称。
- 填写商品编码。
- 点击 `清空当前格子` 可以清除当前格子的图片、名称和编码。

商品图片会复制到 `assets/products/`，JSON 中只保存相对路径。

### 并联图预览和导出

主页右侧默认显示最多两个货柜的并联预览，可以用箭头左右查看。点击 `显示全量并联图` 可以打开当前货柜组的完整并联图弹窗。

点击 `保存并联图` 会导出当前货柜组的 PNG，并把最近导出路径写入 JSON。导出路径使用 `exports/A00_YYYYMMDD_HHMM.png` 这样的相对路径。

### 数据保存

桌面端会自动保存到项目根目录下的：

```text
project-state.json
assets/products/
exports/
```

规则：

- `project-state.json` 保存所有结构化编辑数据。
- `assets/products/` 保存上传的商品图片。
- `exports/` 保存导出的并联图 PNG。
- JSON 中保存的图片和导出路径都是相对路径。
- 浏览器开发模式会使用 localStorage 作为 fallback。

### 校准货柜组

点击顶部 `校准货柜组` 后，可以：

- 拖动平面图上的货柜组蓝框。
- 调整蓝框大小。
- 修改货柜数量。
- 锁定货柜组，避免误拖动。

校准是为固定平面图对齐服务的，通常只需要在初次使用时调整。

## English User Guide

### What It Is For

Mall Shelf Studio is for planning mall cabinet displays. You select a cabinet group on a fixed floor plan, edit each cabinet's layers and product slots, then export a front-facing parallel-view PNG for merchandising review.

### Running The App

Development mode:

```bash
npm install
npm run dev
```

Desktop mode:

```bash
npm run desktop
```

Windows package:

```bash
npm run package:win
```

Packaged output is written to `release/`.

### Basic Workflow

1. Open the app and land on the fixed mall floor plan.
2. Click a blue cabinet group marker, such as `A00`.
3. Review the selected cabinet group's status and parallel preview.
4. Click `Edit Template` to edit cabinet structure.
5. Click `Edit Product Slots` to fill product images, names, and codes.
6. Click `Save Parallel View` to export the selected cabinet group as PNG.

### Cabinet Group Status

- `Unedited`: no merchandising edits yet.
- `In Progress`: structure or product information changed after the latest export.
- `Saved`: the latest parallel-view PNG was exported successfully.

When leaving a cabinet group with unexported edits, the app asks whether to export first, leave without export, or cancel.

### Editing Cabinet Templates

After selecting a cabinet group, click `Edit Template`:

- Use the arrows to switch between cabinets.
- Set the number of layers.
- Set each layer's height, spacing, and slot count.
- Choose `Flat` or `Hanging` for each layer.
- Hanging layers show a gray rail line below the upper border.
- Total layer heights and spacing cannot exceed 100%.
- Save the current structure as a reusable template.
- Apply a saved template to the current cabinet.

If the target cabinet already contains product data, applying a template requires confirmation. Matching `layerIndex + slotIndex` product data is preserved; removed slots are dropped.

### Editing Product Slots

After selecting a cabinet group, click `Edit Product Slots`:

- Use the arrows to switch between cabinets.
- Click a slot in the preview.
- Upload a product image.
- Enter the product name.
- Enter the product code.
- Use `Clear Current Slot` to remove the current slot's image, name, and code.

Uploaded images are copied into `assets/products/`, while JSON stores only relative paths.

### Preview And Export

The main panel shows up to two cabinets at a time. Use arrows to browse. Click `Show Full Parallel View` to open the full cabinet group preview.

Click `Save Parallel View` to export a PNG. Export paths are stored as relative paths such as `exports/A00_YYYYMMDD_HHMM.png`.

### Data Storage

The desktop app auto-saves to the project root:

```text
project-state.json
assets/products/
exports/
```

Rules:

- `project-state.json` stores all structured editing data.
- `assets/products/` stores uploaded product images.
- `exports/` stores exported parallel-view PNGs.
- JSON paths are relative for portability.
- Browser development mode falls back to localStorage.

### Calibrating Cabinet Groups

Click `Calibrate Cabinet Groups` to:

- Drag a cabinet group marker on the floor plan.
- Resize the marker.
- Change cabinet count.
- Lock the cabinet group to prevent accidental movement.

Calibration is meant for aligning the fixed floor plan and is usually needed only during setup.

## Development

Useful commands:

```bash
npm run dev
npm run desktop
npm run package:win
npm run check
```

Test stack:

- Unit tests: Vitest
- End-to-end tests: Playwright
- Desktop runtime: Electron
- Frontend: React, TypeScript, Vite

## License

See [LICENSE](./LICENSE).
