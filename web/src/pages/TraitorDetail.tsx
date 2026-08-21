import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Lightbox from '../components/Lightbox'
import { api } from '../lib/api'
import { formatLifeSpan, formatYear } from '../lib/format'
import { useAuth } from '../stores/auth'
import type { Traitor, TraitorSummary } from '../types'

function Section({ title, en, children }: { title: string; en: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="section-title">
        <span className="text-lg font-semibold tracking-[0.25em] text-paper">{title}</span>
        <span className="font-garamond text-xs italic text-bronzelight">{en}</span>
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-paperdim/60">{text}</p>
}

export default function TraitorDetail() {
  const { id } = useParams<{ id: string }>()
  const user = useAuth((s) => s.user)
  const [traitor, setTraitor] = useState<Traitor | null>(null)
  const [related, setRelated] = useState<TraitorSummary[]>([])
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setTraitor(null)
    setError('')
    api
      .getTraitor(id)
      .then(async (data) => {
        setTraitor(data.traitor)
        if (data.traitor.relatedIds.length > 0) {
          try {
            const all = await api.listTraitors()
            setRelated(all.items.filter((t) => data.traitor.relatedIds.includes(t.id)))
          } catch {
            setRelated([])
          }
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
  }, [id])

  if (error)
    return (
      <div className="container-page py-24 text-center">
        <p className="text-cinnabarlight">{error}</p>
        <Link to="/" className="btn-ghost mt-6">
          返回首页
        </Link>
      </div>
    )
  if (!traitor) return <div className="container-page py-24 text-center text-paperdim">加载中…</div>

  const photos = traitor.attachments.filter((a) => a.kind === 'photo')
  const evidences = traitor.attachments.filter((a) => a.kind === 'evidence')

  return (
    <div className="container-page py-10">
      {/* 人物头部 */}
      <header className="card animate-fade-up flex flex-col gap-6 p-6 md:flex-row md:p-8">
        <div className="flex h-56 w-full shrink-0 items-center justify-center overflow-hidden rounded-sm border border-paperedge/15 bg-inksoft md:w-44">
          {photos[0] ? (
            <img src={photos[0].url} alt={traitor.name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-song text-7xl font-bold text-paperedge/20">{traitor.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-[0.2em] text-paper">{traitor.name}</h1>
            <span className="badge border-cinnabar/70 bg-cinnabar/15 text-cinnabarlight">{traitor.period}</span>
            {traitor.faction && <span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">{traitor.faction}</span>}
          </div>
          {(traitor.courtesyName || traitor.pseudonym) && (
            <p className="mt-2 text-sm tracking-widest text-paperdim">
              {traitor.courtesyName && <span className="mr-4">字：{traitor.courtesyName}</span>}
              {traitor.pseudonym && <span>号：{traitor.pseudonym}</span>}
            </p>
          )}
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="shrink-0 text-paperdim">生卒：</dt>
              <dd className="font-garamond text-paper/90">
                {formatLifeSpan(traitor.birthYear, traitor.deathYear, traitor.birthYearType, traitor.deathYearType)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-paperdim">籍贯：</dt>
              <dd className="text-paper/90">{traitor.nativePlace || '—'}</dd>
            </div>
            {traitor.aliases.length > 0 && (
              <div className="flex gap-2 sm:col-span-2">
                <dt className="shrink-0 text-paperdim">别名：</dt>
                <dd className="text-paper/90">{traitor.aliases.join('、')}</dd>
              </div>
            )}
          </dl>
          {traitor.identityTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {traitor.identityTags.map((tag) => (
                <span key={tag} className="badge border-paperedge/25 text-paperdim">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/traitor/${traitor.id}/history`} className="btn-bronze">
              修改历史
            </Link>
            {user && (
              <Link to={`/traitor/${traitor.id}/edit`} className="btn-primary">
                编辑此档案
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 摘要 */}
      <Section title="人物概述" en="SUMMARY">
        <p className="card p-6 leading-loose text-paper/90">{traitor.summary || '暂无概述'}</p>
      </Section>

      {/* 生平时间线 */}
      {traitor.lifeEvents.length > 0 && (
        <Section title="生平时间线" en="CHRONOLOGY">
          <ol className="relative ml-2 space-y-6 border-l border-cinnabar/40 pl-6">
            {[...traitor.lifeEvents]
              .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
              .map((ev, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-cinnabar bg-ink" />
                  <p className="font-garamond text-base font-semibold text-bronzelight">{formatYear(ev.year, 'exact')}</p>
                  <p className="mt-1 text-sm leading-relaxed text-paper/90">{ev.event}</p>
                  {ev.sourceRef && <p className="mt-1 text-xs text-paperdim/60">出处：{ev.sourceRef}</p>}
                </li>
              ))}
          </ol>
        </Section>
      )}

      {/* 犯罪记录 */}
      <Section title="犯罪记录" en="CRIMINAL RECORDS">
        {traitor.crimeRecords.length === 0 ? (
          <Empty text="暂无犯罪记录" />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {traitor.crimeRecords.map((c, i) => (
              <article key={i} className="card p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold tracking-wider text-cinnabarlight">{c.title}</h3>
                  <span className="font-garamond text-lg text-bronzelight">{c.year ?? '不详'}</span>
                </div>
                {c.process && (
                  <p className="mt-3 text-sm leading-relaxed text-paper/85">
                    <span className="mr-2 badge border-paperedge/25 text-paperdim/80">经过</span>
                    {c.process}
                  </p>
                )}
                {c.harm && (
                  <p className="mt-2 text-sm leading-relaxed text-paper/85">
                    <span className="mr-2 badge border-cinnabar/40 text-cinnabarlight/90">危害</span>
                    {c.harm}
                  </p>
                )}
                {c.sourceRef && <p className="mt-3 text-xs text-paperdim/60">史料出处：{c.sourceRef}</p>}
              </article>
            ))}
          </div>
        )}
      </Section>

      {/* 家族 */}
      <Section title="配偶信息" en="SPOUSES">
        {traitor.spouses.length === 0 ? (
          <Empty text="暂无记录" />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {traitor.spouses.map((s, i) => (
              <li key={i} className="card flex items-baseline gap-3 px-4 py-3">
                <span className="font-semibold tracking-widest text-paper">{s.name}</span>
                {s.remark && <span className="truncate text-xs text-paperdim">{s.remark}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="子女信息" en="CHILDREN">
        {traitor.children.length === 0 ? (
          <Empty text="暂无记录" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-old">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>性别</th>
                  <th>去向</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {traitor.children.map((c, i) => (
                  <tr key={i}>
                    <td>{c.name}</td>
                    <td>{c.gender || '—'}</td>
                    <td>{c.whereabouts || '—'}</td>
                    <td>{c.remark || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* 居住地 */}
      <Section title="居住地变迁" en="RESIDENCES">
        {traitor.residences.length === 0 ? (
          <Empty text="暂无记录" />
        ) : (
          <ol className="relative ml-2 space-y-5 border-l border-bronze/50 pl-6">
            {traitor.residences.map((r, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bronze bg-ink" />
                <p className="tracking-widest text-paper">
                  {r.place}
                  {r.period && <span className="ml-3 font-garamond text-sm text-bronzelight">{r.period}</span>}
                </p>
                {r.remark && <p className="mt-1 text-xs text-paperdim">{r.remark}</p>}
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* 照片 */}
      {photos.length > 0 && (
        <Section title="人物照片" en="PHOTOGRAPHS">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLightbox(p.url)}
                className="group block overflow-hidden rounded-sm border border-paperedge/15"
              >
                <img src={p.url} alt={p.caption ?? ''} className="aspect-square w-full object-cover transition group-hover:scale-105" />
                {p.caption && <span className="block truncate bg-inkcard px-2 py-1.5 text-xs text-paperdim">{p.caption}</span>}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* 罪证 */}
      {evidences.length > 0 && (
        <Section title="罪证材料" en="EVIDENCE">
          <ul className="space-y-3">
            {evidences.map((ev) => (
              <li key={ev.id} className="card flex items-center gap-4 p-4">
                {ev.fileType.startsWith('image') ? (
                  <img src={ev.url} alt="" className="h-14 w-14 shrink-0 rounded-sm object-cover" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-paperedge/20 font-garamond text-xl text-bronzelight">
                    文
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-paper">{ev.caption || '罪证材料'}</p>
                  <p className="mt-0.5 font-garamond text-xs text-paperdim/70">{ev.fileType}</p>
                </div>
                <a href={ev.url} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1.5 text-xs">
                  查看
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 史料来源 */}
      <Section title="史料来源" en="REFERENCES">
        {traitor.sources.length === 0 ? (
          <Empty text="暂无记录" />
        ) : (
          <ol className="space-y-2">
            {traitor.sources.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="font-garamond text-bronzelight">[{i + 1}]</span>
                <span className="flex-1 leading-relaxed text-paper/85">{s.citation}</span>
                {typeof s.credibility === 'number' && (
                  <span className="shrink-0 font-garamond text-xs text-bronzelight" title={`可信度 ${s.credibility}/5`}>
                    {'★'.repeat(s.credibility)}
                    {'☆'.repeat(5 - s.credibility)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* 相关人物 */}
      {related.length > 0 && (
        <Section title="相关人物" en="RELATED FIGURES">
          <div className="flex flex-wrap gap-3">
            {related.map((t) => (
              <Link
                key={t.id}
                to={`/traitor/${t.id}`}
                className="badge border-paperedge/30 py-1.5 text-sm text-paperdim hover:border-cinnabar hover:text-cinnabarlight"
              >
                {t.name}
                <span className="ml-2 text-xs text-bronzelight">{t.period}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
    </div>
  )
}
