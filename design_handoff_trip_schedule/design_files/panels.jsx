/* ============================================================
   旅行课程表 · 交通连接器 + 备选翻牌 + 详情抽屉/底部Sheet
   ============================================================ */

/* ---------- 交通连接器（可交互：换乘 / 改时长花费 / 加减一段） ---------- */
function TransportModeRow({ current, onPick }) {
  const keys = Object.keys(TRANSPORT_META);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {keys.map(k => {
        const tm = TRANSPORT_META[k]; const on = current === k;
        return (
          <button key={k} onClick={() => onPick(k)} title={tm.zh} style={{
            border: "1.5px solid " + (on ? "var(--c-transport)" : "var(--line)"), cursor: "pointer", borderRadius: 10,
            padding: "6px 9px", background: on ? "var(--c-transport-soft)" : "#fff", color: on ? "var(--c-transport)" : "var(--ink-2)",
            fontFamily: "var(--font-cn-body)", fontWeight: 700, fontSize: 12.5, lineHeight: 1, transition: "all .15s"
          }}>{tm.emoji} {tm.zh}</button>
        );
      })}
    </div>
  );
}

function MiniEdit({ label, value, onCommit, width }) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => { setV(value); }, [value]);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 700 }}>{label}</span>
      <input value={v || ""} onChange={e => setV(e.target.value)}
        onBlur={() => { if (v !== value) onCommit(v); }}
        onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
        className="num" style={{
          width: width || 76, boxSizing: "border-box", fontFamily: "var(--font-num)", fontWeight: 600, fontSize: 13,
          padding: "7px 9px", borderRadius: 9, border: "1.5px solid var(--line)", outline: "none", color: "var(--ink)"
        }} />
    </label>
  );
}

