import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const CRITERIA_KEYS = [
  { titleKey: 'definition.betrayal', textKey: 'definition.betrayalDesc' },
  { titleKey: 'definition.puppetOffice', textKey: 'definition.puppetOfficeDesc' },
  { titleKey: 'definition.aidEnemy', textKey: 'definition.aidEnemyDesc' },
  { titleKey: 'definition.harmCompatriots', textKey: 'definition.harmCompatriotsDesc' },
  { titleKey: 'definition.traitorPropaganda', textKey: 'definition.traitorPropagandaDesc' },
]

const NUMERALS = ['壹', '贰', '叁', '肆', '伍']

export default function DefinitionDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
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
            <h2 className="text-lg font-semibold tracking-[0.3em] text-paper">{t('definition.title')}</h2>
            <p className="mt-1 font-garamond text-xs italic text-bronzelight">Criteria of Collaborationism</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-paperedge/30 text-paperdim hover:border-cinnabar hover:text-cinnabarlight"
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>
        <ol className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {CRITERIA_KEYS.map((c, i) => (
            <li key={c.titleKey} className="card flex gap-4 p-4">
              <span className="font-song text-2xl font-bold leading-none text-cinnabar">
                {NUMERALS[i]}
              </span>
              <div>
                <h3 className="tracking-widest text-paper">{t(c.titleKey)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-paperdim">{t(c.textKey)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-paperedge/15 px-6 py-4 text-xs leading-relaxed text-paperdim/70">
          {t('definition.integrityNote')}<Link to="/about" className="mx-1 text-bronzelight underline underline-offset-4">{t('definition.aboutLink')}</Link>。
        </div>
      </aside>
    </>
  )
}

export { CRITERIA_KEYS as CRITERIA }
