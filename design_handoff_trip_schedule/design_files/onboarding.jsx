/* ============================================================
   旅行课程表 · 帮助 / 引导灰屏 HelpOverlay
   首次进入自动出现；顶栏「?」可随时再看
   讲清楚：四种模式 + 卡片的「增删改查」+ 备选 / Plan B
   ============================================================ */

function HelpRow({ icon, iconBg, title, desc }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{
        width: 38, height: 38, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 19, background: iconBg || "var(--paper-2)"
      }}>{icon}</div>
      <div style={{ minWidth: 0, paddingTop: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

function HelpSection({ kicker, color, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 5, height: 16, borderRadius: 99, background: color }}></span>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".5px", color: "var(--ink)" }}>{kicker}</span>
      </div>
      <div style={{ display: "grid", gap: 13 }}>{children}</div>
    </div>
  );
}

function HelpOverlay({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, zIndex: 90, background: "rgba(38,32,28,.62)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 18, animation: "fadeIn .2s ease"
    }}>
      <div onClick={e => e.stopPropagation()} className="float-in" style={{
        width: 540, maxWidth: "100%", maxHeight: "92%", background: "var(--paper)", borderRadius: 24, overflow: "hidden",
        boxShadow: "0 30px 70px rgba(0,0,0,.4)", display: "flex", flexDirection: "column", position: "relative"
      }}>
        {/* 头图 */}
        <div style={{ padding: "22px 24px 18px", background: "linear-gradient(135deg,#FF8A4C,#FF6B5C)", color: "#fff", position: "relative" }}>
          <button onClick={onClose} aria-label="关闭" style={{
            position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 99, border: "none",
            background: "rgba(255,255,255,.22)", color: "#fff", cursor: "pointer", fontSize: 15
          }}>✕</button>
          <div style={{ fontSize: 26, marginBottom: 6 }}>🍁🗓️</div>
          <div style={{ fontSize: 24, fontWeight: 800 }} className="title-cn">把行程当课程表来排</div>
          <div style={{ fontSize: 13, opacity: .94, marginTop: 5, lineHeight: 1.55 }}>每张卡片就是一站行程。下面几个小动作，30 秒看完就上手。</div>
        </div>

        {/* 正文 */}
        <div style={{ padding: "4px 24px 22px", overflowY: "auto" }}>
          <HelpSection kicker="每张卡片，你可以这样玩" color="var(--brand)">
            <HelpRow icon="👆" iconBg="var(--c-sight-soft)" title="点一下，看这一站详情" desc="轻点任意卡片，右侧（手机是底部）会滑出详情：开放时间、门票、亮点、怎么去、有没有备选，全在里面。" />
            <HelpRow icon="＋" iconBg="var(--c-rest-soft)" title="想去新地方？加一站" desc="在「规划」模式里，每天的最下面有「＋ 加一项」。填好名字、类型和时间，它会自动排进对应的时间段。" />
            <HelpRow icon="✏️" iconBg="var(--c-meal-soft)" title="改时间、改名字" desc="点开卡片 →「✏️ 编辑」，名字、类型、起止时间、价格、亮点都能改。改完一保存，当天顺序自动帮你理好。" />
            <HelpRow icon="🗑️" iconBg="rgba(255,107,92,.12)" title="不去了？删掉它" desc="卡片详情或编辑框里点「🗑️ 删除」，确认一下就移除，其它行程不受影响。" />
            <HelpRow icon="✋" iconBg="var(--c-transport-soft)" title="拖一拖，换个顺序" desc="规划模式里按住卡片左边的「⠿」抓手拖动：卡片会跟着手指浮起，旁边的卡片自动让位，松手后顺势落进新位置，时间也跟着重算。" />
            <HelpRow icon="🚇" iconBg="var(--c-transport-soft)" title="改两站之间怎么走" desc="点两张卡片中间的交通小药丸，就能换乘地铁 / 巴士 / 步行，改耗时和花费，或加一段、删一段——后面的时间会自动顺移。" />
          </HelpSection>

          <HelpSection kicker="四种模式（顶栏切换）" color="var(--c-transport)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              <HelpRow icon="✏️" title="规划" desc="自由增删改、拖动排程。" />
              <HelpRow icon="👀" title="查看" desc="只读浏览，不会误改。" />
              <HelpRow icon="🧭" title="执行" desc="模拟「现在」，打卡 / 跳过。" />
              <HelpRow icon="💌" title="分享" desc="生成给同行人的清爽版。" />
            </div>
          </HelpSection>

          <HelpSection kicker="想换个方案？给它存备选" color="var(--c-free)">
            <HelpRow icon="🔀" iconBg="var(--c-free-soft)" title="一张卡片，备几个候选" desc="点开卡片往下拉到「备选方案」，「＋ 加一个备选」。填的时候先选「什么情况下换它」——雨天、想省钱、闭馆…它会变成彩色标签贴在备选上。" />
            <HelpRow icon="✏️" iconBg="var(--c-free-soft)" title="备选也能改和删" desc="每个备选右下角有 ✏️ 改、🗑️ 删，跟改主卡是同一张表单，不用重新学。点「设为主选」就一键换上去。" />
            <HelpRow icon="🅱️" iconBg="var(--c-free-soft)" title="Plan B 成套切换" desc="顶栏「🅱️ Plan B」并排看所有备选，按场景一次性整套切换，比如「全部换成雨天方案」。" />
          </HelpSection>

          <HelpSection kicker="管理整个计划" color="var(--c-meal)">
            <HelpRow icon="🗓️" iconBg="var(--c-meal-soft)" title="点顶部标题，打开行程设置" desc="改行程名、目的地、同行人，也能在这里加一天 / 删一天、调每天的日期和天气。" />
            <HelpRow icon="＋" iconBg="var(--c-rest-soft)" title="随手加一天 / 删一天" desc="日期栏（手机）或课程表最右（电脑）都有「＋ 加一天」；想删哪天，在行程设置里点这天的 🗑️ 就行。" />
          </HelpSection>
        </div>

        {/* 底栏 */}
        <div style={{ padding: "13px 24px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, background: "#FFFDFA" }}>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>顶栏「?」可随时再看本说明</span>
          <span style={{ flex: 1 }}></span>
          <button onClick={onClose} className="btn btn-primary">开始规划 →</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HelpOverlay });
