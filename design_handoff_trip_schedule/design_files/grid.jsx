/* ============================================================
   旅行课程表 · 桌面课程表网格 ScheduleGrid
   横轴=天，纵轴=时间（按真实时间绝对定位，可扫读"几点在哪"）
   ============================================================ */

function computeRange(trip) {
  let min = 24 * 60, max = 0;
  trip.days.forEach(day => day.blocks.forEach(b => {
    const s = TT.toMin(b.startTime);
    if (s != null) { min = Math.min(min, s); }
    const e = TT.toMin(b.endTime);
    if (e != null) max = Math.max(max, e);
    else if (b.endTime === "次日" && s != null) max = Math.max(max, s + 60);
  }));
  min = Math.floor(min / 60) * 60 - 30;
  max = Math.ceil(max / 60) * 60 + 10;
  return { start: Math.max(0, min), end: max };
}

function ScheduleGrid({ trip, mode, onOpenBlock, onMoveBlock, onAddBlock, onAddDay, nowInfo }) {
  const SCALE = 1.32; // px / min
  const { start, end } = computeRange(trip);
  const totalMin = end - start;
  const height = totalMin * SCALE;
  const [dragSrc, setDragSrc] = React.useState(null);
  const [dropDay, setDropDay] = React.useState(null);
  const editable = mode === "plan";

  const gridRefs = React.useRef({});
  const setRef = (id) => (el) => { if (el) gridRefs.current[id] = el; else delete gridRefs.current[id]; };
  const flipSig = trip.days.map((d, di) => d.blocks.map(b => b.id + "@" + di + ":" + b.startTime).join(",")).join("|");
  useFlip(gridRefs, flipSig);

  const hours = [];
  for (let h = Math.ceil(start / 60); h <= Math.floor(end / 60); h++) hours.push(h);

  function yOf(min) { return (min - start) * SCALE; }

  function onDrop(e, dayIdx) {
    e.preventDefault();
    setDropDay(null);
    if (!dragSrc) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dropMin = start + (e.clientY - rect.top) / SCALE;
    onMoveBlock(dragSrc, dayIdx, dropMin);
    setDragSrc(null);
  }

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "0 18px 24px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "58px repeat(" + trip.days.length + ", minmax(186px, 1fr))" + (editable ? " 66px" : ""),
        minWidth: 58 + trip.days.length * 200 + (editable ? 66 : 0), position: "relative"
      }}>
        {/* 列头：sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--paper)", height: 78 }}></div>
        {trip.days.map((day, di) => (
          <div key={day.id} style={{ position: "sticky", top: 0, zIndex: 20, padding: "10px 8px 8px" }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: "9px 12px", boxShadow: "var(--shadow-soft)",
              display: "flex", alignItems: "center", gap: 9, border: nowInfo && nowInfo.dayIdx === di ? "2px solid var(--brand)" : "2px solid transparent"
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--paper-2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                <span style={{ fontSize: 9, color: "var(--ink-2)", fontWeight: 700 }}>DAY</span>
                <span className="num" style={{ fontSize: 16, fontWeight: 700, color: "var(--brand)" }}>{di + 1}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="num" style={{ fontWeight: 700, fontSize: 14 }}>{day.dateLabel} <span style={{ color: "var(--ink-2)", fontFamily: "var(--font-cn-body)", fontSize: 12 }}>{day.weekday}</span></div>
                <div style={{ fontSize: 11.5, color: "var(--ink-2)" }} className="clamp-1">{day.weatherIcon} {day.weatherHint}</div>
              </div>
            </div>
          </div>
        ))}
        {/* 列头：＋加一天 */}
        {editable && (
          <div style={{ position: "sticky", top: 0, zIndex: 20, padding: "10px 6px 8px" }}>
            <button onClick={onAddDay} title="加一天" style={{
              width: "100%", height: 56, border: "1.5px dashed #D8C7B2", cursor: "pointer", borderRadius: 16,
              background: "rgba(255,255,255,.6)", color: "var(--ink-2)", fontFamily: "var(--font-cn-body)", fontWeight: 700, lineHeight: 1.2
            }}>
              <div style={{ fontSize: 18 }}>＋</div>
              <div style={{ fontSize: 10 }}>加一天</div>
            </button>
          </div>
        )}

        {/* 时间标尺 gutter */}
        <div style={{ position: "relative", height: height }}>
          {hours.map(h => (
            <div key={h} className="num" style={{ position: "absolute", top: yOf(h * 60) - 7, right: 8, fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* 各天列 */}
        {trip.days.map((day, di) => (
          <div key={day.id}
            onDragOver={e => { if (editable && dragSrc) { e.preventDefault(); setDropDay(di); } }}
            onDragLeave={() => setDropDay(d => d === di ? null : d)}
            onDrop={e => onDrop(e, di)}
            className={dropDay === di ? "drop-target" : ""}
            style={{ position: "relative", height: height, padding: "0 7px", borderLeft: "1px solid var(--line)" }}>
            {/* 小时横线 */}
            {hours.map(h => (
              <div key={h} style={{ position: "absolute", left: 0, right: 0, top: yOf(h * 60), borderTop: "1px dashed var(--line)", opacity: .7 }}></div>
            ))}
            {/* now 红线 */}
            {nowInfo && nowInfo.dayIdx === di && nowInfo.min >= start && nowInfo.min <= end && (
              <div style={{ position: "absolute", left: -2, right: -2, top: yOf(nowInfo.min), zIndex: 15, height: 0, borderTop: "2px solid var(--brand)" }}>
                <span style={{ position: "absolute", left: -4, top: -5, width: 10, height: 10, borderRadius: 99, background: "var(--brand)", boxShadow: "0 0 0 3px rgba(255,107,92,.25)" }}></span>
              </div>
            )}
            {/* 行程块 */}
            {day.blocks.map((b, bi) => {
              const sMin = TT.toMin(b.startTime);
              const eMin = b.endTime === "次日" ? Math.min(end, sMin + 75) : TT.toMin(b.endTime);
              const top = yOf(sMin);
              const h = Math.max(58, (eMin - sMin) * SCALE - 6);
              const isNow = nowInfo && nowInfo.dayIdx === di && nowInfo.min >= sMin && nowInfo.min < (TT.toMin(b.endTime) || sMin + 75);
              return (
                <div key={b.id}
                  ref={setRef(b.id)}
                  draggable={editable}
                  onDragStart={e => { setDragSrc({ dayIdx: di, blockIdx: bi }); e.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => { setDragSrc(null); setDropDay(null); }}
                  style={{ position: "absolute", top, left: 7, right: 7, height: h }}>
                  <BlockCard block={b} mode={mode} compact onClick={() => onOpenBlock(di, bi)}
                    isDragging={dragSrc && dragSrc.dayIdx === di && dragSrc.blockIdx === bi}
                    nowState={isNow ? "now" : null}
                    style={{ height: "100%", overflow: "hidden" }} />
                  {/* 交通连接 chip：点开可改走法 / 时长 */}
                  {b.transportToNext && b.transportToNext.primary && (
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: -13, display: "flex", justifyContent: "center", zIndex: 6 }}>
                      <button title="点开改交通" onClick={e => { e.stopPropagation(); onOpenBlock(di, bi); }} className="num" style={{
                        background: "#fff", color: "var(--c-transport)", fontSize: 10.5, fontWeight: 700, cursor: "pointer",
                        padding: "2px 9px", borderRadius: 99, boxShadow: "0 2px 7px rgba(76,125,255,.22)", border: "1px solid rgba(76,125,255,.2)"
                      }}>
                        {(TRANSPORT_META[b.transportToNext.primary.mode] || {}).emoji} {b.transportToNext.primary.duration}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {/* ＋ 加一项（规划模式，置于当天最后一项之后） */}
            {editable && (() => {
              let lastEnd = start;
              day.blocks.forEach(b => {
                const sMin = TT.toMin(b.startTime);
                const eMin = b.endTime === "次日" ? Math.min(end, (sMin || 0) + 75) : TT.toMin(b.endTime);
                if (eMin != null) lastEnd = Math.max(lastEnd, eMin);
              });
              const top = Math.min(yOf(lastEnd) + 18, height - 46);
              return (
                <button key="add" onClick={() => onAddBlock(di)} style={{
                  position: "absolute", left: 7, right: 7, top, height: 40, cursor: "pointer",
                  border: "1.5px dashed #D8C7B2", borderRadius: 14, background: "rgba(255,255,255,.6)",
                  color: "var(--ink-2)", fontFamily: "var(--font-cn-body)", fontWeight: 700, fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .18s var(--ease-spring)"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand)"; e.currentTarget.style.background = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#D8C7B2"; e.currentTarget.style.color = "var(--ink-2)"; e.currentTarget.style.background = "rgba(255,255,255,.6)"; }}>
                  ＋ 加一项
                </button>
              );
            })()}
          </div>
        ))}
        {/* 占位：＋加一天 列对应的 body 单元（保持网格对齐） */}
        {editable && <div style={{ height: height }}></div>}
      </div>
    </div>
  );
}

window.ScheduleGrid = ScheduleGrid;
