/* ============================================================
   旅行课程表 · 移动单日竖向时间轴 + 日期Tab + 执行"现在"卡
   ============================================================ */

function DayTabs({ trip, activeIdx, onPick, onAddDay, editable, nowInfo }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 14px", borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
      {trip.days.map((day, di) => {
        const active = di === activeIdx;
        return (
          <button key={day.id} onClick={() => onPick(di)} style={{
            flexShrink: 0, border: "none", cursor: "pointer", borderRadius: 14, padding: "7px 13px", textAlign: "center",
            background: active ? "var(--brand)" : "#fff", color: active ? "#fff" : "var(--ink)",
            boxShadow: active ? "0 6px 14px rgba(255,107,92,.3)" : "var(--shadow-soft)",
            fontFamily: "var(--font-cn-body)", position: "relative", transition: "all .2s var(--ease-spring)"
          }}>
            <div style={{ fontSize: 10.5, opacity: active ? .9 : .55, fontWeight: 700 }}>DAY {di + 1}</div>
            <div className="num" style={{ fontWeight: 700, fontSize: 13.5 }}>{day.dateLabel}</div>
            <div style={{ fontSize: 10.5, opacity: active ? .9 : .6 }}>{day.weekday} {day.weatherIcon}</div>
            {nowInfo && nowInfo.dayIdx === di && (
              <span style={{ position: "absolute", top: 5, right: 6, width: 7, height: 7, borderRadius: 99, background: active ? "#fff" : "var(--brand)" }}></span>
            )}
          </button>
        );
      })}
      {editable && onAddDay && (
        <button onClick={onAddDay} title="加一天" style={{
          flexShrink: 0, border: "1.5px dashed #D8C7B2", cursor: "pointer", borderRadius: 14, padding: "0 15px",
          background: "rgba(255,255,255,.6)", color: "var(--ink-2)", fontFamily: "var(--font-cn-body)", fontWeight: 700, lineHeight: 1
        }}>
          <div style={{ fontSize: 18 }}>＋</div>
          <div style={{ fontSize: 9.5, marginTop: 2 }}>加一天</div>
        </button>
      )}
    </div>
  );
}

