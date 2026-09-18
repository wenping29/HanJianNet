import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'

export default function Contact() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', contact: '', title: '', content: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setDone(false)
    setBusy(true)
    try {
      await api.submitContact(form)
      setForm({ name: '', contact: '', title: '', content: '' })
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contact.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="section-title">
        <span className="text-xl font-semibold tracking-[0.25em] text-paper">{t('contact.title')}</span>
        <span className="font-garamond text-xs italic text-bronzelight">CONTACT THE ARCHIVE</span>
      </h1>

      <div className="card mt-8 p-6 text-sm leading-loose text-paper/85">
        <p>{t('contact.intro')}</p>
      </div>

      {done && (
        <div className="mt-6 rounded-sm border border-bamboo bg-bamboo/15 px-4 py-3 text-sm text-bamboolight">
          {t('contact.success')}
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="card animate-fade-up mt-6 space-y-5 p-6 md:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="contact-name">{t('contact.name')}</label>
            <input
              id="contact-name"
              className="input"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              maxLength={64}
              placeholder={t('contact.namePlaceholder')}
            />
          </div>
          <div>
            <label className="label" htmlFor="contact-method">{t('contact.contactMethod')}</label>
            <input
              id="contact-method"
              className="input"
              value={form.contact}
              onChange={(e) => update('contact', e.target.value)}
              required
              maxLength={200}
              placeholder={t('contact.contactPlaceholder')}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="contact-title">{t('contact.subject')}</label>
          <input
            id="contact-title"
            className="input"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
            maxLength={200}
            placeholder={t('contact.subjectPlaceholder')}
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-content">{t('contact.content')}</label>
          <textarea
            id="contact-content"
            className="input min-h-40 resize-y"
            value={form.content}
            onChange={(e) => update('content', e.target.value)}
            required
            maxLength={5000}
            placeholder={t('contact.contentPlaceholder')}
          />
        </div>
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
          {busy ? t('contact.submitting') : t('contact.submit')}
        </button>
        <p className="text-xs leading-relaxed tracking-wider text-paperdim/60">{t('contact.privacyNote')}</p>
      </form>
    </div>
  )
}