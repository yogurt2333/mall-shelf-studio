import { floorPlanConfig, getCabinetGroupStatusLabel } from "./floorPlanConfig";
import { selectCabinetGroup } from "./projectState";
import { useBrowserProjectState } from "./useBrowserProjectState";

export function App() {
  const { projectState, saveStatus, setProjectState } = useBrowserProjectState();
  const selectedGroup = floorPlanConfig.cabinetGroups.find(
    (group) => group.id === projectState.selectedCabinetGroupId,
  );
  const selectedGroupState = selectedGroup ? projectState.cabinetGroups[selectedGroup.id] : null;

  return (
    <main className="app-shell">
      <section className="floor-plan-panel" aria-labelledby="floor-plan-title">
        <div className="toolbar">
          <div>
            <p className="eyebrow">固定商场平面图</p>
            <h1 id="floor-plan-title">Mall Shelf Studio</h1>
          </div>
          <div className="toolbar-status">
            <span className="status-pill">本地项目</span>
            <span className={`autosave autosave-${saveStatus}`}>
              自动保存：{saveStatus === "failed" ? "失败" : "已保存"}
            </span>
          </div>
        </div>

        <div className="floor-plan-frame">
          <img
            alt={floorPlanConfig.imageAlt}
            className="floor-plan-image"
            src={floorPlanConfig.imagePath}
          />
          {floorPlanConfig.cabinetGroups.map((group) => (
            <button
              aria-label={`选择货柜组 ${group.id}`}
              aria-pressed={group.id === projectState.selectedCabinetGroupId}
              className="cabinet-group-marker"
              key={group.id}
              onClick={() => setProjectState((state) => selectCabinetGroup(state, group.id))}
              style={{
                height: `${group.position.heightPercent}%`,
                left: `${group.position.leftPercent}%`,
                top: `${group.position.topPercent}%`,
                width: `${group.position.widthPercent}%`,
              }}
              type="button"
            >
              {group.id}
            </button>
          ))}
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
                <dd>{selectedGroup.cabinetCount}</dd>
              </div>
            </dl>
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
