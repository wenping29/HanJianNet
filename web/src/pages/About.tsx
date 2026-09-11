import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CRITERIA } from '../components/DefinitionDrawer'

const NUMERALS = ['壹', '贰', '叁', '肆', '伍']

export default function About() {
  const { t } = useTranslation()
  return (
    <div className="container-page max-w-4xl py-12">
      <h1 className="section-title">
        <span className="text-xl font-semibold tracking-[0.25em] text-paper">{t('about.title')}</span>
        <span className="font-garamond text-xs italic text-bronzelight">ABOUT THE ARCHIVES</span>
      </h1>

      <section className="card mt-8 p-6 md:p-8">
        <h2 className="tracking-[0.2em] text-cinnabarlight">{t('about.compilation')}</h2>
        <div className="mt-4 space-y-3 text-sm leading-loose text-paper/85">
          <p>
            {t('about.compilationText1')}
          </p>
          <p>
            {t('about.compilationText2')}
          </p>
        </div>
      </section>

      <section className="card mt-6 p-6 md:p-8">
        <h2 className="tracking-[0.2em] text-cinnabarlight">{t('about.criteria')}</h2>
        <ol className="mt-5 space-y-4">
          {CRITERIA.map((c: { titleKey: string; textKey: string }, i: number) => (
            <li key={c.titleKey} className="flex gap-4">
              <span className="font-song text-xl font-bold leading-none text-bronze">{NUMERALS[i]}</span>
              <div>
                <h3 className="tracking-widest text-paper">{t(c.titleKey)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-paperdim">{t(c.textKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card mt-6 p-6 md:p-8">
        <h2 className="tracking-[0.2em] text-cinnabarlight">{t('about.methodology')}</h2>
        <div className="mt-4 space-y-3 text-sm leading-loose text-paper/85">
          <p>
            {t('about.methodologyText1')}
          </p>
          <p>{t('about.methodologyText2')}</p>
        </div>
      </section>

      <section className="card mt-6 border-cinnabar/30 p-6 md:p-8">
        <h2 className="tracking-[0.2em] text-cinnabarlight">{t('about.disclaimer')}</h2>
        <div className="mt-4 space-y-3 text-sm leading-loose text-paper/85">
          <p>
            {t('about.disclaimerText1')}
          </p>
          <p>{t('about.disclaimerText2')}</p>
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-paperdim">
        {t('about.closing')}
        <Link to="/" className="ml-1 text-bronzelight underline underline-offset-4 hover:text-paper">
          {t('about.returnHome')}
        </Link>
      </p>
    </div>
  )
}
