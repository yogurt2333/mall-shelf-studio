# Mall Shelf Studio

Mall Shelf Studio is a local desktop tool for mall cabinet-group planograms.

It opens into a fixed mall floor plan, lets the user select a cabinet group, edit each cabinet's structure, fill product slots with image/name/code, and export a front-facing parallel-view PNG for that cabinet group.

## Current Status

This repository is at the product-spec and project-structure stage. The next step is implementation.

## MVP

The MVP focuses on one local user and one fixed mall floor plan:

- Select cabinet groups from the floor plan.
- Edit one cabinet template/structure at a time.
- Edit one product slot at a time.
- Auto-save structured JSON state.
- Export a long PNG for the selected cabinet group.
- Store all paths as relative paths for local portability.

Out of scope for MVP:

- Product library or SKU master data.
- Multi-store or multi-floor-plan management.
- Admin/user roles.
- Batch image import.
- Version history.
- In-app floor plan configuration editing.

## Repository Structure

```text
.
├── assets/
│   └── products/        # Product images copied into the local project
├── data/                # JSON project state and floor plan configuration
├── docs/
│   ├── CONTEXT.md       # Domain language and terminology
│   └── MVP_SPEC.md      # Product and implementation specification
├── exports/             # Exported parallel-view PNG files
└── src/                 # Application source code
```

## Key Documents

- [MVP Spec](./docs/MVP_SPEC.md)
- [Domain Context](./docs/CONTEXT.md)

## Data And Export Rules

- JSON state is auto-saved.
- Exporting PNG is explicit.
- Product images are copied to `assets/products/`.
- Exported PNGs are written to `exports/`.
- JSON stores relative paths only.
- Cabinet group IDs use formats such as `A00` and `A01`.
- Cabinet display labels use formats such as `A00-1` and `A00-2`.

## Development Notes

Open implementation decisions:

- Desktop runtime: Electron, Tauri, or another local runtime.
- PNG rendering method: DOM screenshot, canvas, or headless renderer.
- Final JSON file layout and migration strategy.
- Supported image file types and size limits.

## License

See [LICENSE](./LICENSE).
