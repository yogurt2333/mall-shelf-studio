# Mall Planogram MVP Spec

## Goal

Build a local desktop tool for creating mall cabinet-group planograms from a fixed mall floor plan.

The user opens the app directly into one fixed mall floor plan, selects a cabinet group, edits each cabinet's structure, fills product slots with image/name/code, and exports a front-facing parallel-view PNG for that cabinet group.

## MVP Scope

In scope:

- Fixed mall floor plan.
- Built-in floor plan configuration.
- Cabinet group selection on the floor plan.
- Cabinet group status: unedited, in progress, saved/exported.
- Single-cabinet template library.
- One-cabinet-at-a-time template editing.
- One-cabinet-at-a-time product-slot editing.
- Product slot fields: image, name, code.
- Automatic JSON state saving.
- Export current cabinet group's parallel view to PNG.

Out of scope:

- Multi-store, multi-floor, or project selection.
- User/admin roles.
- Product library or SKU master data.
- Batch product import.
- Batch slot editing.
- Automatic cleanup of unused image files.
- Version history, rollback, or diff view.
- Editing floor plan image, cabinet group positions, or cabinet counts through UI.

## Core Terms

Use the terms from [CONTEXT.md](./CONTEXT.md).

Important distinctions:

- `A00`, `A01` are cabinet group IDs.
- Individual cabinets do not have global IDs.
- A cabinet inside `A00` is displayed as `A00-1`, `A00-2`, etc.
- A product slot is the minimum editable unit.

## Data Model

The app keeps one structured JSON project state file, for example:

```json
{
  "floorPlan": {
    "imagePath": "assets/floorplan.png",
    "cabinetGroups": [
      {
        "id": "A00",
        "name": "中岛横向货柜组",
        "position": { "x": 120, "y": 300, "width": 180, "height": 40 },
        "cabinetCount": 4
      }
    ]
  },
  "cabinetGroups": {
    "A00": {
      "status": "inProgress",
      "lastExportPath": "exports/A00_20260704_1530.png",
      "cabinets": [
        {
          "order": 1,
          "structure": {
            "layers": [
              {
                "heightPercent": 24,
                "gapAfterPercent": 2,
                "slotCount": 3
              }
            ],
            "bottomBlankPercent": 10
          },
          "slots": [
            {
              "layerIndex": 0,
              "slotIndex": 0,
              "imagePath": "assets/products/product_20260704_153012_001.png",
              "name": "女款休闲包",
              "code": "MEFBCOA52"
            }
          ]
        }
      ]
    }
  },
  "cabinetTemplates": [
    {
      "id": "template_001",
      "name": "三层三格基础柜",
      "structure": {
        "layers": [
          { "heightPercent": 28, "gapAfterPercent": 2, "slotCount": 3 }
        ],
        "bottomBlankPercent": 0
      }
    }
  ]
}
```

All file paths stored in JSON must be relative paths.

## Main Page

The app opens directly into the fixed mall floor plan.

Left side:

- Show the floor plan image.
- Overlay clickable cabinet group regions.
- Cabinet group ID labels are hidden by default and shown only on hover/selection.
- A note explains that blue labels are cabinet group IDs and are hints only.
- Cabinet group status is always lightly visible without blocking the drawing.

Right side:

- When no group is selected, show a neutral empty state.
- When a group is selected, show its cabinet group name and status.
- Show a parallel preview with at most two cabinets visible.
- Use left/right arrows to browse through cabinets in the selected group.
- Show buttons:
  - Edit template
  - Edit product slots
  - View full parallel preview
  - Export PNG

Clicking a cabinet group only selects it. It does not immediately enter editing.

## Template Editing

Template editing works one cabinet at a time.

Layout:

- Left: current cabinet structure preview, occupying roughly one third of the page.
- Right: structure editor and template library controls.
- Use arrows to switch between `A00-1`, `A00-2`, etc.

Workflow:

1. Choose layer count.
2. Edit each layer's height percentage and spacing.
3. Edit each layer's slot count.
4. Optionally save this single-cabinet structure as a named cabinet template.
5. Optionally apply an existing single-cabinet template to the current cabinet.

Validation:

- Layer height and spacing are integer percentages.
- `sum(layer heights + layer spacings) <= 100`.
- If the sum is less than 100, remaining space is bottom blank area.
- If the sum exceeds 100, show a real-time error.
- Allow continued editing while invalid.
- Disable saving/applying/exporting invalid structures.

