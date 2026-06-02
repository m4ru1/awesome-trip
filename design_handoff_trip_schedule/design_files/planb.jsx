/* ============================================================
   旅行课程表 · Plan B 视图（场景化批量切换）
   ============================================================ */

const PLANB_SCENARIOS = ["rain", "save", "time", "closed"];

function OptionMiniCard({ option, type, dim, badge }) {
  const m = TYPE_META[type];
  return (
    <div style={{
      flex: 1, minWidth: 0, background: "#fff", border: "1.5px solid var(--line)", borderRadius: 14, padding: 11,
      opacity: dim ? .62 : 1, position: "relative"
    }}>
      {badge && <div style={{ position: "absolute", top: -9, left: 12 }}>{badge}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ width: 44, height: 44, flexShrink: 0 }}><ImageTile option={option} type={type} height={44} radius={11} /></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }} className="clamp-1">{option.emoji} {option.name}</div>
          <div className="num" style={{ fontSize: 11.5, color: m.color, marginTop: 2, fontWeight: 600 }}>
            {option.perPersonCost ? "人均 " + option.perPersonCost : option.ticketPrice ? option.ticketPrice : option.pricePerNight ? option.pricePerNight + "/晚" : "—"}
            {option.suggestedDuration ? " · " + option.suggestedDuration : ""}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 7, lineHeight: 1.5 }} className="clamp-2">{option.highlight}</div>
    </div>
  );
}

function DiffSummary({ baseline, current, affected }) {
  const dMoney = current.money - baseline.money;
  const dTime = current.transportMin - baseline.transportMin;
  function pill(label, val, unit, good) {
    const sign = val > 0 ? "+" : "";
    const color = val === 0 ? "var(--ink-2)" : (good ? "#0E9E70" : "var(--brand)");
    return (
      <div style={{ background: "#fff", borderRadius: 14, padding: "9px 14px", boxShadow: "var(--shadow-soft)", textAlign: "center", minWidth: 92 }}>
        <div style={{ fontSize: 11, color: "var(--ink-2)" }}>{label}</div>
        <div className="num roll-num" key={val} style={{ fontSize: 17, fontWeight: 700, color }}>{val === 0 ? "—" : sign + (unit === "¥" ? "¥" + Math.abs(val).toLocaleString() : val + unit)}</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {pill("总花费变化", dMoney, "¥", dMoney <= 0)}
      {pill("总交通耗时", dTime, "min", dTime <= 0)}
      <div style={{ background: "#fff", borderRadius: 14, padding: "9px 14px", boxShadow: "var(--shadow-soft)", textAlign: "center", minWidth: 92 }}>
        <div style={{ fontSize: 11, color: "var(--ink-2)" }}>受影响的块</div>
        <div className="num roll-num" key={affected} style={{ fontSize: 17, fontWeight: 700, color: affected ? "var(--c-sight)" : "var(--ink-2)" }}>{affected} 个</div>
      </div>
    </div>
  );
}

function PlanBView({ trip, baselineTrip, baselineTotals, onApplyScenario, onSetPrimaryAt, onReset }) {
  const list = TT.planBStats(trip);
  const current = TT.tripTotals(trip);
  // 受影响块：当前主选 id 与基线不同
  let affected = 0;
  trip.days.forEach((day, di) => day.blocks.forEach((b, bi) => {
    const base = baselineTrip.days[di].blocks[bi];
    if (base && base.primary.id !== b.primary.id) affected++;
  }));
  const [activeScenario, setActiveScenario] = React.useState(null);

  function applyScenario(r) {
    setActiveScenario(prev => prev === r ? null : r);
    onApplyScenario(r);
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "18px 20px 40px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 26 }} className="title-cn">Plan B · 备选总览</h2>
        <span style={{ color: "var(--ink-2)", fontSize: 13 }}>共 {list.length} 个块带备选，按场景一键切换</span>
      </div>

      {/* 场景批量切换 */}
      <div style={{ marginTop: 16, background: "var(--paper-2)", borderRadius: 18, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--ink-2)" }}>遇到情况了？一键切换整套方案 →</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          {PLANB_SCENARIOS.map(r => {
            const s = SCENARIO_META[r];
            const cnt = list.filter(x => x.block.alternatives.some(a => a.swapReason === r)).length;
            const on = activeScenario === r;
            return (
              <button key={r} disabled={!cnt} onClick={() => applyScenario(r)} style={{
                border: "2px solid " + (on ? s.color : "transparent"), cursor: cnt ? "pointer" : "not-allowed",
                background: on ? s.color : "#fff", color: on ? "#fff" : (cnt ? "var(--ink)" : "var(--ink-3)"),
                borderRadius: 14, padding: "10px 15px", fontFamily: "var(--font-cn-body)", fontWeight: 700, fontSize: 13.5,
                boxShadow: on ? "0 6px 16px " + s.color + "55" : "var(--shadow-soft)", opacity: cnt ? 1 : .55,
                transition: "all .2s var(--ease-spring)"
              }}>
                {s.emoji} 全部切到{s.zh.replace("备选", "方案")} <span className="num" style={{ opacity: .7, fontSize: 12 }}>· {cnt}</span>
              </button>
            );
          })}
          <button onClick={() => { setActiveScenario(null); onReset(); }} className="btn btn-ghost" style={{ marginLeft: "auto" }}>↺ 全部还原</button>
        </div>
        <DiffSummary baseline={baselineTotals} current={current} affected={affected} />
      </div>

      {/* A / B 并排对比 */}
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        {list.map(({ dayIdx, blockIdx, block, day }) => {
          const base = baselineTrip.days[dayIdx].blocks[blockIdx];
          const swapped = base.primary.id !== block.primary.id;
          // 当前主选 + 所有候选（含被换下的基线主选）
          return (
            <div key={block.id} style={{ background: "#fff", borderRadius: 18, padding: 16, boxShadow: "var(--shadow-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span className="num" style={{ background: "var(--paper-2)", borderRadius: 8, padding: "2px 8px", fontWeight: 700, fontSize: 12 }}>DAY {dayIdx + 1} · {block.startTime}</span>
                <TypeTag type={block.type} />
                {swapped && <span className="chip" style={{ background: "var(--brand)", color: "#fff" }}>已切换</span>}
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "stretch", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginBottom: 6, fontWeight: 700 }}>当前主选 (A)</div>
                  <OptionMiniCard option={block.primary} type={block.type}
                    badge={<span className="chip" style={{ background: TYPE_META[block.type].color, color: "#fff", fontSize: 11 }}>主选</span>} />
                </div>
                <div style={{ display: "flex", alignItems: "center", color: "var(--ink-3)", fontSize: 22 }}>⇄</div>
                <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginBottom: -2, fontWeight: 700 }}>备选 (B)</div>
                  {block.alternatives.map((a, ai) => (
                    <div key={a.id} style={{ display: "flex", gap: 9, alignItems: "stretch" }}>
                      <OptionMiniCard option={a} type={block.type} dim
                        badge={a.swapReason ? <ScenarioChip reason={a.swapReason} small /> : null} />
                      <button className="btn btn-soft" style={{ flexShrink: 0, alignSelf: "center", fontSize: 12.5 }}
                        onClick={() => onSetPrimaryAt(dayIdx, blockIdx, ai)}>设为主选</button>
                    </div>
                  ))}
                  {/* 若已切换，提供切回基线 */}
                  {swapped && (
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>原主选：{base.primary.emoji} {base.primary.name}（用「还原」切回）</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.PlanBView = PlanBView;
window.PLANB_SCENARIOS = PLANB_SCENARIOS;
