import { Link } from 'react-router-dom'

const CRITERIA: Array<{ title: string; text: string }> = [
  {
    title: '投敌变节',
    text: '在国家对外战争或民族危亡之际，主动投靠侵略者，背叛国家与民族根本利益。',
  },
  {
    title: '充任伪职',
    text: '在侵略者扶植的伪政权、伪组织中担任职务，协助其维持统治、签发政令。',
  },
  {
    title: '资敌助战',
    text: '为侵略者提供情报、物资、经费、人力等支持，直接或间接协助其军事行动。',
  },
  {
    title: '残害同胞',
    text: '参与镇压爱国力量，告发、逮捕、刑讯、屠杀抗日志士与无辜民众。',
  },
  {
    title: '卖国宣传',
    text: '进行卖国投降宣传，散布亡国论调，瓦解抗战意志，美化侵略行径。',
  },
]

export default function DefinitionDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-bronze/40 bg-inkcard shadow-card transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-paperedge/15 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-[0.3em] text-paper">汉奸定义标准</h2>
            <p className="mt-1 font-garamond text-xs italic text-bronzelight">Criteria of Collaborationism</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-paperedge/30 text-paperdim hover:border-cinnabar hover:text-cinnabarlight"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        <ol className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {CRITERIA.map((c, i) => (
            <li key={c.title} className="card flex gap-4 p-4">
              <span className="font-song text-2xl font-bold leading-none text-cinnabar">
                {['壹', '贰', '叁', '肆', '伍'][i]}
              </span>
              <div>
                <h3 className="tracking-widest text-paper">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-paperdim">{c.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-paperedge/15 px-6 py-4 text-xs leading-relaxed text-paperdim/70">
          认定以史料为据，须经后台审核后收录。详见<Link to="/about" className="mx-1 text-bronzelight underline underline-offset-4">关于页</Link>。
        </div>
      </aside>
    </>
  )
}

export { CRITERIA }
