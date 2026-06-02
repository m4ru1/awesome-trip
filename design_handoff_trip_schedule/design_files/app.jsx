/* ============================================================
   旅行课程表 · 主容器 TripBoard
   状态 = 单一 trip + mode；所有变换都是纯函数
   ============================================================ */

const MODES = [
  { id: "plan", zh: "规划", emoji: "✏️" },
  { id: "view", zh: "查看", emoji: "👀" },
  { id: "execute", zh: "执行", emoji: "🧭" },
  { id: "share", zh: "分享", emoji: "💌" }
];

/* —— 局部纯函数：不重排时间，只移动游标后续块 & 重新标记冲突 —— */
function flagConflicts(blocks) {
  return blocks.map(b => {
    const oh = TT.parseOpenHours(b.primary && b.primary.openHours);
    let conflict = null;
    if (oh) {
      const e = TT.toMin(b.endTime), s = TT.toMin(b.startTime);
      if (e != null && e > oh.close) conflict = { kind: "close", msg: "晚于闭馆 " + TT.fmt(oh.close) + "，建议提前或缩短" };
      else if (s != null && s < oh.open) conflict = { kind: "open", msg: "早于开门 " + TT.fmt(oh.open) };
    }
    return Object.assign({}, b, { conflict });
  });
}
function sortByStart(blocks) {
  return blocks.slice().sort((a, b) => {
    const sa = TT.toMin(a.startTime), sb = TT.toMin(b.startTime);
    if (sa == null) return 1;
    if (sb == null) return -1;
    return sa - sb;
  });
}
function nextStartFor(day) {
  const blocks = day.blocks;
  if (!blocks.length) return "09:00";
  const last = blocks[blocks.length - 1];
  let m = TT.toMin(last.endTime);
  if (m == null) m = TT.toMin(last.startTime);
  if (m == null) m = 12 * 60;
  return TT.fmt(m + 15);
}
function shiftFrom(blocks, fromIdx, delta) {
  return blocks.map((b, i) => {
    if (i <= fromIdx || delta === 0) return b;
    const s = TT.toMin(b.startTime), e = TT.toMin(b.endTime);
    return Object.assign({}, b, {
      startTime: s != null ? TT.fmt(s + delta) : b.startTime,
      endTime: b.endTime === "次日" ? "次日" : (e != null ? TT.fmt(e + delta) : b.endTime)
    });
  });
}

