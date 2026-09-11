import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { addCustomEvent } from '../lib/historyEvents'
import { ApiError } from '../lib/api'
import { splitList, PERIODS, periodLabel } from '../lib/format'
import type { Period } from '../types'

const ERA_OPTIONS: Period[] = [...PERIODS]

interface FormState {
  title: string
  year: string
  era: Period
  alias: string
  desc: string
  keywords: string
}

const INITIAL: FormState = {
  title: '',
  year: '',
  era: PERIODS[0],
  alias: '',
  desc: '',
  keywords: '',
}

export default function HistoryEventForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const title = form.title.trim()
    const desc = form.desc.trim()
    const yearNum = form.year.trim() === '' ? null : Number(form.year)

    if (!title) {
      setError(t('eventForm.nameRequired'))
      return
    }
    if (form.year.trim() !== '' && Number.isNaN(yearNum)) {
      setError(t('eventForm.yearInvalid'))
      return
    }
    if (!desc) {
      setError(t('eventForm.descRequired'))
      return
    }

    setSubmitting(true)
    try {
      const created = await addCustomEvent({
        name: title,
        alias: form.alias.trim() || undefined,
        year: yearNum,
        era: form.era,
        province: '',
        city: '',
        location: '',
        personCount: 0,
        isGeneral: false,
        summary: desc,
        keywords: splitList(form.keywords),
      })
      navigate(`/events/${created.id}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t('eventForm.loginRequired'))
      } else {
        setError(err instanceof Error ? err.message : t('eventForm.submitFailed'))
      }
      setSubmitting(false)
    }
  }

  const inputCls = 'input'
  const labelCls = 'label'

  return (
    <div className="container-page max-w-2xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">
          <span className="text-xl font-semibold tracking-[0.25em] text-paper">{t('eventForm.createTitle')}</span>
          <span className="font-garamond text-xs italic text-bronzelight">NEW EVENT</span>
        </h1>
        <Link to="/events" className="text-xs tracking-widest text-bronzelight underline underline-offset-4 hover:text-paper">
          {t('eventForm.backToList')}
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        {/* 事件名称 */}
        <div>
          <label className={labelCls} htmlFor="ev-title">{t('eventForm.eventName')}</label>
          <input
            id="ev-title"
            className={inputCls}
            placeholder={t('eventForm.eventNamePlaceholder')}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        {/* 年份 + 时期 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="ev-year">{t('eventForm.year')}</label>
            <input
              id="ev-year"
              className={`${inputCls} font-garamond`}
              type="number"
              placeholder={t('eventForm.yearPlaceholder')}
              value={form.year}
              onChange={(e) => update('year', e.target.value)}
            />
            <p className="mt-1.5 text-xs tracking-wider text-paperdim/60">{t('eventForm.yearOptionalHint')}</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="ev-era">{t('eventForm.period')}</label>
            <select
              id="ev-era"
              className={inputCls}
              value={form.era}
              onChange={(e) => update('era', e.target.value as Period)}
            >
              {ERA_OPTIONS.map((era) => (
                <option key={era} value={era}>{periodLabel(era, t)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 又称 */}
        <div>
          <label className={labelCls} htmlFor="ev-alias">{t('eventForm.alias')}</label>
          <input
            id="ev-alias"
            className={inputCls}
            placeholder={t('eventForm.aliasPlaceholder')}
            value={form.alias}
            onChange={(e) => update('alias', e.target.value)}
          />
        </div>

        {/* 事件描述 */}
        <div>
          <label className={labelCls} htmlFor="ev-desc">{t('eventForm.description')}</label>
          <textarea
            id="ev-desc"
            className={`${inputCls} min-h-32 resize-y leading-loose`}
            placeholder={t('eventForm.descriptionPlaceholder')}
            value={form.desc}
            onChange={(e) => update('desc', e.target.value)}
          />
        </div>

        {/* 关联关键词 */}
        <div>
          <label className={labelCls} htmlFor="ev-keywords">{t('eventForm.keywords')}</label>
          <input
            id="ev-keywords"
            className={inputCls}
            placeholder={t('eventForm.keywordsPlaceholder')}
            value={form.keywords}
            onChange={(e) => update('keywords', e.target.value)}
          />
          <p className="mt-1.5 text-xs tracking-wider text-paperdim/60">
            {t('eventForm.keywordHint')}
          </p>
        </div>

        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-2.5 text-sm text-cinnabarlight">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-paperedge/10 pt-4">
          <Link to="/events" className="btn-ghost !px-5 !py-2.5">
            {t('eventForm.cancel')}
          </Link>
          <button type="submit" className="btn-primary !px-6 !py-2.5" disabled={submitting}>
            {submitting ? t('eventForm.saving') : t('eventForm.saveBtn')}
          </button>
        </div>
      </form>
    </div>
  )
}