function TransportConnector({ connector, editable, onSwitchMode, onSwitchAlt, onSetMode, onSetField, onAdd, onRemove, layout }) {
  const [open, setOpen] = React.useState(false);
  const center = layout !== "timeline";

  // 空段：未规划交通
  if (!connector || !connector.primary) {
    return (
      <div style={{ display: "flex", justifyContent: center ? "center" : "flex-start", padding: layout === "timeline" ? "2px 0" : 0 }}>
        {editable && onAdd ? (
          <button onClick={onAdd} className="chip no-select" style={{ background: "#fff", color: "var(--c-transport)", border: "1.5px dashed rgba(76,125,255,.5)", cursor: "pointer", fontWeight: 700 }}>＋ 加一段交通</button>
        ) : (
          <span className="chip" style={{ background: "var(--paper-2)", color: "var(--ink-3)", border: "1.5px dashed var(--line)" }}>交通待规划</span>
        )}
      </div>
    );
  }

  const p = connector.primary;
  const tm = TRANSPORT_META[p.mode] || { zh: p.mode, emoji: "•" };
  const alts = connector.alternatives || [];
  // 兼容旧用法：抽屉里传的是 onSwitchMode(i)
  const switchAlt = onSwitchAlt || onSwitchMode;

  return (
    <div className={"connector " + (layout === "timeline" ? "conn-timeline" : "")} style={{ display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="chip no-select"
        style={{
          border: "1.5px solid rgba(76,125,255,.3)", background: open ? "var(--c-transport-soft)" : "#fff", color: "var(--c-transport)",
          cursor: "pointer", boxShadow: "0 3px 9px rgba(76,125,255,.16)", fontSize: 12.5, padding: "5px 11px"
        }}
      >
        {tm.emoji} {tm.zh} · <span className="num">{p.duration}</span> · <span className="num">{p.cost}</span>
        <span style={{ opacity: .6, marginLeft: 2 }}>{open ? "▲" : (editable ? "⚙" : "▾")}</span>
      </button>

      {open && (
        <div className="float-in" style={{
          marginTop: 8, background: "#fff", borderRadius: 16, padding: 14, width: "100%", maxWidth: 360,
          boxShadow: "0 8px 22px rgba(76,125,255,.18)", border: "1px solid rgba(76,125,255,.16)"
        }}>
          <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "var(--ink-2)", marginBottom: p.note ? 8 : 0 }}>
            <span>耗时 <b className="num" style={{ color: "var(--ink)" }}>{p.duration}</b></span>
            <span>花费 <b className="num" style={{ color: "var(--ink)" }}>{p.cost}</b></span>
            {p.distance && <span>距离 <b className="num" style={{ color: "var(--ink)" }}>{p.distance}</b></span>}
          </div>
          {p.note && (
            <div style={{ fontSize: 12.5, color: "#3A63CC", background: "var(--c-transport-soft)", borderRadius: 10, padding: "7px 10px", lineHeight: 1.5 }}>
              💡 {p.note}
            </div>
          )}

          {editable && onSetMode ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 7, fontWeight: 700 }}>换一种走法</div>
              <TransportModeRow current={p.mode} onPick={onSetMode} />
              <div style={{ display: "flex", gap: 10, marginTop: 11, alignItems: "flex-end" }}>
                <MiniEdit label="耗时" value={p.duration} onCommit={v => onSetField("duration", v)} />
                <MiniEdit label="花费" value={p.cost} onCommit={v => onSetField("cost", v)} width={86} />
                <span style={{ flex: 1 }}></span>
                {onRemove && <button onClick={onRemove} className="btn" style={{ background: "rgba(255,107,92,.1)", color: "var(--brand)", padding: "8px 11px", fontSize: 12.5 }}>移除</button>}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>改耗时会自动顺移当天后面的行程</div>
            </div>
          ) : null}

          {alts.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 7 }}>推荐方案{editable ? "（点选即切换并重算时间）" : ""}</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {alts.map((a, i) => {
                  const am = TRANSPORT_META[a.mode] || { zh: a.mode, emoji: "•" };
                  return (
                    <button key={i} disabled={!editable} onClick={() => editable && switchAlt && switchAlt(i)}
                      style={{
                        flexShrink: 0, minWidth: 120, textAlign: "left", cursor: editable ? "pointer" : "default",
                        background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 12, padding: "8px 10px",
                        fontFamily: "var(--font-cn-body)"
                      }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{am.emoji} {am.zh}</div>
                      <div className="num" style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 3 }}>{a.duration} · {a.cost}</div>
                      {a.note && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 3 }} className="clamp-1">{a.note}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- 备选翻牌 AlternativeDeck（增 / 改 / 删 + 原因） ---------- */
function AlternativeDeck({ block, editable, onSetPrimary, onEditAlt, onDeleteAlt, onAddAlt }) {
  const alts = block.alternatives || [];
  const [flipping, setFlipping] = React.useState(false);
  const m = TYPE_META[block.type];

  function pick(i) {
    if (!editable) return;
    setFlipping(true);
    setTimeout(() => { onSetPrimary && onSetPrimary(i); setFlipping(false); }, 220);
  }

  if (!alts.length && !editable) return null;

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }} className="title-cn">备选方案</span>
        {alts.length > 0 && <span className="num" style={{ background: m.soft, color: m.color, borderRadius: 99, padding: "1px 8px", fontSize: 12, fontWeight: 700 }}>{alts.length}</span>}
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{editable ? (alts.length ? "点「设为主选」即换" : "存几个候选，遇到雨天 / 想省钱随手换") : "查看备选"}</span>
      </div>
      <div className={flipping ? "flip-swap" : ""} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alts.map((a, i) => (
          <div key={a.id || i} className={"t-" + block.type} style={{
            border: "1.5px dashed " + m.color, background: m.soft, borderRadius: 16, padding: 12,
            display: "flex", gap: 12, alignItems: "flex-start"
          }}>
            <div style={{ width: 54, height: 54, flexShrink: 0 }}>
              <ImageTile option={a} type={block.type} height={54} radius={12} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                {a.swapReason && <ScenarioChip reason={a.swapReason} small />}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }} className="clamp-1">{a.emoji} {a.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 2 }} className="clamp-2">{a.highlight}</div>
              <div className="num" style={{ fontSize: 11.5, color: m.color, marginTop: 4, fontWeight: 600 }}>
                {a.perPersonCost ? "人均 " + a.perPersonCost : a.ticketPrice ? a.ticketPrice : a.pricePerNight ? a.pricePerNight + "/晚" : ""}
                {a.suggestedDuration ? " · " + a.suggestedDuration : ""}
              </div>
              {editable && (
                <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
                  <button onClick={() => pick(i)} className="btn" style={{ fontSize: 12.5, padding: "7px 12px", background: "#fff", color: m.color, boxShadow: "0 3px 8px " + m.color + "22" }}>设为主选</button>
                  <button onClick={() => onEditAlt && onEditAlt(i)} title="编辑备选" className="btn" style={{ fontSize: 12.5, padding: "7px 10px", background: "#fff", color: "var(--ink-2)" }}>✏️</button>
                  <button onClick={() => onDeleteAlt && onDeleteAlt(i)} title="删除备选" className="btn" style={{ fontSize: 12.5, padding: "7px 10px", background: "#fff", color: "var(--brand)" }}>🗑️</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {editable && (
        <button onClick={onAddAlt} style={{
          width: "100%", marginTop: 10, cursor: "pointer", border: "1.5px dashed " + m.color, borderRadius: 14,
          background: "#fff", color: m.color, fontFamily: "var(--font-cn-body)", fontWeight: 700, fontSize: 13.5, padding: "11px 0"
        }}>＋ 加一个备选</button>
      )}
    </div>
  );
}

