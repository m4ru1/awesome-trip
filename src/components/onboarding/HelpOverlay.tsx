interface Props {
  onClose: () => void
}

const sections = [
  {
    title: '每张卡片你可以这样玩',
    items: [
      { icon: '👆', text: '点一下打开详情，看全部信息和备选' },
      { icon: '➕', text: '加一项行程，按时间自动插入排序' },
      { icon: '✏️', text: '编辑名称、时间、类型等所有字段' },
      { icon: '⠿', text: '长按拖动可以重排顺序，时间自动重算' },
      { icon: '🚶', text: '两站之间可以设置交通方式和耗时' },
    ],
  },
  {
    title: '四种模式',
    items: [
      { icon: '✏️', text: '规划：全功能编辑，增删改查随便来' },
      { icon: '👀', text: '查看：只读浏览，不会误触改东西' },
      { icon: '🧭', text: '执行：模拟现在几点，打卡 / 跳过' },
      { icon: '💌', text: '分享：干净的明信片风格，可以转发' },
    ],
  },
  {
    title: '想换个方案？给它存备选',
    items: [
      { icon: '🅱️', text: '每个景点 / 餐厅都能加几个备选方案' },
      { icon: '☔', text: 'Plan B 按场景一键切换（雨天、省钱、省时间）' },
      { icon: '💰', text: '切换后自动对比花费和时间差异' },
    ],
  },
  {
    title: '管理整个计划',
    items: [
      { icon: '📅', text: '点标题可以增删天数、改行程名称' },
      { icon: '💻', text: '桌面端显示课程表网格，跨天拖动' },
    ],
  },
]

export default function HelpOverlay({ onClose }: Props) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-5" style={{ background: 'rgba(43,45,51,.5)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div className="float-in w-full max-w-[540px] overflow-hidden rounded-3xl bg-white" style={{ boxShadow: '0 24px 60px rgba(43,45,51,.34)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)' }}>
          <h2 className="title-cn m-0 text-2xl">把行程当课程表来排</h2>
          <div className="mt-1 text-sm opacity-90">拖拖拽拽，排好你的京都赏枫之旅</div>
        </div>

        {/* Body */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          {sections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-4' : ''}>
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-brand" />
                <span className="text-sm font-bold text-ink">{section.title}</span>
              </div>
              <div className="mt-2 grid gap-2">
                {section.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-2 text-[13px]">
                    <span className="mt-0.5 text-base">{item.icon}</span>
                    <span className="text-ink2">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-line px-6 py-3">
          <div className="mb-2 text-center text-xs text-ink3">顶栏 ? 可随时再看本说明</div>
          <button onClick={onClose} className="btn btn-primary w-full justify-center text-base">开始规划 →</button>
        </div>
      </div>
    </div>
  )
}
