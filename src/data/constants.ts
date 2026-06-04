import type { BlockType, TransportMode, SwapReason, Mode } from '@/types'

export const TYPE_META: Record<BlockType, { zh: string; color: string; soft: string; emoji: string }> = {
  sight:     { zh: '观光', color: '#FF8A4C', soft: 'rgba(255,138,76,.12)', emoji: '📸' },
  meal:      { zh: '餐饮', color: '#F5A300', soft: 'rgba(245,163,0,.12)', emoji: '🍜' },
  rest:      { zh: '住宿', color: '#15B8A6', soft: 'rgba(21,184,166,.12)', emoji: '🛏️' },
  transport: { zh: '交通', color: '#4C7DFF', soft: 'rgba(76,125,255,.12)', emoji: '🚆' },
  free:      { zh: '自由', color: '#A66BFF', soft: 'rgba(166,107,255,.12)', emoji: '🛍️' },
}

export const TRANSPORT_META: Record<TransportMode, { zh: string; emoji: string }> = {
  walk:   { zh: '步行', emoji: '🚶' },
  subway: { zh: '地铁', emoji: '🚇' },
  bus:    { zh: '巴士', emoji: '🚌' },
  taxi:   { zh: '打车', emoji: '🚕' },
  train:  { zh: '电车', emoji: '🚆' },
  flight: { zh: '飞机', emoji: '✈️' },
  bike:   { zh: '骑行', emoji: '🚲' },
}

export const SCENARIO_META: Record<SwapReason, { zh: string; emoji: string; color: string }> = {
  rain:   { zh: '雨天备选', emoji: '☔', color: '#4C7DFF' },
  save:   { zh: '平价备选', emoji: '💰', color: '#F5A300' },
  time:   { zh: '时间紧备选', emoji: '🕒', color: '#FF6B5C' },
  closed: { zh: '闭馆替代', emoji: '🔒', color: '#A66BFF' },
  like:   { zh: '想换换', emoji: '❤️', color: '#FF8A4C' },
}

export const MODES: { id: Mode; zh: string; emoji: string }[] = [
  { id: 'plan',    zh: '规划', emoji: '✏️' },
  { id: 'view',    zh: '查看', emoji: '👀' },
  { id: 'execute', zh: '执行', emoji: '🧭' },
  { id: 'share',   zh: '分享', emoji: '💌' },
]

export const WEATHER_PRESETS: { id: string; zh: string; emoji: string }[] = [
  { id: 'sunny',       zh: '晴',       emoji: '☀️' },
  { id: 'sunny-cloudy', zh: '晴转多云', emoji: '🌤️' },
  { id: 'cloudy',      zh: '多云',     emoji: '⛅' },
  { id: 'overcast',    zh: '阴',       emoji: '☁️' },
  { id: 'light-rain',  zh: '小雨',     emoji: '🌧️' },
  { id: 'rain',        zh: '雨',       emoji: '🌧️' },
  { id: 'heavy-rain',  zh: '大雨',     emoji: '⛈️' },
  { id: 'thunder',     zh: '雷阵雨',   emoji: '⛈️' },
  { id: 'snow',        zh: '雪',       emoji: '❄️' },
  { id: 'wind',        zh: '大风',     emoji: '💨' },
  { id: 'fog',         zh: '雾',       emoji: '🌫️' },
]

export const SCALE = 1.32

export interface EmojiCategory { id: string; zh: string; emojis: string[] }

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  { id: 'weather', zh: '天气', emojis: ['☀️','🌤️','⛅','☁️','🌧️','⛈️','🌦️','❄️','💨','🌫️','🌈','🌙','⭐','🔥','☔'] },
  { id: 'food', zh: '餐饮', emojis: ['🍜','🍱','🍣','🍲','🍚','🥘','🍡','🍶','☕','🍵','🧋','🍰','🍩','🥐','🍺','🥂','🍳','🥗','🍝','🥩'] },
  { id: 'transport', zh: '交通', emojis: ['🚶','🚇','🚌','🚕','🚆','✈️','🚲','🚄','🚢','🚗','🛵','🚠','🚁','🚊','🚎','🛴'] },
  { id: 'sight', zh: '景点', emojis: ['📸','⛩️','🏯','🍁','🏮','🗼','🏛️','🖼️','🎋','🧱','🪙','🎎','🏔️','🌊','🌸','🏘️','🎢','🎡'] },
  { id: 'hotel', zh: '住宿', emojis: ['🛏️','🏨','🏠','🛖','⛺','🏡','🏰','🛌','🏕️'] },
  { id: 'activity', zh: '活动', emojis: ['🛍️','🎉','🎭','🎨','🚴','🛶','🎤','🎪','🧘','♨️','⛷️','🎣','🏊','🧗'] },
  { id: 'faces', zh: '表情', emojis: ['😊','😎','🤩','😴','🥳','😋','🤗','🥰','😌','😅','😤','😢'] },
  { id: 'other', zh: '其他', emojis: ['✨','❤️','💡','📍','📌','🎁','💎','✅','❌','🔔','📋','🏷️','🧳','🎒','📱','💰','⏰'] },
]

export const APP_VERSION = '1.0.0'
