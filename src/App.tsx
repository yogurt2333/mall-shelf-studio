import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { floorPlanConfig, getCabinetGroupStatusLabel } from "./floorPlanConfig";
import {
  applyCabinetTemplate,
  clearProductSlot,
  deleteCabinetTemplate,
  saveCabinetTemplate,
  selectCabinetGroup,
  setCabinetGroupLocked,
  updateProductSlot,
  updateCabinetStructure,
  updateCabinetGroupCabinetCount,
  updateCabinetGroupPosition,
  validateCabinetStructure,
  type CabinetStructure,
  type CabinetGroupPosition,
  type ProductSlot,
} from "./projectState";
import { useBrowserProjectState } from "./useBrowserProjectState";

type DragMode = "move" | "resize";

type DragState = {
  groupId: string;
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  startPosition: CabinetGroupPosition;
};

type ProductSlotSelection = Pick<ProductSlot, "layerIndex" | "slotIndex">;

function normalizeCabinetCount(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(12, Math.max(1, Math.round(value)));
}

function ProductSlotContents({ slot }: { slot?: ProductSlot }) {
  if (!slot || (!slot.imagePath && !slot.name && !slot.code)) {
    return null;
  }

  return (
    <div className="product-slot-content">
      {slot.imagePath ? (
        <img
          alt={slot.name || slot.code || "商品图片"}
          className="product-slot-image"
          src={slot.imagePath}
        />
      ) : null}
      {slot.name ? <span className="product-name">{slot.name}</span> : null}
      {slot.code ? <span className="product-code">{slot.code}</span> : null}
    </div>
  );
}