/* ---------- 详情内容（抽屉/Sheet 共用） ---------- */
function DetailContent({ block, mode, onSetPrimary, onAddAlt, onEditAlt, onDeleteAlt, onToggleStatus, onClose, onEdit, onDelete, transport }) {
  const m = TYPE_META[block.type];
  const p = block.primary;
  const editable = mode === "plan";
  const viewerSeesAlts = mode !== "share";

  return (
    <div>
      {/* 顶部彩条 + 封面 */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 130 }}>
          <ImageTile option={p} type={block.type} height={130} radius={0} />
        </div>
        <button onClick={onClose} aria-label="关闭" style={{
          position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 99, border: "none",
          background: "rgba(255,255,255,.92)", cursor: "pointer", fontSize: 16, boxShadow: "0 3px 8px rgba(0,0,0,.12)"
        }}>✕</button>
        <div style={{ position: "absolute", left: 16, bottom: 12, display: "flex", gap: 7 }}>
          <TypeTag type={block.type} />
          {block.status === "done" && <span className="chip" style={{ background: "#15B8A6", color: "#fff" }}>✓ 已完成</span>}
          {block.status === "skipped" && <span className="chip" style={{ background: "var(--ink-3)", color: "#fff" }}>已跳过</span>}
        </div>
      </div>

      <div style={{ padding: "16px 18px 20px" }}>
        <div className="num" style={{ color: m.color, fontWeight: 700, fontSize: 15 }}>
          {block.startTime}{block.endTime !== "次日" ? " – " + block.endTime : " 起"}
        </div>
        <h2 style={{ margin: "4px 0 6px", fontSize: 23, fontWeight: 800 }} className="title-cn">{p.emoji} {p.name}</h2>
        {p.address && <div style={{ fontSize: 12.5, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 4 }}>📍 {p.address}</div>}
        {p.highlight && (
          <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)", background: m.soft, borderRadius: 12, padding: "10px 12px" }}>
            ✨ {p.highlight}
          </div>
        )}
        {block.conflict && (
          <div className="conflict-pulse" style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: "var(--brand)", background: "rgba(255,107,92,.1)", borderRadius: 12, padding: "9px 12px" }}>
            ⚠️ 时间冲突：{block.conflict.msg}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <OptionDetailBody block={block} />
        </div>

        {/* 交通 */}
        {(block.transportToNext || (transport && transport.editable)) && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }} className="title-cn">前往下一站</div>
            <TransportConnector connector={block.transportToNext} layout="timeline"
              editable={transport ? transport.editable : editable}
              onSwitchAlt={transport ? transport.onSwitchAlt : (i => onSetPrimary && onSetPrimary("transport", i))}
              onSetMode={transport && transport.onSetMode}
              onSetField={transport && transport.onSetField}
              onAdd={transport && transport.onAdd}
              onRemove={transport && transport.onRemove} />
          </div>
        )}

        {/* 备选 */}
        {viewerSeesAlts && <AlternativeDeck block={block} editable={editable}
          onSetPrimary={(i) => onSetPrimary && onSetPrimary("alt", i)}
          onEditAlt={onEditAlt} onDeleteAlt={onDeleteAlt} onAddAlt={onAddAlt} />}

        {/* 操作区 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 20 }}>
          {mode === "execute" && (
            <React.Fragment>
              <button className="btn" style={{ background: block.status === "done" ? "#15B8A6" : "var(--paper-2)", color: block.status === "done" ? "#fff" : "var(--ink)" }}
                onClick={() => onToggleStatus("done")}>✓ {block.status === "done" ? "已完成" : "完成打卡"}</button>
              <button className="btn btn-soft" onClick={() => onToggleStatus("skipped")}>跳过</button>
            </React.Fragment>
          )}
          {editable && (
            <React.Fragment>
              <button className="btn btn-primary" onClick={onEdit}>✏️ 编辑</button>
              <button className="btn" onClick={onDelete} style={{ background: "rgba(255,107,92,.1)", color: "var(--brand)" }}>🗑️ 删除</button>
            </React.Fragment>
          )}
          <button className="btn btn-ghost" style={{ marginLeft: "auto" }}>🗺️ 地图打开</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 桌面右侧抽屉 ---------- */
function BlockDrawer({ block, onClose, ...rest }) {
  if (!block) return null;
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(43,45,51,.28)", zIndex: 40, animation: "fadeIn .2s ease" }}></div>
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: 410, maxWidth: "92vw", background: "#fff", zIndex: 41,
        boxShadow: "-12px 0 40px rgba(75,55,40,.2)", overflowY: "auto", animation: "drawerIn .34s var(--ease-spring)"
      }}>
        <DetailContent block={block} onClose={onClose} {...rest} />
      </div>
    </React.Fragment>
  );
}

/* ---------- 移动底部 Sheet ---------- */
function BlockSheet({ block, onClose, ...rest }) {
  if (!block) return null;
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(43,45,51,.32)", zIndex: 40, animation: "fadeIn .2s ease" }}></div>
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "90%", background: "#fff", zIndex: 41,
        borderTopLeftRadius: 24, borderTopRightRadius: 24, overflowY: "auto",
        boxShadow: "0 -12px 40px rgba(75,55,40,.22)", animation: "sheetIn .34s var(--ease-spring)"
      }}>
        <div style={{ position: "sticky", top: 0, display: "flex", justifyContent: "center", padding: "8px 0 0", zIndex: 2 }}>
          <div style={{ width: 40, height: 5, borderRadius: 99, background: "rgba(0,0,0,.12)" }}></div>
        </div>
        <DetailContent block={block} onClose={onClose} {...rest} />
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { TransportConnector, AlternativeDeck, DetailContent, BlockDrawer, BlockSheet });
