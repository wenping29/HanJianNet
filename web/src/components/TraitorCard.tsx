import { Link } from 'react-router-dom'
import type { TraitorSummary } from '../types'
import { formatLifeSpan } from '../lib/format'

export default function TraitorCard({ traitor }: { traitor: TraitorSummary }) {
  return (
    <Link
      to={`/traitor/${traitor.id}`}
      className="card group block overflow-hidden transition hover:-translate-y-1 hover:border-bronze/50"
    >
      <div className="flex h-36 items-center justify-center overflow-hidden border-b border-paperedge/10 bg-gradient-to-br from-inksoft to-ink">
        {traitor.photoUrl ? (
          <img
            src={traitor.photoUrl}
            alt={traitor.name}
            className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
          />
        ) : (
          <span className="font-song text-5xl font-bold text-paperedge/20 transition group-hover:text-cinnabar/40">
            {traitor.name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold tracking-widest text-paper group-hover:text-cinnabarlight">
            {traitor.name}
          </h3>
          <span className="badge shrink-0 border-bronze/60 bg-bronze/15 text-bronzelight">{traitor.period}</span>
        </div>
        <p className="mt-1 font-garamond text-sm text-paperdim">{formatLifeSpan(
          traitor.birthYear,
          traitor.deathYear,
          traitor.birthYearType,
          traitor.deathYearType,
        )}</p>
        <p className="mt-2 truncate text-xs tracking-wider text-paperdim/80">
          {traitor.faction || '—'}
        </p>
        {traitor.identityTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {traitor.identityTags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge border-paperedge/25 text-paperdim/80">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
