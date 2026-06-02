import type { Trip } from '@/types'

function opt(o: Record<string, unknown>) {
  return Object.assign({ tags: [] }, o)
}

export const SEED_TRIP: Trip = {
  id: 'kyoto-momiji',
  title: '京都赏枫 5 日',
  subtitle: '追着红叶，慢慢走过古都的秋天',
  destinationCity: '京都 · Kyoto',
  coverEmoji: '🍁',
  coverColor: '#FF8A4C',
  dateRange: '11/14 – 11/18',
  party: '2 人 · 情侣',
  days: [
    {
      id: 'd1', dateLabel: '11/14', weekday: '周五', weatherHint: '多云', weatherIcon: '⛅', temperature: 15, subtitle: '稻荷 · 清水寺',
      blocks: [
        {
          id: 'b1-1', type: 'sight', startTime: '09:30', endTime: '11:30', status: 'done',
          primary: opt({
            id: 'o-fushimi', name: '伏见稲荷大社', emoji: '⛩️', address: '京都市伏见区深草薮之内町68',
            openHours: '全天开放', ticketPrice: '免费', suggestedDuration: '2 小时',
            highlight: '穿过千本鸟居，红色隧道是京都最经典的一帧。',
            tags: ['必拍', '早去人少', '登山'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'train', cost: '¥150', duration: '12min', distance: '4.2km', note: 'JR奈良线 → 京都站换乘，班次密集' },
            alternatives: [{ mode: 'taxi', cost: '¥1400', duration: '18min', distance: '5km', note: '雨天更省心' }],
          }],
        },
        {
          id: 'b1-2', type: 'meal', startTime: '11:45', endTime: '12:45', status: 'done',
          primary: opt({
            id: 'o-unagi', name: '京极かねよ 鳗鱼饭', emoji: '🍱', address: '中京区六角通新京极东入',
            cuisine: '日式鳗鱼', perPersonCost: '¥3,200', budgetLevel: 2,
            signatureDishes: ['金兰玉子鳗鱼饭', '鳗鱼肝吸'], reservationNeeded: true,
            highlight: '百年老铺，巨型玉子烧盖在鳗鱼上是招牌画面。',
            tags: ['百年老铺', '需排队'],
          }) as any,
          alternatives: [
            opt({
              id: 'o-sushi', name: 'musashi 回转寿司', emoji: '🍣', cuisine: '回转寿司', perPersonCost: '¥1,100',
              budgetLevel: 1, signatureDishes: ['金枪鱼', '玉子'], reservationNeeded: false,
              highlight: '人均一百出头，快又稳，省下的钱留给晚餐。', tags: ['平价', '快'], swapReason: 'save',
            }) as any,
          ],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '6min', distance: '450m', note: '穿过新京极商店街' },
            alternatives: [],
          }],
        },
        {
          id: 'b1-3', type: 'sight', startTime: '13:30', endTime: '15:30', status: 'planned',
          primary: opt({
            id: 'o-tofukuji', name: '东福寺 · 通天桥', emoji: '🍁', address: '东山区本町15丁目778',
            openHours: '08:30–16:00', ticketPrice: '¥1,000', suggestedDuration: '2 小时',
            highlight: '通天桥下两千株枫树，赏枫季的绝对主角。',
            tags: ['赏枫名所', '旺季限定'],
          }) as any,
          alternatives: [
            opt({
              id: 'o-sennyuji', name: '泉涌寺 御座所庭园', emoji: '🍂', openHours: '09:00–16:30', ticketPrice: '¥500',
              suggestedDuration: '1.5 小时', highlight: '皇室香火寺，红叶安静、几乎没有人挤。',
              tags: ['小众', '清净'], swapReason: 'closed',
            }) as any,
          ],
          transportToNext: [{
            primary: { mode: 'bus', cost: '¥230', duration: '22min', distance: '5.8km', note: '207路 → 清水道下车' },
            alternatives: [{ mode: 'taxi', cost: '¥1700', duration: '15min', distance: '6km', note: '两人均摊不算贵' }],
          }],
        },
        {
          id: 'b1-4', type: 'sight', startTime: '16:10', endTime: '17:40', status: 'planned',
          primary: opt({
            id: 'o-kiyomizu', name: '清水寺 + 二三年坂', emoji: '📸', address: '东山区清水1丁目294',
            openHours: '06:00–18:00', ticketPrice: '¥400', suggestedDuration: '1.5 小时',
            highlight: '黄昏的清水舞台俯瞰整座京都，回程石板坂道最好逛。',
            tags: ['黄昏最美', '必拍', '好逛'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '10min', distance: '750m', note: '沿宁宁之道散步下山' },
            alternatives: [],
          }],
        },
        {
          id: 'b1-5', type: 'meal', startTime: '18:30', endTime: '20:00', status: 'planned',
          primary: opt({
            id: 'o-kaiseki', name: '祇园 · 怀石晚膳', emoji: '🍶', address: '东山区祇园町南侧',
            cuisine: '京怀石', perPersonCost: '¥9,800', budgetLevel: 3,
            signatureDishes: ['先付八寸', '土瓶蒸', '炙烤金目鲷'], reservationNeeded: true,
            highlight: '一顿仪式感满满的京都之夜，建议提前两周订。',
            tags: ['仪式感', '需预订'],
          }) as any,
          alternatives: [
            opt({
              id: 'o-ramen', name: '猪一 鸡白汤拉面', emoji: '🍜', cuisine: '拉面', perPersonCost: '¥1,400',
              budgetLevel: 1, signatureDishes: ['鸡白汤拉面', '鲷鱼饭团'], reservationNeeded: false,
              highlight: '米其林必比登拉面，暖呼呼一碗，预算友好。', tags: ['必比登', '平价'], swapReason: 'save',
            }) as any,
          ],
          transportToNext: [{
            primary: { mode: 'taxi', cost: '¥1200', duration: '10min', distance: '3km', note: '夜间走路也行，约 25 分钟' },
            alternatives: [{ mode: 'walk', cost: '免费', duration: '25min', distance: '2km', note: '沿鸭川夜色散步' }],
          }],
        },
        {
          id: 'b1-6', type: 'rest', startTime: '20:30', endTime: '次日', status: 'planned',
          primary: opt({
            id: 'o-machiya', name: '鸭川町家旅宿', emoji: '🏮', address: '下京区木屋町通',
            pricePerNight: '¥2,400', rating: 4.7, checkIn: '15:00', checkOut: '11:00',
            amenities: ['近鸭川', '榻榻米', '免费早餐', '步行到先斗町'],
            highlight: '改造町家，木窗外就是鸭川，京都味十足。',
            tags: ['町家', '近鸭川'],
          }) as any,
          alternatives: [],
          transportToNext: [],
        },
      ],
    },
    {
      id: 'd2', dateLabel: '11/15', weekday: '周六', weatherHint: '小雨', weatherIcon: '🌧️', temperature: 12, subtitle: '岚山 · 金阁寺',
      blocks: [
        {
          id: 'b2-1', type: 'sight', startTime: '09:00', endTime: '11:00', status: 'planned',
          primary: opt({
            id: 'o-arashiyama', name: '岚山竹林 + 渡月桥', emoji: '🎋', address: '右京区嵯峨',
            openHours: '全天开放', ticketPrice: '免费', suggestedDuration: '2 小时',
            highlight: '竹林小径与渡月桥，秋色里最上镜的散步道。',
            tags: ['散步', '必拍', '户外'],
          }) as any,
          alternatives: [
            opt({
              id: 'o-fukuda', name: '福田美术馆', emoji: '🖼️', openHours: '10:00–17:00', ticketPrice: '¥1,500',
              suggestedDuration: '1.5 小时', highlight: '临渡月桥的精致美术馆，下雨天躲进来看画看河景。',
              tags: ['室内', '看河景'], swapReason: 'rain',
            }) as any,
          ],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '8min', distance: '600m', note: '竹林尽头即天龙寺北门' },
            alternatives: [],
          }],
        },
        {
          id: 'b2-2', type: 'sight', startTime: '11:15', endTime: '12:30', status: 'planned',
          primary: opt({
            id: 'o-tenryuji', name: '天龙寺 曹源池庭园', emoji: '🍁', address: '右京区嵯峨天龙寺芒之马场町',
            openHours: '08:30–17:00', ticketPrice: '¥800', suggestedDuration: '1.25 小时',
            highlight: '世界遗产庭园，借景岚山的池泉回游式庭院。',
            tags: ['世界遗产', '庭园'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '5min', distance: '350m', note: '门口就是嵯峨豆腐街' },
            alternatives: [],
          }],
        },
        {
          id: 'b2-3', type: 'meal', startTime: '12:45', endTime: '13:45', status: 'planned',
          primary: opt({
            id: 'o-yudofu', name: '嵯峨 汤豆腐', emoji: '🍲', address: '右京区嵯峨天龙寺',
            cuisine: '京豆腐料理', perPersonCost: '¥2,800', budgetLevel: 2,
            signatureDishes: ['招牌汤豆腐', '胡麻豆腐', '天妇罗'], reservationNeeded: false,
            highlight: '雨天里一锅热腾腾的汤豆腐，暖到心里。',
            tags: ['暖食', '雨天友好'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'train', cost: '¥240', duration: '30min', distance: '9km', note: '嵯峨岚山站 → 圆町，换巴士' },
            alternatives: [{ mode: 'taxi', cost: '¥2600', duration: '22min', distance: '11km', note: '雨天直达更舒服' }],
          }],
        },
        {
          id: 'b2-4', type: 'sight', startTime: '14:30', endTime: '16:30', status: 'planned',
          primary: opt({
            id: 'o-kinkakuji', name: '金阁寺', emoji: '🏯', address: '北区金阁寺町1',
            openHours: '09:00–17:00', ticketPrice: '¥500', suggestedDuration: '1.5 小时',
            highlight: '金箔楼阁倒映镜湖池，配上红叶是教科书级画面。',
            tags: ['世界遗产', '必看', '户外'],
          }) as any,
          alternatives: [
            opt({
              id: 'o-museum', name: '京都国立博物馆', emoji: '🏛️', openHours: '09:30–17:00', ticketPrice: '¥700',
              suggestedDuration: '2 小时', highlight: '全室内，雨天看国宝特展，慢慢逛不淋雨。',
              tags: ['室内', '看展'], swapReason: 'rain',
            }) as any,
          ],
          transportToNext: [{
            primary: { mode: 'bus', cost: '¥230', duration: '35min', distance: '7km', note: '市巴士 → 四条河原町，可能拥挤' },
            alternatives: [{ mode: 'subway', cost: '¥260', duration: '28min', distance: '8km', note: '地铁更准时' }],
          }],
        },
        {
          id: 'b2-5', type: 'free', startTime: '17:00', endTime: '18:15', status: 'planned',
          primary: opt({
            id: 'o-nishiki', name: '锦市场 边走边吃', emoji: '🛍️', address: '中京区锦小路通',
            openHours: '10:00–18:00', suggestedDuration: '1.25 小时',
            highlight: '京都的厨房，豆乳甜甜圈、玉子烧、抹茶一路吃过去。',
            tags: ['小吃', '好逛', '有顶棚'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '7min', distance: '500m', note: '走到先斗町一带' },
            alternatives: [],
          }],
        },
        {
          id: 'b2-6', type: 'meal', startTime: '19:00', endTime: '20:30', status: 'planned',
          primary: opt({
            id: 'o-izakaya', name: '先斗町 居酒屋', emoji: '🏮', address: '中京区先斗町通',
            cuisine: '居酒屋', perPersonCost: '¥4,500', budgetLevel: 2,
            signatureDishes: ['炭烤鸡串', '出汁玉子烧', '鸭川纳凉床清酒'], reservationNeeded: true,
            highlight: '窄巷里的灯笼与河风，京都夜晚的正确打开方式。',
            tags: ['夜景', '气氛好'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '9min', distance: '700m', note: '沿木屋町回旅宿' },
            alternatives: [],
          }],
        },
        {
          id: 'b2-7', type: 'rest', startTime: '20:40', endTime: '次日', status: 'planned',
          primary: opt({
            id: 'o-machiya2', name: '鸭川町家旅宿', emoji: '🏮', address: '下京区木屋町通',
            pricePerNight: '¥2,400', rating: 4.7, checkIn: '15:00', checkOut: '11:00',
            amenities: ['近鸭川', '榻榻米', '免费早餐'],
            highlight: '连住第二晚，熟门熟路。', tags: ['连住'],
          }) as any,
          alternatives: [],
          transportToNext: [],
        },
      ],
    },
    {
      id: 'd3', dateLabel: '11/16', weekday: '周日', weatherHint: '晴', weatherIcon: '☀️', temperature: 16, subtitle: '大原 · 哲学之道',
      blocks: [
        {
          id: 'b3-1', type: 'sight', startTime: '09:00', endTime: '11:30', status: 'planned',
          primary: opt({
            id: 'o-ohara', name: '大原 三千院', emoji: '🍁', address: '左京区大原来迎院町540',
            openHours: '09:00–17:00', ticketPrice: '¥700', suggestedDuration: '2.5 小时',
            highlight: '京都北郊的山间古寺，苔庭与红叶安静得像一幅画。',
            tags: ['远离人群', '苔庭', '山里'],
          }) as any,
          alternatives: [
            opt({
              id: 'o-shisendo', name: '诗仙堂', emoji: '🍂', openHours: '09:00–17:00', ticketPrice: '¥700',
              suggestedDuration: '1.25 小时', highlight: '离市区近得多，省下来回两小时车程。',
              tags: ['省时', '近市区'], swapReason: 'time',
            }) as any,
          ],
          transportToNext: [{
            primary: { mode: 'bus', cost: '¥390', duration: '45min', distance: '16km', note: '大原 → 出町柳，山路班次较少' },
            alternatives: [{ mode: 'taxi', cost: '¥4200', duration: '32min', distance: '17km', note: '山路打车偏贵' }],
          }],
        },
        {
          id: 'b3-2', type: 'meal', startTime: '12:30', endTime: '13:30', status: 'planned',
          primary: opt({
            id: 'o-demachi', name: '出町ふたば 豆饼 + 茶屋', emoji: '🍡', address: '上京区出町今出川',
            cuisine: '和果子 / 轻食', perPersonCost: '¥1,200', budgetLevel: 1,
            signatureDishes: ['名代豆饼', '抹茶白玉'], reservationNeeded: false,
            highlight: '百年豆饼现买现吃，配一碗茶解腻。', tags: ['排队名物', '平价'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '12min', distance: '900m', note: '过鸭川三角洲跳石' },
            alternatives: [],
          }],
        },
        {
          id: 'b3-3', type: 'sight', startTime: '14:00', endTime: '16:00', status: 'planned',
          primary: opt({
            id: 'o-ginkakuji', name: '银阁寺 + 哲学之道', emoji: '🍁', address: '左京区银阁寺町2',
            openHours: '08:30–17:00', ticketPrice: '¥500', suggestedDuration: '2 小时',
            highlight: '从银阁寺沿哲学之道一路红叶到南禅寺，秋日散步神级路线。',
            tags: ['散步', '赏枫', '拍照'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '30min', distance: '2km', note: '哲学之道散步过去' },
            alternatives: [{ mode: 'bus', cost: '¥230', duration: '12min', distance: '2.5km', note: '脚累就坐车' }],
          }],
        },
        {
          id: 'b3-4', type: 'sight', startTime: '16:40', endTime: '17:40', status: 'planned',
          primary: opt({
            id: 'o-nanzenji', name: '南禅寺 水路阁', emoji: '🧱', address: '左京区南禅寺福地町',
            openHours: '08:40–17:00', ticketPrice: '免费(境内)', suggestedDuration: '1 小时',
            highlight: '红砖水路阁配红叶，明治时代的浪漫遗构。',
            tags: ['免费', '复古', '必拍'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'subway', cost: '¥220', duration: '15min', distance: '3.5km', note: '蹴上站 → 三条' },
            alternatives: [],
          }],
        },
        {
          id: 'b3-5', type: 'meal', startTime: '18:30', endTime: '20:00', status: 'planned',
          primary: opt({
            id: 'o-okonomi', name: '三条 御好烧铁板烧', emoji: '🥘', address: '中京区三条通',
            cuisine: '铁板烧', perPersonCost: '¥2,600', budgetLevel: 2,
            signatureDishes: ['豚玉御好烧', '炒面', '葱烧'], reservationNeeded: false,
            highlight: '自己动手铁板上煎，热热闹闹收尾这一天。', tags: ['热闹', '自助煎'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '10min', distance: '750m', note: '散步回旅宿' },
            alternatives: [],
          }],
        },
        {
          id: 'b3-6', type: 'rest', startTime: '20:10', endTime: '次日', status: 'planned',
          primary: opt({
            id: 'o-machiya3', name: '鸭川町家旅宿', emoji: '🏮', pricePerNight: '¥2,400', rating: 4.7,
            checkIn: '15:00', checkOut: '11:00', amenities: ['近鸭川', '榻榻米'], highlight: '连住第三晚。', tags: ['连住'],
          }) as any,
          alternatives: [],
          transportToNext: [],
        },
      ],
    },
    {
      id: 'd4', dateLabel: '11/17', weekday: '周一', weatherHint: '晴转阴', weatherIcon: '🌤️', temperature: 14, subtitle: '二条 · 宇治',
      blocks: [
        {
          id: 'b4-1', type: 'sight', startTime: '09:30', endTime: '11:00', status: 'planned',
          primary: opt({
            id: 'o-nijo', name: '二条城', emoji: '🏯', address: '中京区二条通堀川西入',
            openHours: '08:45–16:00', ticketPrice: '¥1,300', suggestedDuration: '1.5 小时',
            highlight: '德川将军的京都行宫，会唱歌的莺鸣地板很有意思。',
            tags: ['世界遗产', '历史'],
          }) as any,
          alternatives: [
            opt({
              id: 'o-shinsen', name: '神泉苑 + 二条商圈', emoji: '🌿', openHours: '07:00–20:00', ticketPrice: '免费',
              suggestedDuration: '45 分钟', highlight: '周一二条城若闭馆，旁边的神泉苑小巧免费。',
              tags: ['免费', '备用'], swapReason: 'closed',
            }) as any,
          ],
          transportToNext: [{
            primary: { mode: 'subway', cost: '¥260', duration: '18min', distance: '5km', note: '东西线 → 乌丸御池换乘' },
            alternatives: [],
          }],
        },
        {
          id: 'b4-2', type: 'meal', startTime: '11:30', endTime: '12:30', status: 'planned',
          primary: opt({
            id: 'o-obanzai', name: '乌丸 京风家常菜 (obanzai)', emoji: '🍚', address: '中京区乌丸通',
            cuisine: '京家常菜', perPersonCost: '¥1,800', budgetLevel: 1,
            signatureDishes: ['每日小钵拼盘', '鲑鱼茶泡饭'], reservationNeeded: false,
            highlight: '一格格小钵的京都家常味，清爽不贵。', tags: ['健康', '平价'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'train', cost: '¥410', duration: '40min', distance: '15km', note: 'JR → 宇治站' },
            alternatives: [{ mode: 'taxi', cost: '¥4800', duration: '30min', distance: '17km', note: '太贵，不推荐' }],
          }],
        },
        {
          id: 'b4-3', type: 'sight', startTime: '13:30', endTime: '16:00', status: 'planned',
          primary: opt({
            id: 'o-byodoin', name: '宇治 平等院 + 宇治川', emoji: '🪙', address: '宇治市宇治莲华116',
            openHours: '08:30–17:30', ticketPrice: '¥600', suggestedDuration: '2.5 小时',
            highlight: '十円硬币上的凤凰堂本尊，配宇治川红叶与抹茶街。',
            tags: ['世界遗产', '抹茶', '出片'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'train', cost: '¥410', duration: '40min', distance: '15km', note: 'JR 宇治 → 京都站' },
            alternatives: [],
          }],
        },
        {
          id: 'b4-4', type: 'meal', startTime: '17:30', endTime: '19:00', status: 'planned',
          primary: opt({
            id: 'o-kyotostation', name: '京都站 拉面小路', emoji: '🍜', address: '下京区京都站10F',
            cuisine: '拉面', perPersonCost: '¥1,500', budgetLevel: 1,
            signatureDishes: ['各地名店拉面', '煎饺'], reservationNeeded: false,
            highlight: '全日本人气拉面集合，配站顶夜景刚刚好。', tags: ['夜景', '方便'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '8min', distance: '500m', note: '站内步行到空中走廊' },
            alternatives: [],
          }],
        },
        {
          id: 'b4-5', type: 'free', startTime: '19:15', endTime: '20:15', status: 'planned',
          primary: opt({
            id: 'o-kyototower', name: '京都塔 + 站前夜景', emoji: '🗼', address: '下京区乌丸通七条',
            openHours: '10:00–21:00', ticketPrice: '¥900', suggestedDuration: '1 小时',
            highlight: '登塔俯瞰夜色，给古都之行收个干净的尾。', tags: ['夜景', '登高'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '12min', distance: '900m', note: '走回旅宿收行李' },
            alternatives: [],
          }],
        },
        {
          id: 'b4-6', type: 'rest', startTime: '20:30', endTime: '次日', status: 'planned',
          primary: opt({
            id: 'o-machiya4', name: '鸭川町家旅宿', emoji: '🏮', pricePerNight: '¥2,400', rating: 4.7,
            checkIn: '15:00', checkOut: '11:00', amenities: ['近鸭川', '榻榻米', '近京都站'], highlight: '最后一晚，收拾行李。', tags: ['连住'],
          }) as any,
          alternatives: [],
          transportToNext: [],
        },
      ],
    },
    {
      id: 'd5', dateLabel: '11/18', weekday: '周二', weatherHint: '晴', weatherIcon: '☀️', temperature: 17, subtitle: '告别京都',
      blocks: [
        {
          id: 'b5-1', type: 'rest', startTime: '08:30', endTime: '09:30', status: 'planned',
          primary: opt({
            id: 'o-checkout', name: '退房 + 寄存行李', emoji: '🧳', address: '下京区木屋町通',
            pricePerNight: '—', rating: 4.7, checkIn: '—', checkOut: '11:00',
            amenities: ['前台寄存', '整理战利品'], highlight: '把行李寄前台，轻装逛最后半天。', tags: ['退房'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'subway', cost: '¥220', duration: '12min', distance: '3km', note: '乌丸线 → 今出川' },
            alternatives: [],
          }],
        },
        {
          id: 'b5-2', type: 'free', startTime: '10:00', endTime: '11:30', status: 'planned',
          primary: opt({
            id: 'o-teramachi', name: '寺町 + 一保堂 买手信', emoji: '🍵', address: '中京区寺町通二条',
            openHours: '10:00–18:00', suggestedDuration: '1.5 小时',
            highlight: '百年茶铺挑抹茶礼盒，文具杂货街扫最后的手信。', tags: ['手信', '茶叶', '文具'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'walk', cost: '免费', duration: '10min', distance: '750m', note: '走到二条城旁咖啡馆' },
            alternatives: [],
          }],
        },
        {
          id: 'b5-3', type: 'meal', startTime: '11:45', endTime: '12:45', status: 'planned',
          primary: opt({
            id: 'o-cafe', name: '% Arabica 咖啡 + 早午餐', emoji: '☕', address: '东山区 / 二条',
            cuisine: '咖啡 / 轻食', perPersonCost: '¥1,600', budgetLevel: 1,
            signatureDishes: ['拿铁', '京都限定甜点'], reservationNeeded: false,
            highlight: '临行前一杯京都名物咖啡，慢慢告别。', tags: ['人气', '出片'],
          }) as any,
          alternatives: [],
          transportToNext: [{
            primary: { mode: 'taxi', cost: '¥1300', duration: '12min', distance: '3.5km', note: '回旅宿取行李' },
            alternatives: [],
          }],
        },
        {
          id: 'b5-4', type: 'transport', startTime: '13:30', endTime: '14:30', status: 'planned',
          primary: opt({
            id: 'o-haruka', name: '取行李 → 关西机场', emoji: '🚆', address: '京都站 → KIX',
            suggestedDuration: '75 分钟',
            highlight: '搭 Haruka 特急直达关西机场，京都的秋天到此结束。', tags: ['返程', '需提前购票'],
          }) as any,
          alternatives: [],
          transportToNext: [],
        },
      ],
    },
  ],
}