export function App() {
  const { projectState, saveStatus, setProjectState } = useBrowserProjectState();
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);
  const [activeView, setActiveView] = useState<"main" | "templateEditor" | "productEditor">("main");
  const [editingCabinetIndex, setEditingCabinetIndex] = useState(0);
  const [selectedProductSlot, setSelectedProductSlot] = useState<ProductSlotSelection>({
    layerIndex: 0,
    slotIndex: 0,
  });
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [cabinetCountDrafts, setCabinetCountDrafts] = useState<Record<string, string>>({});
  const dragState = useRef<DragState | null>(null);
  const floorPlanCanvasRef = useRef<HTMLDivElement | null>(null);
  const selectedGroup = floorPlanConfig.cabinetGroups.find(
    (group) => group.id === projectState.selectedCabinetGroupId,
  );
  const selectedGroupState = selectedGroup ? projectState.cabinetGroups[selectedGroup.id] : null;
  const previewCabinets = selectedGroupState?.cabinets.slice(
    previewStartIndex,
    previewStartIndex + 2,
  );
  const editingCabinet = selectedGroupState?.cabinets[editingCabinetIndex];
  const selectedProductSlotState = editingCabinet?.slots.find(
    (slot) =>
      slot.layerIndex === selectedProductSlot.layerIndex &&
      slot.slotIndex === selectedProductSlot.slotIndex,
  );
  const editingValidation = editingCabinet
    ? validateCabinetStructure(editingCabinet.structure)
    : null;

  useEffect(() => {
    setPreviewStartIndex(0);
    setEditingCabinetIndex(0);
    setSelectedProductSlot({ layerIndex: 0, slotIndex: 0 });
    setIsFullPreviewOpen(false);
    setActiveView("main");
  }, [projectState.selectedCabinetGroupId]);

  useEffect(() => {
    if (!selectedGroupState) {
      return;
    }

    setCabinetCountDrafts((drafts) => ({
      ...drafts,
      [selectedGroupState.id]: String(selectedGroupState.cabinetCount),
    }));
  }, [selectedGroupState?.id, selectedGroupState?.cabinetCount]);

  useEffect(() => {
    function moveActiveDrag(event: globalThis.PointerEvent) {
      updateActiveDrag(event.clientX, event.clientY);
    }

    function moveActiveMouseDrag(event: globalThis.MouseEvent) {
      updateActiveDrag(event.clientX, event.clientY);
    }

    function stopActiveDrag() {
      dragState.current = null;
    }

    window.addEventListener("pointermove", moveActiveDrag);
    window.addEventListener("pointerup", stopActiveDrag);
    window.addEventListener("pointercancel", stopActiveDrag);
    window.addEventListener("mousemove", moveActiveMouseDrag);
    window.addEventListener("mouseup", stopActiveDrag);

    return () => {
      window.removeEventListener("pointermove", moveActiveDrag);
      window.removeEventListener("pointerup", stopActiveDrag);
      window.removeEventListener("pointercancel", stopActiveDrag);
      window.removeEventListener("mousemove", moveActiveMouseDrag);
      window.removeEventListener("mouseup", stopActiveDrag);
    };
  }, [setProjectState]);

  function startDrag(
    event: PointerEvent<HTMLButtonElement | HTMLSpanElement>,
    groupId: string,
    mode: DragMode,
  ) {
    if (startDragAt(event.clientX, event.clientY, groupId, mode)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function startMouseDrag(
    event: MouseEvent<HTMLButtonElement | HTMLSpanElement>,
    groupId: string,
    mode: DragMode,
  ) {
    if (startDragAt(event.clientX, event.clientY, groupId, mode)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function startDragAt(clientX: number, clientY: number, groupId: string, mode: DragMode) {
    if (!isCalibrationMode) {
      return false;
    }

    const cabinetGroup = projectState.cabinetGroups[groupId];

    if (!cabinetGroup || cabinetGroup.locked) {
      return false;
    }

    dragState.current = {
      groupId,
      mode,
      startClientX: clientX,
      startClientY: clientY,
      startPosition: cabinetGroup.position,
    };

    return true;
  }

  function updateActiveDrag(clientX: number, clientY: number) {
    const activeDrag = dragState.current;

    if (!activeDrag) {
      return;
    }

    const frameRect = floorPlanCanvasRef.current?.getBoundingClientRect();

    if (!frameRect) {
      return;
    }

    const deltaXPercent = ((clientX - activeDrag.startClientX) / frameRect.width) * 100;
    const deltaYPercent = ((clientY - activeDrag.startClientY) / frameRect.height) * 100;
    const nextPosition =
      activeDrag.mode === "move"
        ? {
            ...activeDrag.startPosition,
            leftPercent: activeDrag.startPosition.leftPercent + deltaXPercent,
            topPercent: activeDrag.startPosition.topPercent + deltaYPercent,
          }
        : {
            ...activeDrag.startPosition,
            widthPercent: activeDrag.startPosition.widthPercent + deltaXPercent,
            heightPercent: activeDrag.startPosition.heightPercent + deltaYPercent,
          };

    setProjectState((state) =>
      updateCabinetGroupPosition(state, activeDrag.groupId, nextPosition),
    );
  }

  function updateSelectedPosition(field: keyof CabinetGroupPosition, value: number) {
    if (!selectedGroupState) {
      return;
    }

    setProjectState((state) =>
      updateCabinetGroupPosition(state, selectedGroupState.id, {
        ...selectedGroupState.position,
        [field]: value,
      }),
    );
  }

  function updateSelectedCabinetCountDraft(value: string) {
    if (!selectedGroupState) {
      return;
    }

    setCabinetCountDrafts((drafts) => ({
      ...drafts,
      [selectedGroupState.id]: value,
    }));

    if (!value.trim()) {
      return;
    }

    const cabinetCount = normalizeCabinetCount(Number(value));

    setProjectState((state) =>
      updateCabinetGroupCabinetCount(state, selectedGroupState.id, cabinetCount),
    );
    setPreviewStartIndex((index) => Math.min(index, Math.max(0, cabinetCount - 2)));
    setEditingCabinetIndex((index) => Math.min(index, cabinetCount - 1));
  }

  function commitSelectedCabinetCountDraft() {
    if (!selectedGroupState) {
      return;
    }

    const draft = cabinetCountDrafts[selectedGroupState.id] ?? String(selectedGroupState.cabinetCount);
    const cabinetCount = normalizeCabinetCount(Number(draft));

    setCabinetCountDrafts((drafts) => ({
      ...drafts,
      [selectedGroupState.id]: String(cabinetCount),
    }));
    setProjectState((state) =>
      updateCabinetGroupCabinetCount(state, selectedGroupState.id, cabinetCount),
    );
    setPreviewStartIndex((index) => Math.min(index, Math.max(0, cabinetCount - 2)));
    setEditingCabinetIndex((index) => Math.min(index, cabinetCount - 1));
  }

  function showPreviousPreviewCabinets() {
    setPreviewStartIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function showNextPreviewCabinets() {
    if (!selectedGroupState) {
      return;
    }

    setPreviewStartIndex((currentIndex) =>
      Math.min(Math.max(0, selectedGroupState.cabinets.length - 2), currentIndex + 1),
    );
  }

  function updateEditingCabinetStructure(structure: CabinetStructure) {
    if (!selectedGroupState || !editingCabinet) {
      return;
    }

    setProjectState((state) =>
      updateCabinetStructure(state, selectedGroupState.id, editingCabinet.order, structure),
    );
  }

  function updateEditingLayer(
    layerIndex: number,
    field: "heightPercent" | "gapAfterPercent" | "slotCount",
    value: number,
  ) {
    if (!editingCabinet) {
      return;
    }

    updateEditingCabinetStructure({
      ...editingCabinet.structure,
      layers: editingCabinet.structure.layers.map((layer, index) =>
        index === layerIndex
          ? {
              ...layer,
              [field]: value,
            }
          : layer,
      ),
    });
  }

  function showPreviousEditingCabinet() {
    setEditingCabinetIndex((index) => Math.max(0, index - 1));
    setSelectedProductSlot({ layerIndex: 0, slotIndex: 0 });
  }

  function showNextEditingCabinet() {
    if (!selectedGroupState) {
      return;
    }

    setEditingCabinetIndex((index) => Math.min(selectedGroupState.cabinets.length - 1, index + 1));
    setSelectedProductSlot({ layerIndex: 0, slotIndex: 0 });
  }

  function updateSelectedProductSlot(field: "imagePath" | "name" | "code", value: string) {
    if (!selectedGroupState || !editingCabinet || !selectedProductSlotState) {
      return;
    }

    setProjectState((state) =>
      updateProductSlot(
        state,
        selectedGroupState.id,
        editingCabinet.order,
        selectedProductSlotState.layerIndex,
        selectedProductSlotState.slotIndex,
        {
          [field]: field === "imagePath" && !value.trim() ? null : value,
        },
      ),
    );
  }

  function clearSelectedProductSlot() {
    if (!selectedGroupState || !editingCabinet || !selectedProductSlotState) {
      return;
    }

    setProjectState((state) =>
      clearProductSlot(
        state,
        selectedGroupState.id,
        editingCabinet.order,
        selectedProductSlotState.layerIndex,
        selectedProductSlotState.slotIndex,
      ),
    );
  }

  function updateEditingLayerCount(layerCount: number) {
    if (!editingCabinet) {
      return;
    }

    const nextLayerCount = Math.min(8, Math.max(1, Math.round(layerCount)));
    const layers = [...editingCabinet.structure.layers];

    while (layers.length < nextLayerCount) {
      layers.push({ heightPercent: 20, gapAfterPercent: 0, slotCount: 3 });
    }

    updateEditingCabinetStructure({
      ...editingCabinet.structure,
      layers: layers.slice(0, nextLayerCount),
    });
  }

  function saveCurrentCabinetTemplate() {
    if (!editingCabinet) {
      return;
    }

    const nextTemplateId = `template_${(projectState.cabinetTemplates.length + 1)
      .toString()
      .padStart(3, "0")}`;

    setProjectState((state) => saveCabinetTemplate(state, templateName, editingCabinet.structure));
    setSelectedTemplateId(nextTemplateId);
    setTemplateName("");
  }

  function applySelectedCabinetTemplate() {
    if (!selectedGroupState || !editingCabinet || !selectedTemplateId) {
      return;
    }

    setProjectState((state) =>
      applyCabinetTemplate(state, selectedGroupState.id, editingCabinet.order, selectedTemplateId),
    );
  }

  function deleteSelectedCabinetTemplate(templateId: string) {
    setProjectState((state) => deleteCabinetTemplate(state, templateId));
    setSelectedTemplateId((currentTemplateId) =>
      currentTemplateId === templateId ? "" : currentTemplateId,
    );
  }

  return (
    <main className="app-shell">
      <section className="floor-plan-panel" aria-labelledby="floor-plan-title">
        <div className="toolbar">
          <div>
            <p className="eyebrow">固定商场平面图</p>
            <h1 id="floor-plan-title">Mall Shelf Studio</h1>
          </div>
          <div className="toolbar-status">
            <button
              aria-pressed={isCalibrationMode}
              className="toolbar-button"
              onClick={() => setIsCalibrationMode((value) => !value)}
              type="button"
            >
              校准货柜组
            </button>
            <span className="status-pill">本地项目</span>
            <span className={`autosave autosave-${saveStatus}`}>
              自动保存：{saveStatus === "failed" ? "失败" : "已保存"}
            </span>
          </div>
        </div>

        <div className="floor-plan-frame">
          <div
            className="floor-plan-canvas"
            ref={floorPlanCanvasRef}
          >
            <img
              alt={floorPlanConfig.imageAlt}
              className="floor-plan-image"
              src={floorPlanConfig.imagePath}
            />
            {floorPlanConfig.cabinetGroups.map((group) => {
              const groupState = projectState.cabinetGroups[group.id];
              const position = groupState?.position ?? group.position;

              return (
                <button
                  aria-label={`选择货柜组 ${group.id}`}
                  aria-pressed={group.id === projectState.selectedCabinetGroupId}
                  className={`cabinet-group-marker ${groupState?.locked ? "is-locked" : ""} ${
                    isCalibrationMode ? "is-calibrating" : ""
                  }`}
                  key={group.id}
                  onClick={() => setProjectState((state) => selectCabinetGroup(state, group.id))}
                  onMouseDown={(event) => startMouseDrag(event, group.id, "move")}
                  onPointerDown={(event) => startDrag(event, group.id, "move")}
                  style={{
                    height: `${position.heightPercent}%`,
                    left: `${position.leftPercent}%`,
                    top: `${position.topPercent}%`,
                    width: `${position.widthPercent}%`,
                  }}
                  type="button"
                >
                  <span className="cabinet-group-label">{group.id}</span>
                  <span
                    aria-hidden="true"
                    className="cabinet-group-resize-handle"
                    onMouseDown={(event) => startMouseDrag(event, group.id, "resize")}
                    onPointerDown={(event) => startDrag(event, group.id, "resize")}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <p className="hint">蓝色框是货柜组编号，仅作为提示用；未聚焦时隐藏。</p>
      </section>

      <aside className="selection-panel">
        <p className="eyebrow">货柜组</p>
        {selectedGroup && selectedGroupState && activeView === "templateEditor" && editingCabinet ? (
          <>
            <button className="text-button" onClick={() => setActiveView("main")} type="button">
              返回主页
            </button>
            <h2>编辑货柜模板</h2>
            <div className="template-editor-header">
              <button
                aria-label="上一货柜"
                disabled={editingCabinetIndex === 0}
                onClick={showPreviousEditingCabinet}
                type="button"
              >
                ‹
              </button>
              <strong>{`${selectedGroup.id}-${editingCabinet.order}`}</strong>
              <button
                aria-label="下一货柜"
                disabled={editingCabinetIndex >= selectedGroupState.cabinets.length - 1}
                onClick={showNextEditingCabinet}
                type="button"
              >
                ›
              </button>
            </div>
            <div className="template-editor-layout">
              <article className="cabinet-preview template-cabinet-preview">
                <span className="cabinet-preview-label">{`${selectedGroup.id}-${editingCabinet.order}`}</span>
                <div className="cabinet-preview-body">
                  {editingCabinet.structure.layers.map((layer, layerIndex) => (
                    <div
                      className="cabinet-preview-layer"
                      key={layerIndex}
                      style={{ flexGrow: layer.heightPercent }}
                    >
                      {Array.from({ length: layer.slotCount }, (_, slotIndex) => (
                        <div className="cabinet-preview-slot" key={slotIndex} />
                      ))}
                    </div>
                  ))}
                </div>
              </article>
              <section className="structure-editor" aria-label="货柜结构设置">
                <label>
                  层数
                  <input
                    max="8"
                    min="1"
                    onChange={(event) => updateEditingLayerCount(Number(event.currentTarget.value))}
                    type="number"
                    value={editingCabinet.structure.layers.length}
                  />
                </label>
                {editingCabinet.structure.layers.map((layer, layerIndex) => (
                  <div className="layer-editor-row" key={layerIndex}>
                    <label>
                      第 {layerIndex + 1} 层层高
                      <input
                        aria-label={`第 ${layerIndex + 1} 层层高`}
                        onChange={(event) =>
                          updateEditingLayer(
                            layerIndex,
                            "heightPercent",
                            Number(event.currentTarget.value),
                          )
                        }
                        type="number"
                        value={layer.heightPercent}
                      />
                    </label>
                    <label>
                      第 {layerIndex + 1} 层间距
                      <input
                        aria-label={`第 ${layerIndex + 1} 层间距`}
                        onChange={(event) =>
                          updateEditingLayer(
                            layerIndex,
                            "gapAfterPercent",
                            Number(event.currentTarget.value),
                          )
                        }
                        type="number"
                        value={layer.gapAfterPercent}
                      />
                    </label>
                    <label>
                      第 {layerIndex + 1} 层格子
                      <input
                        aria-label={`第 ${layerIndex + 1} 层格子`}
                        max="12"
                        min="1"
                        onChange={(event) =>
                          updateEditingLayer(layerIndex, "slotCount", Number(event.currentTarget.value))
                        }
                        type="number"
                        value={layer.slotCount}
                      />
                    </label>
                  </div>
                ))}
                <p className={editingValidation?.isValid ? "validation-ok" : "validation-error"}>
                  {editingValidation?.isValid
                    ? `剩余底部留白 ${editingValidation.bottomBlankPercent}%`
                    : editingValidation?.message}
                </p>
                <section className="template-library" aria-label="模板库">
                  <label htmlFor="template-name-input">
                    模板名称
                    <input
                      id="template-name-input"
                      onChange={(event) => setTemplateName(event.currentTarget.value)}
                      type="text"
                      value={templateName}
                    />
                  </label>
                  <label htmlFor="template-select">
                    选择模板
                    <select
                      id="template-select"
                      onChange={(event) => setSelectedTemplateId(event.currentTarget.value)}
                      value={selectedTemplateId}
                    >
                      <option value="">未选择模板</option>
                      {projectState.cabinetTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ul className="template-list">
                    {projectState.cabinetTemplates.map((template) => (
                      <li key={template.id}>
                        <button
                          aria-pressed={selectedTemplateId === template.id}
                          onClick={() => setSelectedTemplateId(template.id)}
                          type="button"
                        >
                          {template.name}
                        </button>
                        <button
                          aria-label={`删除模板 ${template.name}`}
                          onClick={() => deleteSelectedCabinetTemplate(template.id)}
                          type="button"
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
                <div className="template-actions">
                  <button
                    disabled={!editingValidation?.isValid || !templateName.trim()}
                    onClick={saveCurrentCabinetTemplate}
                    type="button"
                  >
                    保存此模板
                  </button>
                  <button
                    disabled={!editingValidation?.isValid || !selectedTemplateId}
                    onClick={applySelectedCabinetTemplate}
                    type="button"
                  >
                    应用模板
                  </button>
                </div>
              </section>
            </div>
          </>
        ) : selectedGroup &&
          selectedGroupState &&
          activeView === "productEditor" &&
          editingCabinet &&
          selectedProductSlotState ? (
          <>
            <button className="text-button" onClick={() => setActiveView("main")} type="button">
              返回主页
            </button>
            <h2>编辑商品位</h2>
            <div className="product-editor-header">
              <button
                aria-label="上一货柜"
                disabled={editingCabinetIndex === 0}
                onClick={showPreviousEditingCabinet}
                type="button"
              >
                ‹
              </button>
              <strong>{`${selectedGroup.id}-${editingCabinet.order}`}</strong>
              <button
                aria-label="下一货柜"
                disabled={editingCabinetIndex >= selectedGroupState.cabinets.length - 1}
                onClick={showNextEditingCabinet}
                type="button"
              >
                ›
              </button>
            </div>
            <div className="product-editor-layout">
              <article className="cabinet-preview product-cabinet-preview">
                <span className="cabinet-preview-label">{`${selectedGroup.id}-${editingCabinet.order}`}</span>
                <div className="cabinet-preview-body">
                  {editingCabinet.structure.layers.map((layer, layerIndex) => (
                    <div
                      className="cabinet-preview-layer"
                      key={layerIndex}
                      style={{ flexGrow: layer.heightPercent }}
                    >
                      {Array.from({ length: layer.slotCount }, (_, slotIndex) => {
                        const slot = editingCabinet.slots.find(
                          (productSlot) =>
                            productSlot.layerIndex === layerIndex &&
                            productSlot.slotIndex === slotIndex,
                        );
                        const isSelected =
                          selectedProductSlot.layerIndex === layerIndex &&
                          selectedProductSlot.slotIndex === slotIndex;

                        return (
                          <button
                            aria-label={`选择 ${selectedGroup.id}-${editingCabinet.order} 第${
                              layerIndex + 1
                            }层第${slotIndex + 1}格`}
                            aria-pressed={isSelected}
                            className="cabinet-preview-slot product-slot-button"
                            key={slotIndex}
                            onClick={() => setSelectedProductSlot({ layerIndex, slotIndex })}
                            type="button"
                          >
                            <ProductSlotContents slot={slot} />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </article>
              <section className="product-slot-editor" aria-label="当前商品位编辑">
                <dl className="product-slot-details">
                  <div>
                    <dt>货柜组</dt>
                    <dd>{selectedGroup.id}</dd>
                  </div>
                  <div>
                    <dt>货柜</dt>
                    <dd>{`${selectedGroup.id}-${editingCabinet.order}`}</dd>
                  </div>
                  <div>
                    <dt>位置</dt>
                    <dd>{`第 ${selectedProductSlotState.layerIndex + 1} 层 / 第 ${
                      selectedProductSlotState.slotIndex + 1
                    } 格`}</dd>
                  </div>
                </dl>
                <label>
                  图片路径
                  <input
                    aria-label="图片路径"
                    onChange={(event) =>
                      updateSelectedProductSlot("imagePath", event.currentTarget.value)
                    }
                    type="text"
                    value={selectedProductSlotState.imagePath ?? ""}
                  />
                </label>
                <label>
                  名称
                  <input
                    aria-label="名称"
                    onChange={(event) => updateSelectedProductSlot("name", event.currentTarget.value)}
                    type="text"
                    value={selectedProductSlotState.name}
                  />
                </label>
                <label>
                  编码
                  <input
                    aria-label="编码"
                    onChange={(event) => updateSelectedProductSlot("code", event.currentTarget.value)}
                    type="text"
                    value={selectedProductSlotState.code}
                  />
                </label>
                <button onClick={clearSelectedProductSlot} type="button">
                  清空当前格子
                </button>
              </section>
            </div>
          </>
        ) : selectedGroup && selectedGroupState ? (
          <>
            <span className="selected-state">已选中货柜组</span>
            <h2>{`${selectedGroup.id} ${selectedGroup.name}`}</h2>
            <dl className="cabinet-group-details">
              <div>
                <dt>状态</dt>
                <dd>{getCabinetGroupStatusLabel(selectedGroupState.status)}</dd>
              </div>
              <div>
                <dt>货柜数量</dt>
                <dd>{selectedGroupState.cabinetCount}</dd>
              </div>
            </dl>
            <section className="parallel-preview-panel" aria-labelledby="parallel-preview-title">
              <div className="parallel-preview-header">
                <h3 id="parallel-preview-title">并联预览</h3>
                <div className="parallel-preview-controls">
                  <button
                    aria-label="上一组货柜"
                    disabled={previewStartIndex === 0}
                    onClick={showPreviousPreviewCabinets}
                    type="button"
                  >
                    ‹
                  </button>
                  <button
                    aria-label="下一组货柜"
                    disabled={
                      !selectedGroupState || previewStartIndex >= selectedGroupState.cabinets.length - 2
                    }
                    onClick={showNextPreviewCabinets}
                    type="button"
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="parallel-preview-strip">
                {previewCabinets?.map((cabinet) => (
                  <article className="cabinet-preview" key={cabinet.order}>
                    <span className="cabinet-preview-label">{`${selectedGroup.id}-${cabinet.order}`}</span>
                    <div className="cabinet-preview-body">
                      {cabinet.structure.layers.map((layer, layerIndex) => (
                        <div
                          className="cabinet-preview-layer"
                          key={`${cabinet.order}-${layerIndex}`}
                          style={{
                            flexGrow: layer.heightPercent,
                          }}
                        >
                          {Array.from({ length: layer.slotCount }, (_, slotIndex) => {
                            const slot = cabinet.slots.find(
                              (productSlot) =>
                                productSlot.layerIndex === layerIndex &&
                                productSlot.slotIndex === slotIndex,
                            );

                            return (
                              <div
                                aria-label={`${selectedGroup.id}-${cabinet.order} 第${
                                  layerIndex + 1
                                }层第${slotIndex + 1}格`}
                                className="cabinet-preview-slot"
                                key={slotIndex}
                              >
                                <ProductSlotContents slot={slot} />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <div className="selection-actions">
              <button onClick={() => setActiveView("templateEditor")} type="button">
                编辑模板
              </button>
              <button onClick={() => setActiveView("productEditor")} type="button">
                编辑商品位
              </button>
              <button onClick={() => setIsFullPreviewOpen(true)} type="button">
                显示全量并联图
              </button>
              <button type="button">保存并联图</button>
            </div>
            {isCalibrationMode ? (
              <section className="calibration-card" aria-labelledby="calibration-title">
                <div className="calibration-card-header">
                  <h3 id="calibration-title">货柜组位置校准</h3>
                  <label className="lock-toggle">
                    <input
                      checked={selectedGroupState.locked}
                      onChange={(event) =>
                        setProjectState((state) =>
                          setCabinetGroupLocked(
                            state,
                            selectedGroupState.id,
                            event.currentTarget.checked,
                          ),
                        )
                      }
                      type="checkbox"
                    />
                    锁定
                  </label>
                </div>
                <div className="calibration-grid">
                  <label htmlFor="cabinet-count-input">
                    货柜数
                    <input
                      id="cabinet-count-input"
                      min="1"
                      max="12"
                      onBlur={commitSelectedCabinetCountDraft}
                      onChange={(event) =>
                        updateSelectedCabinetCountDraft(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitSelectedCabinetCountDraft();
                        }
                      }}
                      type="number"
                      value={
                        cabinetCountDrafts[selectedGroupState.id] ??
                        String(selectedGroupState.cabinetCount)
                      }
                    />
                  </label>
                  <label>
                    左
                    <input
                      disabled={selectedGroupState.locked}
                      onChange={(event) =>
                        updateSelectedPosition("leftPercent", Number(event.currentTarget.value))
                      }
                      step="0.1"
                      type="number"
                      value={selectedGroupState.position.leftPercent}
                    />
                  </label>
                  <label>
                    上
                    <input
                      disabled={selectedGroupState.locked}
                      onChange={(event) =>
                        updateSelectedPosition("topPercent", Number(event.currentTarget.value))
                      }
                      step="0.1"
                      type="number"
                      value={selectedGroupState.position.topPercent}
                    />
                  </label>
                  <label>
                    宽
                    <input
                      disabled={selectedGroupState.locked}
                      onChange={(event) =>
                        updateSelectedPosition("widthPercent", Number(event.currentTarget.value))
                      }
                      step="0.1"
                      type="number"
                      value={selectedGroupState.position.widthPercent}
                    />
                  </label>
                  <label>
                    高
                    <input
                      disabled={selectedGroupState.locked}
                      onChange={(event) =>
                        updateSelectedPosition("heightPercent", Number(event.currentTarget.value))
                      }
                      step="0.1"
                      type="number"
                      value={selectedGroupState.position.heightPercent}
                    />
                  </label>
                </div>
                <p className="calibration-note">拖动蓝框调整位置，拖右下角调整大小。</p>
              </section>
            ) : null}
          </>
        ) : (
          <>
            <h2>选择一个货柜组开始编辑陈列</h2>
            <p>
              选中平面图上的货柜组后，这里会显示两个货柜的并联预览，并提供编辑模板、编辑商品位和导出
              PNG 的入口。
            </p>
          </>
        )}
      </aside>
      {selectedGroup && selectedGroupState && isFullPreviewOpen ? (
        <div className="modal-backdrop">
          <section
            aria-labelledby="full-parallel-preview-title"
            aria-modal="true"
            className="full-parallel-modal"
            role="dialog"
          >
            <div className="full-parallel-modal-header">
              <div>
                <p className="eyebrow">全量并联图</p>
                <h2 id="full-parallel-preview-title">{`${selectedGroup.id} 全量并联图`}</h2>
              </div>
              <button
                aria-label="关闭全量并联图"
                onClick={() => setIsFullPreviewOpen(false)}
                type="button"
              >
                关闭
              </button>
            </div>
            <div className="full-parallel-scroll">
              <div className="full-parallel-strip">
                {selectedGroupState.cabinets.map((cabinet) => (
                  <article className="cabinet-preview full-parallel-cabinet" key={cabinet.order}>
                    <span className="cabinet-preview-label">{`${selectedGroup.id}-${cabinet.order}`}</span>
                    <div className="cabinet-preview-body">
                      {cabinet.structure.layers.map((layer, layerIndex) => (
                        <div
                          className="cabinet-preview-layer"
                          key={`${cabinet.order}-${layerIndex}`}
                          style={{
                            flexGrow: layer.heightPercent,
                          }}
                        >
                          {Array.from({ length: layer.slotCount }, (_, slotIndex) => {
                            const slot = cabinet.slots.find(
                              (productSlot) =>
                                productSlot.layerIndex === layerIndex &&
                                productSlot.slotIndex === slotIndex,
                            );

                            return (
                              <div
                                aria-label={`${selectedGroup.id}-${cabinet.order} 第${
                                  layerIndex + 1
                                }层第${slotIndex + 1}格`}
                                className="cabinet-preview-slot"
                                key={slotIndex}
                              >
                                <ProductSlotContents slot={slot} />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
