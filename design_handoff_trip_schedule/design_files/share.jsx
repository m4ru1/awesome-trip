/* ============================================================
   旅行课程表 · 分享视图（明信片封面 · 只读竖版长图）
   ============================================================ */

function ShareView({ trip }) {
  const totals = TT.tripTotals(trip);
  const [showAlts, setShowAlts] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--paper-2)" }}>
      {/* 操作条 */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", gap: 9, justifyContent: "center", padding: "12px", background: "rgba(251,239,226,.86)", backdropFilter: "blur(8px)", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }}>
          🔗 {copied ? "已复制只读链接！" : "复制只读链接"}
        </button>
        <button className="btn btn-ghost">📥 导出竖版长图</button>
        <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={showAlts} onChange={e => setShowAlts(e.target.checked)} style={{ accentColor: "var(--brand)" }} />
          公开备选 Plan B
        </label>
      </div>

      {/* 竖版长图 */}
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "14px 14px 50px" }}>
        {/* 明信片封面 */}
        <div style={{
          borderRadius: 24, overflow: "hidden", boxShadow: "0 14px 36px rgba(255,138,76,.3)", position: "relative",
          background: "linear-gradient(150deg, #FF8A4C 0%, #FF6B5C 60%, #F5A300 130%)", color: "#fff", padding: "28px 24px 24px"
        }}>
          <div style={{ position: "absolute", top: -20, right: -10, fontSize: 150, opacity: .18, transform: "rotate(12deg)" }}>{trip.coverEmoji}</div>
          <div style={{ fontSize: 13, letterSpacing: 3, opacity: .9, fontFamily: "var(--font-num)", fontWeight: 600 }}>TRAVEL TIMETABLE</div>
          <h1 style={{ margin: "8px 0 2px", fontSize: 38, lineHeight: 1.1 }} className="title-cn">{trip.title}</h1>
          <div style={{ fontSize: 14, opacity: .95, marginTop: 6 }}>{trip.subtitle}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            <span className="chip sticker" style={{ color: "var(--brand)", background: "#fff" }}>📍 {trip.destinationCity}</span>
            <span className="chip sticker num" style={{ color: "var(--c-sight)", background: "#fff" }}>{trip.dateRange}</span>
            <span className="chip sticker" style={{ color: "var(--c-rest)", background: "#fff" }}>🗓️ {trip.days.length} 天</span>
            <span className="chip sticker" style={{ color: "var(--c-free)", background: "#fff" }}>👫 {trip.party}</span>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.3)" }}>
            <div><div className="num" style={{ fontSize: 22, fontWeight: 700 }}>¥{(totals.money).toLocaleString()}</div><div style={{ fontSize: 11, opacity: .9 }}>预计人均花费</div></div>
            <div><div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{Math.round(totals.sightMin / 60)}h</div><div style={{ fontSize: 11, opacity: .9 }}>观光时长</div></div>
            <div><div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{Math.round(totals.transportMin / 60 * 10) / 10}h</div><div style={{ fontSize: 11, opacity: .9 }}>在路上</div></div>
          </div>
        </div>

        {/* 每天 */}
        {trip.days.map((day, di) => (
          <div key={day.id} style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 4px 10px" }}>
              <span className="num" style={{ width: 34, height: 34, borderRadius: 12, background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, boxShadow: "0 5px 12px rgba(255,107,92,.3)" }}>{di + 1}</span>
              <div style={{ flex: 1 }}>
                <div className="num" style={{ fontWeight: 700, fontSize: 15 }}>{day.dateLabel} <span style={{ fontFamily: "var(--font-cn-body)", fontSize: 12.5, color: "var(--ink-2)" }}>{day.weekday}</span></div>
              </div>
              <span className="chip" style={{ background: "#fff", color: "var(--ink-2)", boxShadow: "var(--shadow-soft)" }}>{day.weatherIcon} {day.weatherHint}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {day.blocks.map((b, bi) => {
                const m = TYPE_META[b.type];
                const p = b.primary;
                return (
                  <div key={b.id}>
                    <div style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 16, padding: 12, boxShadow: "var(--shadow-soft)", borderLeft: "5px solid " + m.color }}>
                      <div style={{ width: 58, height: 58, flexShrink: 0 }}><ImageTile option={p} type={b.type} height={58} radius={13} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span className="num" style={{ color: m.color, fontWeight: 700, fontSize: 13 }}>{b.startTime}{b.endTime !== "次日" ? "–" + b.endTime : ""}</span>
                          <TypeTag type={b.type} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 3 }} className="clamp-1">{p.emoji} {p.name}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2, lineHeight: 1.5 }} className="clamp-2">{p.highlight}</div>
                        {showAlts && b.alternatives.length > 0 && (
                          <div style={{ marginTop: 7, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {b.alternatives.map((a, ai) => (
                              <span key={ai} className="chip" style={{ background: m.soft, color: m.color, fontSize: 11 }}>
                                {a.swapReason ? SCENARIO_META[a.swapReason].emoji : "↔"} {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {bi < day.blocks.length - 1 && b.transportToNext && b.transportToNext.primary && (
                      <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                        <span className="num" style={{ color: "var(--c-transport)", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 0, height: 12, borderLeft: "2px dotted var(--c-transport)", opacity: .5 }}></span>
                          {(TRANSPORT_META[b.transportToNext.primary.mode] || {}).emoji} {b.transportToNext.primary.duration} · {b.transportToNext.primary.cost}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 落款 */}
        <div style={{ textAlign: "center", marginTop: 30, color: "var(--ink-3)", fontSize: 12 }}>
          <div style={{ fontSize: 30 }}>{trip.coverEmoji}</div>
          <div className="title-cn" style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 4 }}>祝旅途愉快</div>
          <div style={{ marginTop: 4 }}>由「旅行课程表」生成 · {trip.dateRange}</div>
        </div>
      </div>
    </div>
  );
}

window.ShareView = ShareView;