Template rules:

- Templates are single-cabinet templates.
- Editing a template creates a new template.
- Editing or deleting a template does not affect cabinets already using copied structures.
- Deleting a template only removes it from the template library.
- Applying a template to a cabinet copies the structure into that cabinet.
- If the cabinet already contains product information, show a strong confirmation.
- Preserve product information only when `layerIndex + slotIndex` still exists.
- Delete product data for slots that no longer exist.

## Product Slot Editing

Product editing works one cabinet and one slot at a time.

Layout:

- Left third: current cabinet preview.
- Right two thirds: selected product slot editor.
- Use arrows to switch between cabinets in the selected cabinet group.

Interaction:

- User clicks one product slot in the cabinet preview.
- Selected slot has a clear light-blue background and blue border.
- Right editor shows:
  - cabinet group ID
  - cabinet display label such as `A00-1`
  - layer index
  - slot index
  - product image upload
  - product name input
  - product code input
  - clear current slot button

Product slot rules:

- One slot contains at most one product image, one product name, and one product code.
- Image, name, and code may all be empty.
- Name and code have no input length limit.
- Clear current slot clears image/name/code from the selected slot.
- Clearing or replacing an image does not delete old image files.
- Upload supports one image for the current slot only.
- Uploaded images are copied into the project assets directory.
- Uploaded images are renamed to unique filenames.
- JSON stores relative image paths.

## Product Rendering

In preview and PNG:

- Product image keeps aspect ratio.
- Product image is centered.
- Product image is fully visible.
- No cropping.
- No manual image scaling/positioning in MVP.
- Product name is black.
- Product code is blue.
- Empty product slots render as blank slots.
- Empty product slots do not show placeholder text.
- Text auto-shrinks to fit.
- Minimum font size is 8px.
- If text still does not fit at 8px, allow wrapping.
- Text must not overflow, crop, or show ellipsis.

## Parallel View And Export

The parallel view is the front-facing combined view of all cabinets in the selected cabinet group.

Preview:

- Main page preview shows at most two cabinets.
- Full preview opens in a separate modal.
- Full preview can horizontally scroll if the group is wide.
- Cabinet aspect ratio follows the reference single-cabinet image ratio.
- Each cabinet keeps consistent width and height.
- Each layer and product slot respects the cabinet's structure.

Export:

- Export only the currently selected cabinet group.
- Export as one long PNG.
- The PNG width grows with cabinet count.
- PNG includes cabinet group title, for example `A00 中岛横向货柜组`.
- Each cabinet shows a small label such as `A00-1`, `A00-2`.
- Filename format: `柜组编号_日期时间.png`, for example `A00_20260704_1530.png`.
- After export, JSON stores the most recent PNG relative path for that cabinet group.
- If empty product slots remain, show a non-blocking message such as `已导出，仍有 12 个空商品位`.

## Saving

JSON state:

- Edits auto-save to the project JSON file.
- Auto-save overwrites the current project state.
- There is no JSON version history.
- If auto-save fails, show a prominent top error bar.
- Disable PNG export until auto-save succeeds again.

PNG export:

- PNG export is an explicit user action.
- PNG export does not replace JSON auto-save.
- If the user leaves a page after edits that have not yet been exported to PNG, show an alert-style confirmation.

Suggested confirmation:

- Export and leave
- Leave without export
- Cancel

## Status Rules

Cabinet group status:

- `unedited`: no structure/product changes yet.
- `inProgress`: structure or product data exists but no successful PNG export for the latest meaningful state.
- `saved`: successful JSON auto-save and successful PNG export for the cabinet group.

Empty product slots do not prevent `saved` status.

## Floor Plan Configuration

Floor plan configuration is built in and not edited through the UI in MVP.

It includes:

- floor plan image path
- cabinet group IDs
- cabinet group display names
- cabinet group clickable positions
- cabinet count for each cabinet group

Users do not add or delete cabinet groups or cabinets in MVP.

## Open Questions For Implementation

- Exact desktop framework: Electron, Tauri, or another local runtime.
- Exact JSON file location and project folder structure.
- Exact PNG rendering implementation: DOM screenshot, canvas, or headless renderer.
- Image file type constraints and maximum file size.
- Whether to keep generated PNGs in `exports/` and product images in `assets/products/`.
