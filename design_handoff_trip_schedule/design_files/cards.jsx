/* ============================================================
   旅行课程表 · 卡片组件族
   共享 UI + 紧凑行程块卡 + 四类详情卡
   ============================================================ */

const TYPE_META = window.TYPE_META, SCENARIO_META = window.SCENARIO_META, TRANSPORT_META = window.TRANSPORT_META;

/* ---------- 共享小组件 ---------- */
function TypeTag({ type }) {
  const m = TYPE_META[type];
  return (
    <span className="chip" style={{ background: m.soft, color: m.color }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: m.color, display: "inline-block" }}></span>
      {m.emoji} {m.zh}
    </span>
  );
}

function Stars({ value }) {
  const full = Math.round(value);
  return (
    <span className="num" style={{ color: "#F5A300", fontWeight: 700, fontSize: 13 }}>
      {"★".repeat(full)}<span style={{ color: "#E7DBCB" }}>{"★".repeat(5 - full)}</span>
      <span style={{ color: "var(--ink-2)", marginLeft: 5 }}>{value}</span>
    </span>
  );
}

function BudgetDots({ level }) {
  return (
    <span title={"预算 " + level + "/3"} style={{ letterSpacing: 1 }}>
      {"💰".repeat(level)}<span style={{ opacity: .25 }}>{"💰".repeat(3 - level)}</span>
    </span>
  );
}

function MiniChip({ children, color }) {
  return (
    <span className="chip" style={{ background: "var(--paper-2)", color: color || "var(--ink-2)", fontSize: 12 }}>
      {children}
    </span>
  );
}

function ScenarioChip({ reason, small }) {
  const s = SCENARIO_META[reason];
  if (!s) return null;
  return (
    <span className="chip" style={{ background: s.color, color: "#fff", fontSize: small ? 11.5 : 12.5, boxShadow: "0 2px 6px " + s.color + "55" }}>
      {s.emoji} {s.zh}
    </span>
  );
}

// 图片占位贴纸（彩色 + 大 emoji）
function ImageTile({ option, type, height, radius }) {
  const m = TYPE_META[type];
  return (
    <div className={"img-placeholder t-" + type} style={{
      height: height || 96, borderRadius: radius != null ? radius : 14, position: "relative", overflow: "hidden",
      "--tc-soft": m.soft
    }}>
      <span style={{ fontSize: Math.min((height || 96) * .5, 56), filter: "drop-shadow(0 3px 6px rgba(0,0,0,.12))" }}>
        {option.emoji || m.emoji}
      </span>
      <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 10, fontFamily: "var(--font-num)", color: m.color, opacity: .7, fontWeight: 600 }}>
        PHOTO
      </span>
    </div>
  );
}

/* ---------- 紧凑行程块卡（网格格子 / 时间轴条目共用） ---------- */
function BlockCard({ block, mode, onClick, compact, draggableProps, isDragging, nowState, style }) {
  const m = TYPE_META[block.type];
  const p = block.primary;
  const altN = (block.alternatives || []).length;
  const done = block.status === "done";
  const skipped = block.status === "skipped";
  const conflict = block.conflict;
  const isNow = nowState === "now";

  return (
    <div
      className={"block-card t-" + block.type + (isDragging ? " dragging" : "") + (conflict ? " conflict-pulse" : "")}
      onClick={onClick}
      {...(draggableProps || {})}
      style={Object.assign({
        background: done || skipped ? "#FBF6EF" : "#fff",
        border: "2px solid " + (isNow ? m.color : "transparent"),
        borderLeft: "5px solid " + m.color,
        borderRadius: 16,
        padding: compact ? "9px 11px" : "12px 14px",
        boxShadow: isNow ? "0 8px 22px " + m.color + "40" : "0 5px 14px rgba(75,55,40,.09)",
        cursor: "pointer", position: "relative",
        filter: done || skipped ? "saturate(.45)" : "none",
        opacity: skipped ? .6 : 1,
        transition: "transform .18s var(--ease-spring), box-shadow .2s",
      }, style)}
    >
      {/* 头：时间 + 类型 + 备选徽章 */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
        <span className="num" style={{ fontSize: compact ? 12.5 : 14, color: m.color, fontWeight: 700 }}>
          {block.startTime}{block.endTime !== "次日" ? "–" + block.endTime : ""}
        </span>
        <span style={{ flex: 1 }}></span>
        {isNow && <span className="chip" style={{ background: m.color, color: "#fff", fontSize: 10.5, padding: "2px 8px" }}>进行中</span>}
        {altN > 0 && (
          <span className="num" title={"有 " + altN + " 个备选"} style={{
            background: m.soft, color: m.color, fontWeight: 700, fontSize: 11.5,
            borderRadius: 99, padding: "1px 7px", border: "1.5px dashed " + m.color
          }}>+{altN}</span>
        )}
      </div>
      {/* 名称行 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: compact ? 18 : 20, lineHeight: 1 }}>{p.emoji || m.emoji}</span>
        <span className="clamp-2" style={{ fontWeight: 700, fontSize: compact ? 13.5 : 14.5, lineHeight: 1.25,
          textDecoration: skipped ? "line-through" : "none" }}>
          {p.name}
        </span>
      </div>
      {/* 副信息 */}
      {!compact && (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--ink-2)" }} className="clamp-1">
          {block.type === "meal" && p.perPersonCost ? "人均 " + p.perPersonCost
            : block.type === "rest" && p.pricePerNight ? p.pricePerNight + " / 晚"
            : p.ticketPrice ? p.ticketPrice : (p.address || "")}
        </div>
      )}
      {/* 完成标记 */}
      {done && (
        <span style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: 99,
          background: "#15B8A6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, boxShadow: "0 3px 8px rgba(21,184,166,.4)", animation: "popCheck .4s var(--ease-spring)" }}>✓</span>
      )}
      {conflict && (
        <div style={{ marginTop: 6, fontSize: 11, color: "var(--brand)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          ⚠️ {conflict.msg}
        </div>
      )}
    </div>
  );
}

/* ---------- 四类详情正文 ---------- */
function DetailRow({ label, children }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ width: 76, flexShrink: 0, color: "var(--ink-2)", fontSize: 13 }}>{label}</span>
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{children}</span>
    </div>
  );
}

