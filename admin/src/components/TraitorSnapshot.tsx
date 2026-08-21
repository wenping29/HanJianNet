import type { TraitorSnapshot } from '../types'
import { formatLifeSpan } from '../lib/format'

function Field({
  label,
  value,
  changed,
}: {
  label: string
  value: React.ReactNode
  changed?: boolean
}) {
  return (
    <div className={`flex gap-2 text-sm ${changed ? 'rounded-sm bg-bronze/15 px-2 py-1 ring-1 ring-bronze/50' : ''}`}>
      <dt className="shrink-0 text-paperdim">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-paper/90">{value || '—'}</dd>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 border-l-2 border-cinnabar/70 pl-2 text-xs tracking-[0.25em] text-cinnabarlight">{title}</h4>
      {children}
    </section>
  )
}

export default function TraitorSnapshot({
  data,
  changedFields,
}: {
  data: TraitorSnapshot
  changedFields?: ReadonlySet<string>
}) {
  const ch = (k: string) => changedFields?.has(k) ?? false
  const photos = data.attachments.filter((a) => a.kind === 'photo')
  const evidences = data.attachments.filter((a) => a.kind === 'evidence')

  return (
    <div className="space-y-5">
      <Block title="基本信息">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          <Field label="姓名" value={data.name} changed={ch('name')} />
          <Field label="字 / 号" value={[data.courtesyName && `字：${data.courtesyName}`, data.pseudonym && `号：${data.pseudonym}`].filter(Boolean).join('　')} changed={ch('courtesyName') || ch('pseudonym')} />
          <Field label="生卒" value={formatLifeSpan(data.birthYear, data.deathYear, data.birthYearType, data.deathYearType)} changed={ch('birthYear') || ch('deathYear')} />
          <Field label="籍贯" value={data.nativePlace} changed={ch('nativePlace')} />
          <Field label="时期" value={data.period} changed={ch('period')} />
          <Field label="派系" value={data.faction} changed={ch('faction')} />
          <Field label="别名" value={data.aliases.join('、')} changed={ch('aliases')} />
          <Field label="身份标签" value={data.identityTags.join('、')} changed={ch('identityTags')} />
        </dl>
      </Block>

      {(ch('summary') || data.summary) && (
        <Block title="人物概述">
          <p className={`whitespace-pre-wrap text-sm leading-relaxed text-paper/85 ${ch('summary') ? 'rounded-sm bg-bronze/15 p-2 ring-1 ring-bronze/50' : ''}`}>
            {data.summary || '—'}
          </p>
        </Block>
      )}

      {data.lifeEvents.length > 0 && (
        <Block title="生平时间线">
          <ol className="space-y-1.5">
            {[...data.lifeEvents]
              .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
              .map((ev, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-12 shrink-0 font-garamond text-bronzelight">{ev.year ?? '不详'}</span>
                  <span className="text-paper/85">{ev.event}</span>
                </li>
              ))}
          </ol>
        </Block>
      )}

      {data.crimeRecords.length > 0 && (
        <Block title="犯罪记录">
          <ul className="space-y-2">
            {data.crimeRecords.map((c, i) => (
              <li key={i} className="card p-3">
                <p className="text-sm font-semibold tracking-wider text-cinnabarlight">
                  <span className="mr-2 font-garamond text-bronzelight">{c.year ?? '不详'}</span>
                  {c.title}
                </p>
                {c.process && <p className="mt-1 text-xs leading-relaxed text-paperdim">经过：{c.process}</p>}
                {c.harm && <p className="mt-1 text-xs leading-relaxed text-paperdim">危害：{c.harm}</p>}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {(data.spouses.length > 0 || data.children.length > 0 || data.residences.length > 0) && (
        <Block title="家族与居住">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            <Field label="配偶" value={data.spouses.map((s) => s.name + (s.remark ? `（${s.remark}）` : '')).join('、')} />
            <Field label="子女" value={data.children.map((c) => c.name).join('、')} />
            <Field label="居住地" value={data.residences.map((r) => r.place).join('、')} />
          </dl>
        </Block>
      )}

      {(photos.length > 0 || evidences.length > 0) && (
        <Block title="照片与罪证">
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-sm border border-paperedge/20">
                <img src={p.url} alt={p.caption ?? ''} className="h-full w-full object-cover" />
              </a>
            ))}
            {evidences.map((ev) => (
              <a
                key={ev.id}
                href={ev.url}
                target="_blank"
                rel="noreferrer"
                className="badge border-paperedge/30 py-1.5 text-xs text-paperdim hover:border-bronzelight hover:text-paper"
              >
                罪证 · {ev.caption || ev.fileType || '附件'}
              </a>
            ))}
          </div>
        </Block>
      )}

      {data.sources.length > 0 && (
        <Block title="史料来源">
          <ol className="space-y-1">
            {data.sources.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="font-garamond text-bronzelight">[{i + 1}]</span>
                <span className="flex-1 text-paper/85">{s.citation}</span>
                {typeof s.credibility === 'number' && (
                  <span className="shrink-0 font-garamond text-xs text-bronzelight">
                    {'★'.repeat(s.credibility)}
                    {'☆'.repeat(5 - s.credibility)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Block>
      )}
    </div>
  )
}
