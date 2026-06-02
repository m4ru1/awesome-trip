/* ============================================================
   旅行课程表 · 纯函数工具
   时间解析 / 重算 / 冲突检测 / 花费汇总
   ============================================================ */
(function () {
  function toMin(t) {
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  function fmt(min) {
    min = ((min % 1440) + 1440) % 1440;
    const h = Math.floor(min / 60), m = min % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }
  function parseTransportMin(s) {
    if (!s) return 0;
    const m = String(s).match(/(\d+)\s*min/i);
    if (m) return parseInt(m[1], 10);
    const h = String(s).match(/(\d+(?:\.\d+)?)\s*小时/);
    if (h) return Math.round(parseFloat(h[1]) * 60);
    return 0;
  }
  function parseYen(s) {
    if (!s) return 0;
    const m = String(s).replace(/,/g, "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }
  function parseOpenHours(s) {
    if (!s) return null;
    const m = String(s).match(/(\d{1,2}:\d{2})\s*[–\-~至]\s*(\d{1,2}:\d{2})/);
    if (!m) return null;
    return { open: toMin(m[1]), close: toMin(m[2]) };
  }

  // 为每个 block 预计算固定时长（分钟），只做一次
  function withDurations(day) {
    return Object.assign({}, day, {
      blocks: day.blocks.map(function (b) {
        let dur = 0;
        const s = toMin(b.startTime), e = toMin(b.endTime);
        if (s != null && e != null) dur = e - s;
        else if (b.endTime === "次日") dur = 0; // 住宿/返程，末位
        else dur = 60;
        return Object.assign({}, b, { _durMin: b._durMin != null ? b._durMin : dur });
      })
    });
  }

  // 重算一天的时间链：以第一个块的开始为锚，按时长 + 交通耗时顺推
  // 返回新的 blocks（含 conflict 标记）
  function recalcDay(day) {
    const d = withDurations(day);
    const blocks = d.blocks.map(function (b) { return Object.assign({}, b); });
    let cursor = toMin(blocks[0] && blocks[0].startTime);
    if (cursor == null) cursor = 9 * 60;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      b.startTime = fmt(cursor);
      if (b.endTime !== "次日") b.endTime = fmt(cursor + b._durMin);
      cursor += b._durMin;

      // 冲突检测：与主选营业时间比对
      b.conflict = null;
      const oh = parseOpenHours(b.primary && b.primary.openHours);
      if (oh) {
        const endM = toMin(b.endTime);
        if (endM != null && endM > oh.close)
          b.conflict = { kind: "close", msg: "晚于闭馆 " + fmt(oh.close) + "，建议提前或缩短" };
        else if (toMin(b.startTime) < oh.open)
          b.conflict = { kind: "open", msg: "早于开门 " + fmt(oh.open) };
      }
      // 交通耗时推进游标
      if (b.transportToNext && b.transportToNext.primary)
        cursor += parseTransportMin(b.transportToNext.primary.duration);
    }
    return Object.assign({}, day, { blocks: blocks });
  }

  // 全程花费/时长粗略汇总
  function tripTotals(trip) {
    let money = 0, transportMin = 0, sightMin = 0;
    trip.days.forEach(function (day) {
      day.blocks.forEach(function (b) {
        const p = b.primary || {};
        money += parseYen(p.perPersonCost) + parseYen(p.ticketPrice) + parseYen(p.pricePerNight);
        if (b.transportToNext && b.transportToNext.primary) {
          money += parseYen(b.transportToNext.primary.cost);
          transportMin += parseTransportMin(b.transportToNext.primary.duration);
        }
        const s = toMin(b.startTime), e = toMin(b.endTime);
        if (b.type === "sight" && s != null && e != null) sightMin += (e - s);
      });
    });
    return { money: money, transportMin: transportMin, sightMin: sightMin };
  }

  // 深拷贝 trip（结构纯净，便于撤销/重算）
  function cloneTrip(trip) { return JSON.parse(JSON.stringify(trip)); }

  // 统计含备选的块数 & 各场景可用数
  function planBStats(trip) {
    const list = [];
    trip.days.forEach(function (day, di) {
      day.blocks.forEach(function (b, bi) {
        if (b.alternatives && b.alternatives.length) list.push({ dayIdx: di, blockIdx: bi, block: b, day: day });
      });
    });
    return list;
  }

  window.TT = {
    toMin: toMin, fmt: fmt, parseTransportMin: parseTransportMin, parseYen: parseYen,
    parseOpenHours: parseOpenHours, recalcDay: recalcDay, withDurations: withDurations,
    tripTotals: tripTotals, cloneTrip: cloneTrip, planBStats: planBStats
  };
})();
