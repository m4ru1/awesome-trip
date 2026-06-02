/* ============================================================
   旅行课程表 · 卡片增 / 改 表单 BlockEditor + 删除确认 ConfirmDialog
   一个表单同时服务「新增」与「编辑」；保存返回 {type,startTime,endTime,primary}
   ============================================================ */

/* ---------- 表单小部件 ---------- */
function EdLabel({ children, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}>{children}</span>
      {hint && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{hint}</span>}
    </div>
  );
}

function EdInput({ style, invalid, ...rest }) {
  return (
    <input {...rest} style={Object.assign({
      width: "100%", boxSizing: "border-box", fontFamily: "var(--font-cn-body)", fontSize: 14, fontWeight: 600,
      padding: "10px 12px", borderRadius: 12, border: "1.5px solid " + (invalid ? "var(--brand)" : "var(--line)"),
      background: "#fff", color: "var(--ink)", outline: "none", transition: "border-color .15s"
    }, style)} />
  );
}

function EdField({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <EdLabel hint={hint}>{label}</EdLabel>
      {children}
    </div>
  );
}

/* ---------- 主表单（同一张表单服务：行程卡 / 备选） ---------- */
function BlockEditor({ kind, variant, blockType, initial, defaultStart, onSave, onCancel, onDelete }) {
  const isEdit = kind === "edit";
  const isAlt = variant === "alt";
  const seedStart = (initial && initial.startTime) || defaultStart || "09:00";
  const seedEnd = (initial && initial.endTime) || TT.fmt((TT.toMin(seedStart) || 540) + 60);

  const [type, setType] = React.useState((initial && initial.type) || blockType || "sight");
  const [startTime, setStart] = React.useState(seedStart);
  const [endTime, setEnd] = React.useState(seedEnd);
  const [overnight, setOvernight] = React.useState(initial ? initial.endTime === "次日" : false);
  const [p, setP] = React.useState(() => Object.assign({ name: "", emoji: "", address: "", highlight: "", tags: [] }, initial && initial.primary));
  const [reason, setReason] = React.useState((initial && initial.primary && initial.primary.swapReason) || "like");
  const [tried, setTried] = React.useState(false);

  function up(k, v) { setP(prev => Object.assign({}, prev, { [k]: v })); }
  const m = TYPE_META[type];
  const nameOk = (p.name || "").trim().length > 0;

  function save() {
    if (!nameOk) { setTried(true); return; }
    const prim = Object.assign({}, p);
    prim.name = prim.name.trim();
    if (!prim.emoji) prim.emoji = m.emoji;
    if (!prim.id) prim.id = (isAlt ? "alt-" : "opt-") + Date.now();
    if (isAlt) { prim.swapReason = reason; onSave({ option: prim }); }
    else onSave({ type, startTime, endTime: overnight ? "次日" : endTime, primary: prim });
  }

  const showStay = type === "rest";
  const showFood = type === "meal";
  const showVisit = type === "sight" || type === "free" || type === "transport";

  return (
    <div className="ed-scrim" onClick={onCancel} style={{
      position: "absolute", inset: 0, zIndex: 70, background: "rgba(43,45,51,.42)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn .18s ease"
    }}>
      <div onClick={e => e.stopPropagation()} className="float-in" style={{
        width: 460, maxWidth: "100%", maxHeight: "90%", background: "#fff", borderRadius: 22, overflow: "hidden",
        boxShadow: "0 24px 60px rgba(43,45,51,.34)", display: "flex", flexDirection: "column"
      }}>
        {/* 头 */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, background: m.soft }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 3px 9px " + m.color + "30" }}>{p.emoji || m.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }} className="title-cn">{isAlt ? (isEdit ? "编辑备选" : "新增备选") : (isEdit ? "编辑行程" : "新增一项行程")}</div>
            <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{isAlt ? "存一个候选，随时一键换成主选" : (isEdit ? "改完点保存，时间会自动重排该天顺序" : "填好后会按时间插入到当天")}</div>
          </div>
          <button onClick={onCancel} aria-label="关闭" style={{ width: 32, height: 32, borderRadius: 99, border: "none", background: "#fff", cursor: "pointer", fontSize: 15, boxShadow: "0 2px 6px rgba(0,0,0,.1)" }}>✕</button>
        </div>

        {/* 表单主体 */}
        <div style={{ padding: "16px 20px", overflowY: "auto" }}>
          {/* 备选：什么情况下换它 */}
          {isAlt && (
            <EdField label="什么情况下换它" hint="会显示成彩色标签，也能在 Plan B 里成套切换">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {Object.keys(SCENARIO_META).map(key => {
                  const s = SCENARIO_META[key]; const on = reason === key;
                  return (
                    <button key={key} onClick={() => setReason(key)} style={{
                      border: "1.5px solid " + (on ? s.color : "var(--line)"), cursor: "pointer", borderRadius: 999,
                      padding: "7px 12px", fontFamily: "var(--font-cn-body)", fontWeight: 700, fontSize: 13,
                      background: on ? s.color : "#fff", color: on ? "#fff" : "var(--ink-2)",
                      boxShadow: on ? "0 3px 9px " + s.color + "55" : "none", transition: "all .15s"
                    }}>{s.emoji} {s.zh}</button>
                  );
                })}
              </div>
            </EdField>
          )}

          {/* 类型（备选沿用主卡类型，不再展示） */}
          {!isAlt && (
            <EdField label="类型">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {Object.keys(TYPE_META).map(key => {
                  const tm = TYPE_META[key]; const on = type === key;
                  return (
                    <button key={key} onClick={() => setType(key)} style={{
                      border: "1.5px solid " + (on ? tm.color : "var(--line)"), cursor: "pointer", borderRadius: 999,
                      padding: "7px 13px", fontFamily: "var(--font-cn-body)", fontWeight: 700, fontSize: 13,
                      background: on ? tm.soft : "#fff", color: on ? tm.color : "var(--ink-2)", transition: "all .15s"
                    }}>{tm.emoji} {tm.zh}</button>
                  );
                })}
              </div>
            </EdField>
          )}

          {/* emoji + 名称 */}
          <EdField label="名称" hint="必填">
            <div style={{ display: "flex", gap: 9 }}>
              <EdInput value={p.emoji || ""} maxLength={2} onChange={e => up("emoji", e.target.value)} placeholder={m.emoji}
                style={{ width: 58, flexShrink: 0, textAlign: "center", fontSize: 20, padding: "8px 0" }} />
              <EdInput value={p.name || ""} invalid={tried && !nameOk} onChange={e => up("name", e.target.value)} placeholder="例如：清水寺 + 二三年坂" />
            </div>
            {tried && !nameOk && <div style={{ fontSize: 11.5, color: "var(--brand)", fontWeight: 700, marginTop: 6 }}>请填写名称</div>}
          </EdField>

          {/* 时间（备选不需要单独时间，沿用主卡时段） */}
          {!isAlt && (
            <EdField label="时间">
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <EdInput type="time" value={startTime} onChange={e => setStart(e.target.value)} className="num" style={{ flex: 1 }} />
                <span style={{ color: "var(--ink-3)", fontWeight: 700 }}>→</span>
                {overnight ? (
                  <div style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: "1.5px dashed var(--c-rest)", color: "var(--c-rest)", fontWeight: 700, fontSize: 14, textAlign: "center", background: "var(--c-rest-soft)" }}>次日</div>
                ) : (
                  <EdInput type="time" value={endTime} onChange={e => setEnd(e.target.value)} className="num" style={{ flex: 1 }} />
                )}
              </div>
              {type === "rest" && (
                <label style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={overnight} onChange={e => setOvernight(e.target.checked)} style={{ accentColor: "var(--c-rest)", width: 16, height: 16 }} />
                  住宿 / 过夜（结束记为「次日」）
                </label>
              )}
            </EdField>
          )}

          {/* 地址 */}
          <EdField label="地址" hint="选填">
            <EdInput value={p.address || ""} onChange={e => up("address", e.target.value)} placeholder="例如：东山区清水1丁目294" />
          </EdField>

          {/* 类型专属字段 */}
          {showVisit && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <EdField label="开放时间" hint="选填"><EdInput value={p.openHours || ""} onChange={e => up("openHours", e.target.value)} placeholder="08:30–16:00" /></EdField>
              <EdField label="门票" hint="选填"><EdInput value={p.ticketPrice || ""} onChange={e => up("ticketPrice", e.target.value)} placeholder="¥1,000 / 免费" /></EdField>
              <EdField label="建议时长" hint="选填"><EdInput value={p.suggestedDuration || ""} onChange={e => up("suggestedDuration", e.target.value)} placeholder="2 小时" /></EdField>
            </div>
          )}
          {showFood && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <EdField label="菜系" hint="选填"><EdInput value={p.cuisine || ""} onChange={e => up("cuisine", e.target.value)} placeholder="日式鳗鱼" /></EdField>
              <EdField label="人均花费" hint="选填"><EdInput value={p.perPersonCost || ""} onChange={e => up("perPersonCost", e.target.value)} placeholder="¥3,200" /></EdField>
              <EdField label="预算等级">
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3].map(lv => (
                    <button key={lv} onClick={() => up("budgetLevel", lv)} style={{
                      flex: 1, border: "1.5px solid " + ((p.budgetLevel || 1) === lv ? "var(--c-meal)" : "var(--line)"), cursor: "pointer",
                      borderRadius: 10, padding: "8px 0", background: (p.budgetLevel || 1) === lv ? "var(--c-meal-soft)" : "#fff", fontSize: 13, fontWeight: 700
                    }}>{"💰".repeat(lv)}</button>
                  ))}
                </div>
              </EdField>
              <EdField label="是否预订">
                <label style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 0", fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!p.reservationNeeded} onChange={e => up("reservationNeeded", e.target.checked)} style={{ accentColor: "var(--c-meal)", width: 16, height: 16 }} />
                  建议提前预订
                </label>
              </EdField>
            </div>
          )}
          {showStay && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <EdField label="每晚价" hint="选填"><EdInput value={p.pricePerNight || ""} onChange={e => up("pricePerNight", e.target.value)} placeholder="¥2,400" /></EdField>
              <EdField label="评分" hint="选填"><EdInput type="number" step="0.1" min="0" max="5" value={p.rating || ""} onChange={e => up("rating", e.target.value === "" ? "" : +e.target.value)} placeholder="4.7" className="num" /></EdField>
              <EdField label="入住"><EdInput value={p.checkIn || ""} onChange={e => up("checkIn", e.target.value)} placeholder="15:00" className="num" /></EdField>
              <EdField label="退房"><EdInput value={p.checkOut || ""} onChange={e => up("checkOut", e.target.value)} placeholder="11:00" className="num" /></EdField>
            </div>
          )}

          {/* 亮点 */}
          <EdField label="亮点 / 备注" hint="选填">
            <textarea value={p.highlight || ""} onChange={e => up("highlight", e.target.value)} placeholder="一句话写下为什么值得来这一站…" rows={2}
              style={{ width: "100%", boxSizing: "border-box", fontFamily: "var(--font-cn-body)", fontSize: 13.5, lineHeight: 1.55, padding: "10px 12px", borderRadius: 12, border: "1.5px solid var(--line)", resize: "vertical", outline: "none", color: "var(--ink)" }} />
          </EdField>
        </div>

        {/* 底栏 */}
        <div style={{ padding: "13px 20px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, background: "#FFFDFA" }}>
          {isEdit && (
            <button onClick={onDelete} className="btn" style={{ background: "rgba(255,107,92,.1)", color: "var(--brand)" }}>🗑️ 删除</button>
          )}
          <span style={{ flex: 1 }}></span>
          <button onClick={onCancel} className="btn btn-soft">取消</button>
          <button onClick={save} className="btn btn-primary">{isEdit ? "保存修改" : (isAlt ? "＋ 加为备选" : "＋ 加入行程")}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 删除确认 ---------- */
function ConfirmDialog({ title, body, confirmText, danger, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{
      position: "absolute", inset: 0, zIndex: 80, background: "rgba(43,45,51,.5)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn .18s ease"
    }}>
      <div onClick={e => e.stopPropagation()} className="float-in" style={{
        width: 340, maxWidth: "100%", background: "#fff", borderRadius: 20, padding: "22px 22px 18px", textAlign: "center",
        boxShadow: "0 24px 60px rgba(43,45,51,.34)"
      }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>{danger ? "🗑️" : "❓"}</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }} className="title-cn">{title}</div>
        <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>{body}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onCancel} className="btn btn-soft" style={{ flex: 1, justifyContent: "center" }}>取消</button>
          <button onClick={onConfirm} className="btn" style={{ flex: 1, justifyContent: "center", background: danger ? "var(--brand)" : "var(--ink)", color: "#fff", boxShadow: danger ? "0 6px 16px rgba(255,107,92,.32)" : "none" }}>{confirmText || "确定"}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BlockEditor, ConfirmDialog, EdInput, EdField, EdLabel });