function ModeSwitcher({ mode, onChange, compact }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--paper-2)", borderRadius: 14, padding: 4, gap: 2 }}>
      {MODES.map(m => {
        const on = mode === m.id;
        return (
          <button key={m.id} onClick={() => onChange(m.id)} style={{
            border: "none", cursor: "pointer", borderRadius: 11, padding: compact ? "7px 10px" : "8px 15px",
            background: on ? "#fff" : "transparent", color: on ? "var(--ink)" : "var(--ink-2)",
            boxShadow: on ? "0 3px 9px rgba(75,55,40,.14)" : "none", fontFamily: "var(--font-cn-body)",
            fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", transition: "all .2s var(--ease-spring)"
          }}>
            {m.emoji}{compact ? "" : " " + m.zh}
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const baseline = React.useMemo(() => TT.cloneTrip(window.TRIP_DATA), []);
  const baselineTotals = React.useMemo(() => TT.tripTotals(baseline), [baseline]);

  const [trip, setTrip] = React.useState(() => TT.cloneTrip(window.TRIP_DATA));
  const [mode, setMode] = React.useState("plan");
  const [planB, setPlanB] = React.useState(false);
  const [activeDay, setActiveDay] = React.useState(0);
  const [open, setOpen] = React.useState(null); // {dayIdx, blockIdx}
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 860);
  const [nowMin, setNowMin] = React.useState(14 * 60);
  const [toast, setToast] = React.useState(null);
  const [editing, setEditing] = React.useState(null);   // {kind:'create'|'edit', dayIdx, blockIdx?, defaultStart?}
  const [confirmDel, setConfirmDel] = React.useState(null); // {dayIdx, blockIdx, name}
  const [showHelp, setShowHelp] = React.useState(false);
  const [showTrip, setShowTrip] = React.useState(false); // 行程设置 / 计划总览

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    try { if (!localStorage.getItem("tt_seen_help_v4")) setShowHelp(true); } catch (e) { setShowHelp(true); }
  }, []);
  function closeHelp() { setShowHelp(false); try { localStorage.setItem("tt_seen_help_v4", "1"); } catch (e) {} }

  function showToast(msg) { setToast(msg); clearTimeout(window.__tt); window.__tt = setTimeout(() => setToast(null), 1800); }

  const openBlock = open ? trip.days[open.dayIdx].blocks[open.blockIdx] : null;

  /* —— 变换 —— */
  function mutateDay(dayIdx, fn) {
    setTrip(prev => {
      const t = Object.assign({}, prev, { days: prev.days.slice() });
      t.days[dayIdx] = fn(Object.assign({}, t.days[dayIdx], { blocks: t.days[dayIdx].blocks.slice() }));
      return t;
    });
  }

  // 换主选（备选 ↔ 主选）：不重排时间，重新标记冲突
  function setPrimaryAlt(dayIdx, blockIdx, altIdx) {
    mutateDay(dayIdx, day => {
      const blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[blockIdx]);
      const alts = b.alternatives.slice();
      const newPrimary = alts[altIdx];
      const old = b.primary;
      alts[altIdx] = old;
      b.primary = newPrimary;
      b.alternatives = alts;
      blocks[blockIdx] = b;
      return Object.assign({}, day, { blocks: flagConflicts(blocks) });
    });
    showToast("已切换主选 · 已重算冲突");
  }

  // 换交通方式：交换 primary/alt，按时长差顺移后续块
  function switchTransport(dayIdx, blockIdx, altIdx) {
    mutateDay(dayIdx, day => {
      let blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[blockIdx]);
      const conn = Object.assign({}, b.transportToNext);
      const alts = conn.alternatives.slice();
      const oldP = conn.primary, newP = alts[altIdx];
      const delta = TT.parseTransportMin(newP.duration) - TT.parseTransportMin(oldP.duration);
      alts[altIdx] = oldP;
      conn.primary = newP; conn.alternatives = alts;
      b.transportToNext = conn;
      blocks[blockIdx] = b;
      blocks = shiftFrom(blocks, blockIdx, delta);
      return Object.assign({}, day, { blocks: flagConflicts(blocks) });
    });
    showToast("已换交通 · 下游时间重算");
  }

  /* —— 交通段（卡片之间）增 / 改 / 删 —— */
  function setTransportMode(dayIdx, blockIdx, modeKey) {
    mutateDay(dayIdx, day => {
      const blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[blockIdx]);
      if (!b.transportToNext || !b.transportToNext.primary) return day;
      const conn = Object.assign({}, b.transportToNext);
      conn.primary = Object.assign({}, conn.primary, { mode: modeKey });
      b.transportToNext = conn; blocks[blockIdx] = b;
      return Object.assign({}, day, { blocks });
    });
    showToast("已改走「" + ((TRANSPORT_META[modeKey] || {}).zh || modeKey) + "」");
  }
  function setTransportField(dayIdx, blockIdx, field, value) {
    mutateDay(dayIdx, day => {
      let blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[blockIdx]);
      if (!b.transportToNext || !b.transportToNext.primary) return day;
      const conn = Object.assign({}, b.transportToNext);
      const oldP = conn.primary;
      conn.primary = Object.assign({}, oldP, { [field]: value });
      b.transportToNext = conn; blocks[blockIdx] = b;
      if (field === "duration") {
        const delta = TT.parseTransportMin(value) - TT.parseTransportMin(oldP.duration);
        blocks = shiftFrom(blocks, blockIdx, delta);
      }
      return Object.assign({}, day, { blocks: flagConflicts(blocks) });
    });
  }
  function addTransport(dayIdx, blockIdx) {
    mutateDay(dayIdx, day => {
      let blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[blockIdx]);
      b.transportToNext = { primary: { mode: "walk", duration: "10min", cost: "免费" }, alternatives: [] };
      blocks[blockIdx] = b;
      blocks = shiftFrom(blocks, blockIdx, 10);
      return Object.assign({}, day, { blocks: flagConflicts(blocks) });
    });
    showToast("已加一段交通 · 下游时间重算");
  }
  function removeTransport(dayIdx, blockIdx) {
    mutateDay(dayIdx, day => {
      let blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[blockIdx]);
      const old = b.transportToNext && b.transportToNext.primary;
      const dur = old ? TT.parseTransportMin(old.duration) : 0;
      b.transportToNext = null; blocks[blockIdx] = b;
      blocks = shiftFrom(blocks, blockIdx, -dur);
      return Object.assign({}, day, { blocks: flagConflicts(blocks) });
    });
    showToast("已移除该段交通");
  }
  function bindTransport(d, b) {
    return {
      editable: mode === "plan",
      onSwitchAlt: i => switchTransport(d, b, i),
      onSetMode: k => setTransportMode(d, b, k),
      onSetField: (f, v) => setTransportField(d, b, f, v),
      onAdd: () => addTransport(d, b),
      onRemove: () => removeTransport(d, b)
    };
  }

  /* —— 计划 / 天的管理 —— */
  function nextDayMeta(last) {
    const wk = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const m = last && /(\d{1,2})\/(\d{1,2})/.exec(last.dateLabel || "");
    if (m) { const d = new Date(2025, +m[1] - 1, +m[2]); d.setDate(d.getDate() + 1); return { dateLabel: (d.getMonth() + 1) + "/" + d.getDate(), weekday: wk[d.getDay()] }; }
    return { dateLabel: "", weekday: "" };
  }
  function addDay() {
    let newIdx = 0;
    setTrip(prev => {
      const days = prev.days.slice();
      const nd = nextDayMeta(days[days.length - 1]);
      days.push({ id: "d" + Date.now(), dateLabel: nd.dateLabel, weekday: nd.weekday, weatherHint: "待定", weatherIcon: "🌤️", blocks: [] });
      newIdx = days.length - 1;
      return Object.assign({}, prev, { days });
    });
    setActiveDay(newIdx);
    showToast("已加一天 · Day " + (newIdx + 1));
  }
  function deleteDay(dayIdx) {
    setTrip(prev => {
      if (prev.days.length <= 1) return prev;
      const days = prev.days.slice(); days.splice(dayIdx, 1);
      setActiveDay(a => Math.max(0, Math.min(a, days.length - 1)));
      return Object.assign({}, prev, { days });
    });
    setOpen(null);
    showToast("已删除 Day " + (dayIdx + 1));
  }
  function updateTrip(patch) { setTrip(prev => Object.assign({}, prev, patch)); }
  function updateDay(dayIdx, patch) {
    setTrip(prev => {
      const days = prev.days.slice();
      days[dayIdx] = Object.assign({}, days[dayIdx], patch);
      return Object.assign({}, prev, { days });
    });
  }

  // 详情里的统一回调
  function onSetPrimary(kind, idx) {
    if (!open) return;
    if (kind === "alt") setPrimaryAlt(open.dayIdx, open.blockIdx, idx);
    else if (kind === "transport") switchTransport(open.dayIdx, open.blockIdx, idx);
  }

  // 打卡 / 跳过
  function toggleStatus(status) {
    if (!open) return;
    mutateDay(open.dayIdx, day => {
      const blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[open.blockIdx]);
      b.status = b.status === status ? "planned" : status;
      blocks[open.blockIdx] = b;
      return Object.assign({}, day, { blocks });
    });
  }

  // 备选「增 / 改 / 删」
  function addAlternative(dayIdx, blockIdx, option) {
    mutateDay(dayIdx, day => {
      const blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[blockIdx]);
      const opt = Object.assign({ tags: [] }, option, { id: option.id || ("alt-" + Date.now()) });
      b.alternatives = (b.alternatives || []).concat([opt]);
      blocks[blockIdx] = b;
      return Object.assign({}, day, { blocks });
    });
    showToast("已加备选");
  }
  function updateAlternative(dayIdx, blockIdx, altIdx, option) {
    mutateDay(dayIdx, day => {
      const blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[blockIdx]);
      const alts = b.alternatives.slice();
      alts[altIdx] = Object.assign({}, alts[altIdx], option);
      b.alternatives = alts; blocks[blockIdx] = b;
      return Object.assign({}, day, { blocks });
    });
    showToast("已保存备选");
  }
  function deleteAlternative(dayIdx, blockIdx, altIdx) {
    mutateDay(dayIdx, day => {
      const blocks = day.blocks.slice();
      const b = Object.assign({}, blocks[blockIdx]);
      const alts = b.alternatives.slice(); alts.splice(altIdx, 1);
      b.alternatives = alts; blocks[blockIdx] = b;
      return Object.assign({}, day, { blocks });
    });
    showToast("已删除备选");
  }
  function openAddAlt() { if (open) setEditing({ kind: "create", variant: "alt", dayIdx: open.dayIdx, blockIdx: open.blockIdx }); }
  function openEditAlt(altIdx) { if (open) setEditing({ kind: "edit", variant: "alt", dayIdx: open.dayIdx, blockIdx: open.blockIdx, altIdx }); }
  function deleteAltCurrent(altIdx) { if (open) deleteAlternative(open.dayIdx, open.blockIdx, altIdx); }

  /* —— 卡片「增 / 改 / 删」 —— */
  // 增：按时间插入并排序，重标冲突（尊重用户填写的时间，不强行重排链）
  function addBlock(dayIdx, patch) {
    mutateDay(dayIdx, day => {
      const block = {
        id: "b-" + Date.now(), type: patch.type, startTime: patch.startTime, endTime: patch.endTime,
        status: "planned", primary: patch.primary, alternatives: [], transportToNext: null
      };
      const blocks = day.blocks.concat([block]);
      return Object.assign({}, day, { blocks: flagConflicts(sortByStart(blocks)) });
    });
    showToast("已加入「" + patch.primary.name + "」");
  }
  // 改：合并字段，时间变了则重排该天，重标冲突（保留备选 / 交通 / 状态）
  function updateBlock(dayIdx, blockIdx, patch) {
    mutateDay(dayIdx, day => {
      const blocks = day.blocks.slice();
      const old = blocks[blockIdx];
      blocks[blockIdx] = Object.assign({}, old, {
        type: patch.type, startTime: patch.startTime, endTime: patch.endTime,
        primary: Object.assign({}, old.primary, patch.primary)
      });
      return Object.assign({}, day, { blocks: flagConflicts(sortByStart(blocks)) });
    });
    showToast("已保存修改");
  }
  // 删：移除该项，重标冲突
  function deleteBlock(dayIdx, blockIdx) {
    mutateDay(dayIdx, day => {
      const blocks = day.blocks.slice();
      blocks.splice(blockIdx, 1);
      return Object.assign({}, day, { blocks: flagConflicts(blocks) });
    });
    setOpen(null); setEditing(null); setConfirmDel(null);
    showToast("已删除该项");
  }

  function openCreate(dayIdx) {
    setOpen(null);
    setEditing({ kind: "create", dayIdx, defaultStart: nextStartFor(trip.days[dayIdx]) });
  }
  function openEditCurrent() {
    if (!open) return;
    setEditing({ kind: "edit", dayIdx: open.dayIdx, blockIdx: open.blockIdx });
    setOpen(null);
  }
  function requestDeleteCurrent() {
    if (!open) return;
    const b = trip.days[open.dayIdx].blocks[open.blockIdx];
    setConfirmDel({ dayIdx: open.dayIdx, blockIdx: open.blockIdx, name: b.primary.name });
  }
  function saveEditor(result) {
    if (!editing) return;
    if (editing.variant === "alt") {
      if (editing.kind === "create") addAlternative(editing.dayIdx, editing.blockIdx, result.option);
      else updateAlternative(editing.dayIdx, editing.blockIdx, editing.altIdx, result.option);
    } else {
      if (editing.kind === "create") addBlock(editing.dayIdx, result);
      else updateBlock(editing.dayIdx, editing.blockIdx, result);
    }
    setEditing(null);
  }
  function editorDelete() {
    if (!editing) return;
    if (editing.variant === "alt") { deleteAlternative(editing.dayIdx, editing.blockIdx, editing.altIdx); setEditing(null); }
    else if (editing.kind === "edit") setConfirmDel({ dayIdx: editing.dayIdx, blockIdx: editing.blockIdx, name: trip.days[editing.dayIdx].blocks[editing.blockIdx].primary.name });
  }
  // 表单初始值
  let editorInitial = null, editorBlockType = null;
  const editorVariant = editing ? (editing.variant || "block") : "block";
  if (editing && editing.blockIdx != null) {
    const blk = trip.days[editing.dayIdx].blocks[editing.blockIdx];
    if (editorVariant === "alt") {
      editorBlockType = blk.type;
      editorInitial = editing.kind === "edit" ? { type: blk.type, primary: blk.alternatives[editing.altIdx] } : null;
    } else {
      editorInitial = editing.kind === "edit" ? blk : null;
    }
  }

  // 拖拽移动块（跨天/同天，按落点时间插入并重排该天时间）
  function moveBlock(src, targetDayIdx, dropMin) {
    setTrip(prev => {
      const t = TT.cloneTrip(prev);
      const srcDay = t.days[src.dayIdx];
      const [moved] = srcDay.blocks.splice(src.blockIdx, 1);
      const target = t.days[targetDayIdx];
      // 找插入位置：第一个 start 大于 dropMin 的块
      let insertAt = target.blocks.findIndex(b => TT.toMin(b.startTime) > dropMin);
      if (insertAt === -1) insertAt = target.blocks.length;
      target.blocks.splice(insertAt, 0, moved);
      // 重排受影响的天
      t.days[src.dayIdx] = TT.recalcDay(t.days[src.dayIdx]);
      if (targetDayIdx !== src.dayIdx) t.days[targetDayIdx] = TT.recalcDay(t.days[targetDayIdx]);
      return t;
    });
    showToast(src.dayIdx === targetDayIdx ? "已重排 · 时间重算" : "已移动到 Day " + (targetDayIdx + 1) + " · 时间重算");
  }

  // 时间轴重排
  function reorder(dayIdx, from, to) {
    setTrip(prev => {
      const t = TT.cloneTrip(prev);
      const blocks = t.days[dayIdx].blocks;
      const [m] = blocks.splice(from, 1);
      blocks.splice(to, 0, m);
      t.days[dayIdx] = TT.recalcDay(t.days[dayIdx]);
      return t;
    });
    showToast("已重排 · 时间重算");
  }

  // 时间轴重排（按 id 顺序，配合拖拽实时挤开预览）
  function reorderDayByIds(dayIdx, ids) {
    setTrip(prev => {
      const t = TT.cloneTrip(prev);
      const blocks = t.days[dayIdx].blocks;
      const byId = {};
      blocks.forEach(b => { byId[b.id] = b; });
      const next = ids.map(id => byId[id]).filter(Boolean);
      if (next.length === blocks.length) t.days[dayIdx].blocks = next;
      t.days[dayIdx] = TT.recalcDay(t.days[dayIdx]);
      return t;
    });
    showToast("已重排 · 时间重算");
  }

  /* —— Plan B 批量场景切换 —— */
  function applyScenario(reason) {
    setTrip(prev => {
      const t = TT.cloneTrip(prev);
      t.days.forEach(day => {
        day.blocks.forEach((b, bi) => {
          const ai = (b.alternatives || []).findIndex(a => a.swapReason === reason);
          if (ai !== -1) {
            const old = b.primary;
            b.primary = b.alternatives[ai];
            b.alternatives[ai] = old;
          }
        });
        const flagged = flagConflicts(day.blocks);
        day.blocks = flagged;
      });
      return t;
    });
    showToast("已切到「" + SCENARIO_META[reason].zh.replace("备选", "方案") + "」");
  }
  function setPrimaryAtGlobal(dayIdx, blockIdx, altIdx) { setPrimaryAlt(dayIdx, blockIdx, altIdx); }
  function resetPlan() { setTrip(TT.cloneTrip(window.TRIP_DATA)); showToast("已全部还原"); }

  /* —— now 信息（执行模式） —— */
  const nowInfo = React.useMemo(() => {
    if (mode !== "execute") return null;
    const day = trip.days[activeDay];
    let blockIdx = null, nextBlockIdx = null;
    for (let i = 0; i < day.blocks.length; i++) {
      const s = TT.toMin(day.blocks[i].startTime);
      const e = day.blocks[i].endTime === "次日" ? 24 * 60 : TT.toMin(day.blocks[i].endTime);
      if (s != null && nowMin >= s && nowMin < e) blockIdx = i;
    }
    for (let i = 0; i < day.blocks.length; i++) {
      const s = TT.toMin(day.blocks[i].startTime);
      if (s != null && s > nowMin) { nextBlockIdx = i; break; }
    }
    return { dayIdx: activeDay, min: nowMin, blockIdx, nextBlockIdx };
  }, [mode, trip, activeDay, nowMin]);

  const showGrid = !isMobile && !planB && mode !== "share";
  const dateRangeText = (() => {
    const ds = trip.days;
    if (!ds.length) return trip.dateRange || "";
    const a = ds[0].dateLabel, b = ds[ds.length - 1].dateLabel;
    return a && b ? (a + " – " + b) : (trip.dateRange || "");
  })();
  const detailProps = open ? {
    block: openBlock, mode,
    onClose: () => setOpen(null),
    onSetPrimary, onAddAlt: openAddAlt, onEditAlt: openEditAlt, onDeleteAlt: deleteAltCurrent, onToggleStatus: toggleStatus,
    onEdit: openEditCurrent, onDelete: requestDeleteCurrent,
    transport: bindTransport(open.dayIdx, open.blockIdx)
  } : null;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* ===== 顶栏 ===== */}
      <header style={{ flexShrink: 0, padding: isMobile ? "11px 14px" : "13px 20px", borderBottom: "1px solid var(--line)", background: "rgba(255,248,240,.9)", backdropFilter: "blur(8px)", zIndex: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button onClick={() => setShowTrip(true)} title="行程设置 · 管理天数" style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0, border: "none", background: "transparent", cursor: "pointer", padding: 0, textAlign: "left", borderRadius: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(140deg,#FF8A4C,#FF6B5C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 6px 14px rgba(255,107,92,.3)", flexShrink: 0 }}>{trip.coverEmoji}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h1 style={{ margin: 0, fontSize: isMobile ? 19 : 23, lineHeight: 1 }} className="title-cn clamp-1">{trip.title}</h1>
                <span style={{ fontSize: 13, color: "var(--ink-3)", flexShrink: 0 }}>⌄</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 3, display: "flex", gap: 8 }} className="clamp-1">
                <span className="num">{dateRangeText}</span><span>·</span><span>{trip.destinationCity}</span><span>·</span><span className="num">{trip.days.length} 天</span>
              </div>
            </div>
          </button>
          <div style={{ flex: 1 }}></div>
          {!isMobile && <ModeSwitcher mode={mode} onChange={m => { setMode(m); setPlanB(false); }} />}
          <button onClick={() => setShowHelp(true)} className="btn btn-ghost" aria-label="帮助" title="使用帮助" style={{ width: 40, padding: 0, justifyContent: "center", fontWeight: 800, fontSize: 17, color: "var(--ink-2)" }}>?</button>
          <button onClick={() => setPlanB(p => !p)} className="btn" style={{
            background: planB ? "var(--c-free)" : "#fff", color: planB ? "#fff" : "var(--c-free)",
            boxShadow: planB ? "0 6px 16px rgba(166,107,255,.4)" : "var(--shadow-soft)"
          }}>🅱️ Plan B</button>
        </div>
        {/* 移动端模式切换在第二行 */}
        {isMobile && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
            <ModeSwitcher mode={mode} onChange={m => { setMode(m); setPlanB(false); }} compact />
          </div>
        )}
        {/* 执行模式 now 控制条 */}
        {mode === "execute" && !planB && (
          <div style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "var(--paper-2)", borderRadius: 14, padding: "8px 13px" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}>🧭 模拟「现在」</span>
            <div style={{ display: "flex", gap: 5 }}>
              {trip.days.map((d, i) => (
                <button key={d.id} onClick={() => setActiveDay(i)} className="num" style={{
                  border: "none", cursor: "pointer", borderRadius: 9, padding: "4px 9px", fontSize: 12, fontWeight: 700,
                  background: activeDay === i ? "var(--brand)" : "#fff", color: activeDay === i ? "#fff" : "var(--ink-2)"
                }}>D{i + 1}</button>
              ))}
            </div>
            <input type="range" min={8 * 60} max={21 * 60} step={5} value={nowMin} onChange={e => setNowMin(+e.target.value)}
              style={{ flex: 1, minWidth: 140, accentColor: "var(--brand)" }} />
            <span className="num" style={{ fontWeight: 700, color: "var(--brand)", fontSize: 14 }}>{TT.fmt(nowMin)}</span>
          </div>
        )}
      </header>

      {/* ===== 主体 ===== */}
      <main style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {planB ? (
          <PlanBView trip={trip} baselineTrip={baseline} baselineTotals={baselineTotals}
            onApplyScenario={applyScenario} onSetPrimaryAt={setPrimaryAtGlobal} onReset={resetPlan} />
        ) : mode === "share" ? (
          <ShareView trip={trip} />
        ) : showGrid ? (
          <ScheduleGrid trip={trip} mode={mode} onOpenBlock={(d, b) => setOpen({ dayIdx: d, blockIdx: b })}
            onMoveBlock={moveBlock} onAddBlock={openCreate} onAddDay={addDay} nowInfo={nowInfo} />
        ) : (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <DayTabs trip={trip} activeIdx={activeDay} onPick={setActiveDay} onAddDay={addDay} editable={mode === "plan"} nowInfo={nowInfo} />
            <div style={{ flex: 1, minHeight: 0 }}>
              <DayTimeline trip={trip} activeIdx={activeDay} mode={mode}
                onOpenBlock={(d, b) => setOpen({ dayIdx: d, blockIdx: b })} onReorderIds={reorderDayByIds} onAddBlock={openCreate}
                transportBinder={bindTransport} nowInfo={nowInfo} />
            </div>
          </div>
        )}

        {/* 详情 */}
        {open && (isMobile ? <BlockSheet {...detailProps} /> : <BlockDrawer {...detailProps} />)}

        {/* 增 / 改 表单（行程卡 / 备选共用） */}
        {editing && (
          <BlockEditor
            kind={editing.kind}
            variant={editorVariant}
            blockType={editorBlockType}
            initial={editorInitial}
            defaultStart={editing.defaultStart}
            onSave={saveEditor}
            onCancel={() => setEditing(null)}
            onDelete={editorDelete}
          />
        )}

        {/* 删除确认 */}
        {confirmDel && (
          <ConfirmDialog
            danger
            title="删除这一项？"
            body={"「" + confirmDel.name + "」将从行程中移除，此操作不影响其它卡片。"}
            confirmText="删除"
            onConfirm={() => deleteBlock(confirmDel.dayIdx, confirmDel.blockIdx)}
            onCancel={() => setConfirmDel(null)}
          />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="float-in" style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60,
          background: "var(--ink)", color: "#fff", borderRadius: 999, padding: "10px 20px", fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 10px 26px rgba(0,0,0,.25)"
        }}>{toast}</div>
      )}

      {/* 帮助 / 引导灰屏 */}
      {showHelp && <HelpOverlay onClose={closeHelp} />}

      {/* 行程设置 / 计划总览 */}
      {showTrip && <TripPanel trip={trip} isMobile={isMobile} onClose={() => setShowTrip(false)}
        onUpdateTrip={updateTrip} onUpdateDay={updateDay} onAddDay={addDay} onDeleteDay={deleteDay}
        onPickDay={i => { setActiveDay(i); setShowTrip(false); }} />}

      {/* 规划模式提示 */}
      {mode === "plan" && !planB && !open && (
        <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 20, fontSize: 12, color: "var(--ink-3)", background: "rgba(255,255,255,.8)", borderRadius: 10, padding: "6px 11px", boxShadow: "var(--shadow-soft)" }}>
          {isMobile ? "长按拖动卡片可重排顺序" : "拖动卡片到别的天 / 别的时段，时间会自动重算"}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
