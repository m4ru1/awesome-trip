/* ============================================================
   旅行课程表 · 行程设置 / 计划总览 TripPanel
   一个地方搞定：改标题/目的地/同行人 + 加一天 / 删一天 / 改日期天气
   复用卡片表单里的 EdField / EdInput，保持同一套心智
   ============================================================ */

function TripDayRow({ day, idx, total, onUpdate, onDelete, onPick }) {
  const [confirming, setConfirming] = React.useState(false);
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <button onClick={onPick} title="跳到这天" style={{
          border: "none", cursor: "pointer", borderRadius: 10, padding: "6px 11px", display: "flex", alignItems: "center", gap: 7,
          background: "var(--paper-2)", fontFamily: "var(--font-cn-body)"
        }}>
          <span style={{ fontSize: 9, color: "var(--ink-2)", fontWeight: 800 }}>DAY</span>
          <span className="num" style={{ fontSize: 15, fontWeight: 700, color: "var(--brand)" }}>{idx + 1}</span>
        </button>
        <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{day.blocks.length} 项行程</span>
        <span style={{ flex: 1 }}></span>
        {total > 1 && (confirming ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onDelete} className="btn" style={{ background: "var(--brand)", color: "#fff", fontSize: 12, padding: "6px 10px", boxShadow: "0 4px 10px rgba(255,107,92,.3)" }}>确认删除</button>
            <button onClick={() => setConfirming(false)} className="btn btn-soft" style={{ fontSize: 12, padding: "6px 10px" }}>取消</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} title="删除这天" className="btn" style={{ background: "rgba(255,107,92,.1)", color: "var(--brand)", fontSize: 12.5, padding: "6px 10px" }}>🗑️</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <EdField label="日期"><EdInput value={day.dateLabel || ""} onChange={e => onUpdate({ dateLabel: e.target.value })} placeholder="11/14" className="num" /></EdField>
        <EdField label="星期"><EdInput value={day.weekday || ""} onChange={e => onUpdate({ weekday: e.target.value })} placeholder="周五" /></EdField>
        <EdField label="天气图标"><EdInput value={day.weatherIcon || ""} maxLength={2} onChange={e => onUpdate({ weatherIcon: e.target.value })} placeholder="⛅" style={{ textAlign: "center" }} /></EdField>
        <EdField label="天气"><EdInput value={day.weatherHint || ""} onChange={e => onUpdate({ weatherHint: e.target.value })} placeholder="多云 15°C" /></EdField>
      </div>
    </div>
  );
}

function TripPanelBody({ trip, onClose, onUpdateTrip, onUpdateDay, onAddDay, onDeleteDay, onPickDay }) {
  return (
    <div>
      {/* 头 */}
      <div style={{ position: "sticky", top: 0, zIndex: 2, padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "linear-gradient(135deg,#FF8A4C,#FF6B5C)", color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{trip.coverEmoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }} className="title-cn">行程设置</div>
          <div style={{ fontSize: 12, opacity: .92 }}>改计划信息、加 / 删整天</div>
        </div>
        <button onClick={onClose} aria-label="关闭" style={{ width: 32, height: 32, borderRadius: 99, border: "none", background: "rgba(255,255,255,.22)", color: "#fff", cursor: "pointer", fontSize: 15 }}>✕</button>
      </div>

      <div style={{ padding: "16px 20px 22px" }}>
        {/* 计划信息 */}
        <EdField label="行程标题"><EdInput value={trip.title || ""} onChange={e => onUpdateTrip({ title: e.target.value })} placeholder="给这趟旅行起个名" /></EdField>
        <EdField label="一句话副标题" hint="选填"><EdInput value={trip.subtitle || ""} onChange={e => onUpdateTrip({ subtitle: e.target.value })} placeholder="追着红叶，慢慢走过古都的秋天" /></EdField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <EdField label="目的地"><EdInput value={trip.destinationCity || ""} onChange={e => onUpdateTrip({ destinationCity: e.target.value })} placeholder="京都 · Kyoto" /></EdField>
          <EdField label="同行" hint="选填"><EdInput value={trip.party || ""} onChange={e => onUpdateTrip({ party: e.target.value })} placeholder="2 人 · 情侣" /></EdField>
        </div>

        {/* 天数管理 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 12px" }}>
          <span style={{ width: 5, height: 16, borderRadius: 99, background: "var(--brand)" }}></span>
          <span style={{ fontSize: 13.5, fontWeight: 800 }}>行程天数</span>
          <span className="num" style={{ background: "var(--paper-2)", color: "var(--ink-2)", borderRadius: 99, padding: "1px 9px", fontSize: 12, fontWeight: 700 }}>{trip.days.length} 天</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {trip.days.map((day, i) => (
            <TripDayRow key={day.id} day={day} idx={i} total={trip.days.length}
              onUpdate={patch => onUpdateDay(i, patch)} onDelete={() => onDeleteDay(i)} onPick={() => onPickDay(i)} />
          ))}
        </div>

        <button onClick={onAddDay} style={{
          width: "100%", marginTop: 12, cursor: "pointer", border: "1.5px dashed #D8C7B2", borderRadius: 14,
          background: "rgba(255,255,255,.6)", color: "var(--ink-2)", fontFamily: "var(--font-cn-body)", fontWeight: 700, fontSize: 14, padding: "13px 0"
        }}>＋ 加一天</button>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 8, textAlign: "center" }}>新的一天会接着最后一天的日期，先空着，回去再往里加行程</div>
      </div>
    </div>
  );
}

function TripPanel({ trip, isMobile, onClose, ...rest }) {
  if (isMobile) {
    return (
      <React.Fragment>
        <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(43,45,51,.32)", zIndex: 50, animation: "fadeIn .2s ease" }}></div>
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "92%", background: "#fff", zIndex: 51,
          borderTopLeftRadius: 24, borderTopRightRadius: 24, overflowY: "auto",
          boxShadow: "0 -12px 40px rgba(75,55,40,.22)", animation: "sheetIn .34s var(--ease-spring)"
        }}>
          <TripPanelBody trip={trip} onClose={onClose} {...rest} />
        </div>
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(43,45,51,.28)", zIndex: 50, animation: "fadeIn .2s ease" }}></div>
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "92vw", background: "#fff", zIndex: 51,
        boxShadow: "-12px 0 40px rgba(75,55,40,.2)", overflowY: "auto", animation: "drawerIn .34s var(--ease-spring)"
      }}>
        <TripPanelBody trip={trip} onClose={onClose} {...rest} />
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { TripPanel });
