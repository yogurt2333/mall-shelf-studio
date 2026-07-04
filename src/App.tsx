import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { floorPlanConfig, getCabinetGroupStatusLabel } from "./floorPlanConfig";
import {
  selectCabinetGroup,
  setCabinetGroupLocked,
  updateCabinetGroupCabinetCount,
  updateCabinetGroupPosition,
  type CabinetGroupPosition,
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

export function App() {
  const { projectState, saveStatus, setProjectState } = useBrowserProjectState();
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);
  const dragState = useRef<DragState | null>(null);
  const floorPlanCanvasRef = useRef<HTMLDivElement | null>(null);
  const selectedGroup = floorPlanConfig.cabinetGroups.find(
    (group) => group.id === projectState.selectedCabinetGroupId,
  );
  const selectedGroupState = selectedGroup ? projectState.cabinetGroups[selectedGroup.id] : null;

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
        {selectedGroup && selectedGroupState ? (
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
                      defaultValue={selectedGroupState.cabinetCount}
                      id="cabinet-count-input"
                      key={selectedGroupState.id}
                      min="1"
                      max="12"
                      onBlur={(event) =>
                        setProjectState((state) =>
                          updateCabinetGroupCabinetCount(
                            state,
                            selectedGroupState.id,
                            Number(event.currentTarget.value),
                          ),
                        )
                      }
                      type="number"
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
            <p>这里会显示两个货柜的并联预览，并提供编辑模板、编辑商品位和导出 PNG 的入口。</p>
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
    </main>
  );
}
