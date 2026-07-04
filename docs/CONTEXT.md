# Mall Planogram

This context describes the domain language for a mall display planning tool that maps store floor fixtures to shelf-level product placements.

## Language

**Cabinet Group**:
A fixed area on the mall floor plan that contains one or more adjacent cabinets. Cabinet groups use identifiers such as A00 or A01.
_Avoid_: Shelf group, red box

**Cabinet Group Status**:
The lightweight workflow state shown on the floor plan for each cabinet group. In the MVP, a cabinet group may be unedited, in progress, or saved, so the user can see which areas still need merchandising work.
_Avoid_: Approval state, audit status

**Floor Plan Configuration**:
The built-in project configuration that defines the floor plan image, cabinet group identifiers, cabinet group positions, and cabinet counts. In the MVP, this configuration is not edited through the UI.
_Avoid_: Admin settings, user-drawn floor plan

**Fixed Mall Floor Plan**:
The single floor plan that the MVP opens directly into. The MVP does not include project selection, store selection, or multi-floor-plan management.
_Avoid_: Project list, store switcher

**Cabinet**:
A single physical display cabinet inside a cabinet group. Cabinets in a group share the same overall width and height, but may differ in layer structure. Individual cabinets do not have global IDs like A00; they are referenced by their order within the cabinet group, such as cabinet 1, cabinet 2, cabinet 3. In previews and exports, cabinets may be labeled with a small display label combining group ID and order, such as A00-1 or A00-2.
_Avoid_: Shelf, fixture

**Cabinet Template**:
A reusable single-cabinet structure made of layers, layer spacing, and product slot counts. A cabinet template may be applied across cabinet groups; after application, each cabinet has its own independent structure. Editing a template creates a new template and does not affect cabinets or parallel views that were already completed. Deleting a cabinet template only removes it from the template library and never changes already-applied cabinet structures.
_Avoid_: Shelf template, layout preset

**Template Application**:
The act of copying a cabinet template onto a cabinet instance. If the cabinet already contains product information, the user must confirm before applying the template. Product information is preserved only when the layer sequence and slot sequence still match; product slots that no longer exist are deleted.
_Avoid_: Live template link, cascading template update

**Layer**:
A horizontal section inside a cabinet. A layer has a height ratio and may have spacing above or below adjacent layers.
_Avoid_: Row

**Product Slot**:
The smallest editable unit in the MVP. A product slot belongs to one layer and contains exactly one product image, one product name, and one product code.
_Avoid_: Grid cell, product grid, slot cell

**Product Information**:
The image, name, and code entered directly into a product slot. In the MVP, product information is not shared through a product library; users enter it manually for each product slot.
_Avoid_: Product master, SKU library, product catalog

**Product Image Asset**:
An uploaded product image copied into the project's asset directory and referenced from JSON by relative path.
_Avoid_: Base64 image, embedded image data

**Parallel View**:
The front-facing combined view of cabinets in a cabinet group, shown side by side for merchandising review.
_Avoid_: Shelf preview, combined shelf image

**Saved Parallel View**:
A persisted merchandising output for the currently selected cabinet group. In the MVP, saving a parallel view produces structured JSON for later editing and a PNG image for visual reference. Saving is scoped to one cabinet group, not the whole mall floor plan. The JSON stores the relative path to the most recently exported PNG for that cabinet group.
_Avoid_: Screenshot only, export only

**Project State File**:
The single structured JSON file that stores the current editable planogram state. In the MVP, edits are automatically saved to this file and overwrite the current state; there is no built-in version history, rollback, or diff view.
_Avoid_: Versioned document, revision history