function TagRow({ tags, color }) {
  if (!tags || !tags.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {tags.map((t, i) => <MiniChip key={i} color={color}>{t}</MiniChip>)}
    </div>
  );
}

function SightDetail({ o }) {
  return (
    <div>
      <DetailRow label="开放时间">{o.openHours || "—"}</DetailRow>
      <DetailRow label="门票"><span className="num">{o.ticketPrice || "—"}</span></DetailRow>
      <DetailRow label="建议时长">{o.suggestedDuration || "—"}</DetailRow>
      {o.tags && <div style={{ paddingTop: 10 }}><TagRow tags={o.tags} color="var(--c-sight)" /></div>}
    </div>
  );
}

function MealDetail({ o }) {
  return (
    <div>
      <DetailRow label="菜系">{o.cuisine || "—"}</DetailRow>
      <DetailRow label="人均花费"><span className="num" style={{ color: "var(--c-meal)" }}>{o.perPersonCost}</span> &nbsp;<BudgetDots level={o.budgetLevel || 1} /></DetailRow>
      {o.signatureDishes && (
        <div style={{ padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
          <div style={{ color: "var(--ink-2)", fontSize: 13, marginBottom: 6 }}>重点品尝</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {o.signatureDishes.map((d, i) => (
              <span key={i} className="chip" style={{ background: "var(--c-meal-soft)", color: "#B57A00" }}>🍽️ {d}</span>
            ))}
          </div>
        </div>
      )}
      <DetailRow label="是否预订">{o.reservationNeeded ? <span style={{ color: "var(--brand)" }}>建议提前预订</span> : "无需预订"}</DetailRow>
      {o.tags && <div style={{ paddingTop: 10 }}><TagRow tags={o.tags} color="var(--c-meal)" /></div>}
    </div>
  );
}

function RestDetail({ o }) {
  return (
    <div>
      <DetailRow label="每晚价"><span className="num" style={{ color: "var(--c-rest)" }}>{o.pricePerNight}</span></DetailRow>
      <DetailRow label="评分"><Stars value={o.rating} /></DetailRow>
      <DetailRow label="入住 / 退房"><span className="num">{o.checkIn} / {o.checkOut}</span></DetailRow>
      {o.amenities && (
        <div style={{ padding: "9px 0" }}>
          <div style={{ color: "var(--ink-2)", fontSize: 13, marginBottom: 6 }}>设施</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {o.amenities.map((a, i) => (
              <span key={i} className="chip" style={{ background: "var(--c-rest-soft)", color: "#0E7E72" }}>✓ {a}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FreeDetail({ o }) {
  return (
    <div>
      {o.openHours && <DetailRow label="开放时间">{o.openHours}</DetailRow>}
      {o.ticketPrice && <DetailRow label="门票"><span className="num">{o.ticketPrice}</span></DetailRow>}
      {o.suggestedDuration && <DetailRow label="建议时长">{o.suggestedDuration}</DetailRow>}
      {o.tags && <div style={{ paddingTop: 10 }}><TagRow tags={o.tags} color="var(--c-free)" /></div>}
    </div>
  );
}

function OptionDetailBody({ block, option }) {
  const o = option || block.primary;
  const t = block.type;
  if (t === "meal") return <MealDetail o={o} />;
  if (t === "rest") return <RestDetail o={o} />;
  if (t === "free" || t === "transport") return <FreeDetail o={o} />;
  return <SightDetail o={o} />;
}

/* ---------- FLIP 重排动效：记录旧位 → 新位平滑过渡（交换 / 挤开） ---------- */
function useFlip(refsRef, depKey) {
  const prev = React.useRef({});
  React.useLayoutEffect(() => {
    const refs = refsRef.current || {};
    const ids = Object.keys(refs).filter(id => refs[id]);
    const next = {};
    ids.forEach(id => { next[id] = refs[id].getBoundingClientRect(); });
    ids.forEach(id => {
      const el = refs[id], old = prev.current[id], r = next[id];
      if (!old) return;
      const dx = old.left - r.left, dy = old.top - r.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.style.transition = "none";
      el.style.transform = "translate(" + dx + "px," + dy + "px)";
      el.style.zIndex = "25";
      // 强制回流后再过渡到原位
      void el.getBoundingClientRect();
      requestAnimationFrame(() => {
        el.style.transition = "transform .44s var(--ease-spring)";
        el.style.transform = "";
        const clear = () => { el.style.zIndex = ""; el.style.transition = ""; el.removeEventListener("transitionend", clear); };
        el.addEventListener("transitionend", clear);
      });
    });
    prev.current = next;
  }, [depKey]);
}

Object.assign(window, {
  TypeTag, Stars, BudgetDots, MiniChip, ScenarioChip, ImageTile, BlockCard,
  DetailRow, TagRow, SightDetail, MealDetail, RestDetail, FreeDetail, OptionDetailBody, useFlip
});
