import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addCustomEvent, ERA_PERIOD_MAP } from '../lib/historyEvents'
import type { HistoryEvent } from '../lib/historyEvents'
import { splitList } from '../lib/format'

type Era = HistoryEvent['era']
const ERA_OPTIONS: Era[] = ['宋末', '明末', '清末', '抗日']

interface FormState {
  title: string
  year: string
  era: Era
  alias: string
  desc: string
  keywords: string
}

const INITIAL: FormState = {
  title: '',
  year: '',
  era: '抗日',
  alias: '',
  desc: '',
  keywords: '',
}

export default function HistoryEventForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [error, setError] = useState('')

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const title = form.title.trim()
    const yearNum = Number(form.year)
    const desc = form.desc.trim()

    if (!title) {
      setError('请输入事件名称')
      return
    }
    if (!form.year || Number.isNaN(yearNum)) {
      setError('请输入有效年份')
      return
    }
    if (!desc) {
      setError('请输入事件描述')
      return
    }

    const event = addCustomEvent({
      title,
      year: yearNum,
      era: form.era,
      period: ERA_PERIOD_MAP[form.era],
      alias: form.alias.trim() || undefined,
      desc,
      keywords: splitList(form.keywords),
    })

    navigate(`/events/${event.id}`)
  }

  const inputCls = 'input'
  const labelCls = 'label'

  return (
    <div className="container-page max-w-2xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">
          <span className="text-xl font-semibold tracking-[0.25em] text-paper">新增历史事件</span>
          <span className="font-garamond text-xs italic text-bronzelight">NEW EVENT</span>
        </h1>
        <Link to="/events" className="text-xs tracking-widest text-bronzelight underline underline-offset-4 hover:text-paper">
          ← 返回列表
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        {/* 事件名称 */}
        <div>
          <label className={labelCls} htmlFor="ev-title">事件名称 *</label>
          <input
            id="ev-title"
            className={inputCls}
            placeholder="如：九一八事变"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        {/* 年份 + 时期 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="ev-year">年份 *</label>
            <input
              id="ev-year"
              className={`${inputCls} font-garamond`}
              type="number"
              placeholder="如 1937"
              value={form.year}
              onChange={(e) => update('year', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ev-era">时期 *</label>
            <select
              id="ev-era"
              className={inputCls}
              value={form.era}
              onChange={(e) => update('era', e.target.value as Era)}
            >
              {ERA_OPTIONS.map((era) => (
                <option key={era} value={era}>{era}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 又称 */}
        <div>
          <label className={labelCls} htmlFor="ev-alias">又称（可选）</label>
          <input
            id="ev-alias"
            className={inputCls}
            placeholder="如：918事变"
            value={form.alias}
            onChange={(e) => update('alias', e.target.value)}
          />
        </div>

        {/* 事件描述 */}
        <div>
          <label className={labelCls} htmlFor="ev-desc">事件描述 *</label>
          <textarea
            id="ev-desc"
            className={`${inputCls} min-h-32 resize-y leading-loose`}
            placeholder="详述事件本末，标其年月、记其始末……"
            value={form.desc}
            onChange={(e) => update('desc', e.target.value)}
          />
        </div>

        {/* 关联关键词 */}
        <div>
          <label className={labelCls} htmlFor="ev-keywords">关联汉奸关键词（可选）</label>
          <input
            id="ev-keywords"
            className={inputCls}
            placeholder="多个关键词以逗号分隔，如：九一八, 柳条湖, 沈阳"
            value={form.keywords}
            onChange={(e) => update('keywords', e.target.value)}
          />
          <p className="mt-1.5 text-xs tracking-wider text-paperdim/60">
            用于在事件详情页匹配涉及该事件的汉奸档案
          </p>
        </div>

        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-2.5 text-sm text-cinnabarlight">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-paperedge/10 pt-4">
          <Link to="/events" className="btn-ghost !px-5 !py-2.5">
            取消
          </Link>
          <button type="submit" className="btn-primary !px-6 !py-2.5">
            保 存
          </button>
        </div>
      </form>
    </div>
  )
}
