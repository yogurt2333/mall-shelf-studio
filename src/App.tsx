export function App() {
  return (
    <main className="app-shell">
      <section className="floor-plan-panel" aria-labelledby="floor-plan-title">
        <div className="toolbar">
          <div>
            <p className="eyebrow">固定商场平面图</p>
            <h1 id="floor-plan-title">Mall Shelf Studio</h1>
          </div>
          <span className="status-pill">本地项目</span>
        </div>

        <div className="floor-plan-placeholder" role="img" aria-label="固定商场平面图占位">
          <div className="cabinet-group-marker marker-a">A00</div>
          <div className="cabinet-group-marker marker-b">B00</div>
          <div className="cabinet-group-marker marker-c">C00</div>
        </div>

        <p className="hint">蓝色框是货柜组编号，仅作为提示用；未聚焦时隐藏。</p>
      </section>

      <aside className="selection-panel">
        <p className="eyebrow">货柜组</p>
        <h2>选择一个货柜组开始编辑陈列</h2>
        <p>
          选中平面图上的货柜组后，这里会显示两个货柜的并联预览，并提供编辑模板、编辑商品位和导出
          PNG 的入口。
        </p>
      </aside>
    </main>
  );
}