function ExecuteNowCard({ day, nowInfo, onOpenBlock, dayIdx }) {
  if (!nowInfo || nowInfo.dayIdx !== dayIdx) return null;
  const cur = nowInfo.blockIdx != null ? day.blocks[nowInfo.blockIdx] : null;
  const next = nowInfo.nextBlockIdx != null ? day.blocks[nowInfo.nextBlockIdx] : null;
  const curEnd = cur ? TT.toMin(cur.endTime) : null;
  const toNext = curEnd != null ? Math.max(0, curEnd - nowInfo.min) : null;
  const trans = cur && cur.transportToNext && cur.transportToNext.primary;

  return (
    <div className="float-in" style={{
      margin: "12px 14px", borderRadius: 18, padding: 14, color: "#fff",
      background: "linear-gradient(135deg, #FF8A4C, #FF6B5C)", boxShadow: "0 10px 26px rgba(255,107,92,.34)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, opacity: .92 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: "#fff", animation: "popCheck 1.5s infinite" }}></span>
        现在 · {TT.fmt(nowInfo.min)}
      </div>
      {cur ? (
        <div onClick={() => onOpenBlock(dayIdx, nowInfo.blockIdx)} style={{ marginTop: 8, cursor: "pointer" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }} className="title-cn">{cur.primary.emoji} {cur.primary.name}</div>
          <div className="num" style={{ fontSize: 13, opacity: .95, marginTop: 2 }}>
            {cur.startTime}–{cur.endTime}{toNext != null ? " · 还有 " + toNext + " 分钟" : ""}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700 }}>今天的行程还没开始 ☕</div>
      )}
      {next && (
        <div style={{ marginTop: 12, background: "rgba(255,255,255,.18)", borderRadius: 12, padding: "9px 11px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ opacity: .85 }}>下一步</span>
          {trans && <span className="num" style={{ fontWeight: 700 }}>{(TRANSPORT_META[trans.mode] || {}).emoji} {(TRANSPORT_META[trans.mode] || {}).zh} {trans.duration}</span>}
          <span style={{ fontWeight: 700 }} className="clamp-1">→ {next.primary.name}</span>
        </div>
      )}
    </div>
  );
}

function DayTimeline({ trip, activeIdx, mode, onOpenBlock, onReorderIds, onAddBlock, transportBinder, nowInfo }) {
  const day = trip.days[activeIdx];
  const editable = mode === "plan";

  const wrapRefs = React.useRef({});
  const cardRefs = React.useRef({});
  const setWrap = id => el => { if (el) wrapRefs.current[id] = el; else delete wrapRefs.current[id]; };
  const setCard = id => el => { if (el) cardRefs.current[id] = el; else delete cardRefs.current[id]; };

  const [order, setOrder] = React.useState(null);
  const [drag, setDrag] = React.useState(null); // {id,y,left,w,cardH,wrapH,grabDY,settling}
  const orderRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const pend = React.useRef(null);
  const justDragged = React.useRef(false);

  const ids = day.blocks.map(b => b.id);
  const displayIds = (drag && order) ? order.filter(id => ids.indexOf(id) !== -1) : ids;
  const displayBlocks = displayIds.map(id => day.blocks.find(b => b.id === id)).filter(Boolean);
  const draggedBlock = drag ? day.blocks.find(b => b.id === drag.id) : null;

  // 切天时复位
  React.useEffect(() => { detach(); reset(); /* eslint-disable-next-line */ }, [activeIdx]);
  React.useEffect(() => () => detach(), []);

  // FLIP：展示顺序 / 时间变化时，让没被拖的卡片平滑挤开让位
  useFlip(wrapRefs, activeIdx + "|" + displayIds.join(",") + "|" + day.blocks.map(b => b.startTime).join(","));

  function detach() { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp); }
  function reset() { setOrder(null); setDrag(null); orderRef.current = null; dragRef.current = null; pend.current = null; document.body.classList.remove("tl-dragging"); }

  function onPointerDown(e, id, isGrip) {
    if (!editable) return;                          // 只读模式：交给 onClick
    if (e.pointerType === "touch" && !isGrip) return; // 触摸：只有抓手起拖，卡片本体留给滚动 / 点按
    pend.current = { id, x: e.clientX, y: e.clientY, started: false };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    if (isGrip) e.preventDefault();
  }

  function beginDrag() {
    const p = pend.current; if (!p) return;
    const card = cardRefs.current[p.id], wrap = wrapRefs.current[p.id];
    if (!card || !wrap) return;
    const cr = card.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    const st = { id: p.id, grabDY: p.y - cr.top, left: cr.left, w: cr.width, cardH: cr.height, wrapH: wr.height, y: cr.top, settling: false };
    dragRef.current = st;
    orderRef.current = ids.slice();
    setOrder(ids.slice());
    setDrag(st);
    document.body.classList.add("tl-dragging");
  }

  function onMove(e) {
    const p = pend.current; if (!p) return;
    if (!p.started) {
      if (Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y) < 7) return;
      p.started = true; beginDrag();
    }
    e.preventDefault();
    const st = dragRef.current; if (!st) return;
    const y = e.clientY - st.grabDY;
    st.y = y;
    setDrag(d => d ? Object.assign({}, d, { y }) : d);
    // 计算落点：指针越过哪些卡片的中线
    const others = (orderRef.current || ids).filter(id => id !== st.id);
    let insert = 0;
    others.forEach(id => {
      const el = wrapRefs.current[id];
      if (el) { const r = el.getBoundingClientRect(); if (e.clientY > r.top + r.height / 2) insert++; }
    });
    const next = others.slice(); next.splice(insert, 0, st.id);
    if (!orderRef.current || orderRef.current.join(",") !== next.join(",")) { orderRef.current = next; setOrder(next); }
  }

  function onUp() {
    detach();
    const p = pend.current; pend.current = null;
    if (!p) return;
    if (!p.started) {                               // 没拖动 = 点按，打开详情
      const realIdx = day.blocks.findIndex(b => b.id === p.id);
      if (realIdx !== -1) onOpenBlock(activeIdx, realIdx);
      return;
    }
    justDragged.current = true;
    setTimeout(() => { justDragged.current = false; }, 120);
    const st = dragRef.current;
    const finalOrder = orderRef.current;
    const wrap = wrapRefs.current[st.id];
    const target = wrap ? wrap.getBoundingClientRect() : null;
    if (target) {                                   // 顺势把抬起的卡片滑入空位
      setDrag(d => d ? Object.assign({}, d, { y: target.top, settling: true }) : d);
      setTimeout(() => {
        if (finalOrder && finalOrder.join(",") !== ids.join(",")) onReorderIds(activeIdx, finalOrder);
        reset();
      }, 250);
    } else {
      if (finalOrder && finalOrder.join(",") !== ids.join(",")) onReorderIds(activeIdx, finalOrder);
      reset();
    }
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", paddingBottom: 30, position: "relative" }}>
      {mode === "execute" && <ExecuteNowCard day={day} dayIdx={activeIdx} nowInfo={nowInfo} onOpenBlock={onOpenBlock} />}

      <div style={{ padding: "10px 14px 0" }}>
        {displayBlocks.map((b, pos) => {
          const realIdx = day.blocks.indexOf(b);
          const m = TYPE_META[b.type];
          const isNow = nowInfo && nowInfo.dayIdx === activeIdx && nowInfo.blockIdx === realIdx && mode === "execute";
          const isDragged = drag && drag.id === b.id;
          return (
            <div key={b.id} ref={setWrap(b.id)}>
              {isDragged ? (
                /* 占位空槽：卡片被抬起后留下的位置，其它卡片围着它挤开 */
                <div style={{ height: drag.wrapH, paddingLeft: 57, paddingBottom: 4 }}>
                  <div style={{ height: drag.cardH, borderRadius: 16, border: "2px dashed rgba(76,125,255,.4)", background: "rgba(76,125,255,.05)" }}></div>
                </div>
              ) : (
                <React.Fragment>
                  <div style={{ display: "flex", gap: 11 }}>
                    {/* 时间刻度 + 抓手 */}
                    <div style={{ width: 46, flexShrink: 0, textAlign: "right", position: "relative" }}>
                      <div className="num" style={{ fontSize: 12.5, fontWeight: 700, color: m.color }}>{b.startTime}</div>
                      <div style={{ fontSize: 10.5, color: "var(--ink-3)" }} className="num">{b.endTime !== "次日" ? b.endTime : ""}</div>
                      {editable && (
                        <div onPointerDown={e => { e.stopPropagation(); onPointerDown(e, b.id, true); }}
                          title="按住拖动重排" className="no-select" style={{ fontSize: 15, color: "var(--ink-3)", marginTop: 7, cursor: "grab", touchAction: "none", lineHeight: 1 }}>⠿</div>
                      )}
                    </div>
                    <div ref={setCard(b.id)} style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}
                      onPointerDown={e => onPointerDown(e, b.id, false)}>
                      <BlockCard block={b} mode={mode} nowState={isNow ? "now" : null}
                        onClick={() => { if (!editable) onOpenBlock(activeIdx, realIdx); else if (!justDragged.current) onOpenBlock(activeIdx, realIdx); }} />
                    </div>
                  </div>
                  {/* 连接器：交通段（规划模式可交互） */}
                  {pos < displayBlocks.length - 1 && (
                    <div style={{ display: "flex", gap: 11 }}>
                      <div style={{ width: 46, flexShrink: 0, display: "flex", justifyContent: "flex-end", paddingRight: 6 }}>
                        <div style={{ width: 0, borderLeft: "2px dotted var(--c-transport)", opacity: .4, minHeight: 30 }}></div>
                      </div>
                      <div style={{ flex: 1, padding: "4px 0 8px" }}>
                        <TransportConnector connector={b.transportToNext} layout="timeline" {...(transportBinder ? transportBinder(activeIdx, realIdx) : { editable: false })} />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )}
            </div>
          );
        })}
        {/* ＋ 加一项（规划模式） */}
        {editable && (
          <div style={{ display: "flex", gap: 11, marginTop: 4 }}>
            <div style={{ width: 46, flexShrink: 0 }}></div>
            <button onClick={() => onAddBlock(activeIdx)} style={{
              flex: 1, cursor: "pointer", border: "1.5px dashed #D8C7B2", borderRadius: 16, background: "rgba(255,255,255,.6)",
              color: "var(--ink-2)", fontFamily: "var(--font-cn-body)", fontWeight: 700, fontSize: 14, padding: "13px 0",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}>＋ 加一项行程</button>
          </div>
        )}
      </div>

      {/* 抬起的卡片：跟随手指 / 鼠标，松开后滑入空位 */}
      {drag && draggedBlock && (
        <div style={{
          position: "fixed", top: drag.y, left: drag.left, width: drag.w, zIndex: 1000, pointerEvents: "none",
          transform: drag.settling ? "scale(1)" : "scale(1.035)",
          transition: drag.settling ? "top .25s var(--ease-spring), transform .25s var(--ease-spring)" : "transform .12s ease",
          filter: "drop-shadow(0 16px 30px rgba(75,55,40,.28))"
        }}>
          <BlockCard block={draggedBlock} mode={mode} onClick={() => {}} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DayTabs, DayTimeline, ExecuteNowCard });
