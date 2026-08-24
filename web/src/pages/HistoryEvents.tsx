import { useMemo, useState } from 'react'

interface HistoryEvent {
  year: number
  era: '宋末' | '明末' | '清末' | '抗日'
  title: string
  alias?: string
  desc: string
}

// 历史上重大的变节与国难事件（按年序排列）
const EVENTS: HistoryEvent[] = [
  {
    year: 1279,
    era: '宋末',
    title: '崖山之战',
    alias: '张世杰灭宋崖山之战',
    desc: '南宋祥兴二年，元将张弘范率水师围攻崖山。宋将张世杰力战二十余日，终因寡不敌众，水师全歼。丞相陆秀夫负少帝赵昺投海殉国，随行军民十余万赴死，宋祚断绝——华夏全境首次沦于异族之手。',
  },
  {
    year: 1644,
    era: '明末',
    title: '甲申国难',
    desc: '明崇祯十七年甲申，李自成率大顺军攻陷北京，崇祯帝自缢于煤山，明廷倾覆。旋即辽东总兵吴三桂开关迎敌，引清军入关击败大顺军，神州易主，入关清军随即推行剃发易服之令。',
  },
  {
    year: 1645,
    era: '明末',
    title: '扬州十日',
    desc: '清豫亲王多铎挥师南下克扬州，史可法死节。城破后清军屠城十日，据《扬州十日记》所载，死者逾八十万，尸骨山积，血流成渠。',
  },
  {
    year: 1645,
    era: '明末',
    title: '嘉定三屠',
    desc: '清廷强颁剃发令，嘉定军民三次起兵抗清，朱瑛、侯峒曾、吴之藩等先后举义。清军三次破城屠戮，死难者无算，是为"嘉定三屠"。',
  },
  {
    year: 1662,
    era: '明末',
    title: '吴三桂弑永历',
    alias: '吴三桂杀南明皇帝',
    desc: '明末降将吴三桂率清兵入缅，执南明永历帝朱由榔，绞杀于昆明篦子坡。南明覆亡，明祚尽绝，汉奸之祸延及亡国之君。',
  },
  {
    year: 1931,
    era: '抗日',
    title: '九一八事变',
    alias: '918事变',
    desc: '日军关东军自炸南满铁路柳条湖段，反诬中国军队所为，藉机炮轰沈阳北大营。东北军奉不抵抗之令撤入关内，未及数月，东北三省百万平方公里国土沦陷敌手。',
  },
  {
    year: 1937,
    era: '抗日',
    title: '七七事变',
    desc: '日军在卢沟桥附近进行所谓"夜间演习"，借口一名士兵失踪，向中国守军第二十九军发动进攻。中国军队奋起还击，全面抗战由此爆发，中华民族进入八年浴血之岁月。',
  },
  {
    year: 1937,
    era: '抗日',
    title: '淞沪会战',
    alias: '淞沪抗战',
    desc: '日军大举进攻上海，中国军队倾精锐之师血战淞沪三月，粉碎其"三月亡华"之妄想。此役中国军人伤亡逾三十万，为抗战初期规模最大、最为惨烈之会战。',
  },
  {
    year: 1937,
    era: '抗日',
    title: '南京大屠杀',
    desc: '日军攻陷南京后，进行长达六周有组织之大屠杀、淫掠与焚毁。据战后南京军事法庭与远东国际军事法庭判定，遇难同胞逾三十万，为近代东亚最为骇人听闻之屠城惨案。',
  },
]

const ERAS = ['全部', '宋末', '明末', '清末', '抗日'] as const

export default function HistoryEvents() {
  const [activeEra, setActiveEra] = useState<string>('全部')

  const items = useMemo(() => {
    if (activeEra === '全部') return EVENTS
    return EVENTS.filter((e) => e.era === activeEra)
  }, [activeEra])

  return (
    <div>
      {/* 页面标题区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div className="container-page animate-ink-in flex flex-col items-center py-20 text-center md:py-24">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">HISTORICAL EVENTS</p>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            历史事件
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            列举近代重大国难与变节事件，标其年月、记其本末——鉴往知来，勿忘国耻。
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        {/* 时期切换 */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {ERAS.map((era) => (
              <button
                key={era}
                type="button"
                onClick={() => setActiveEra(era)}
                className={`badge cursor-pointer ${
                  activeEra === era
                    ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight'
                    : 'border-paperedge/25 text-paperdim hover:border-bronzelight'
                }`}
              >
                {era}
              </button>
            ))}
          </div>
          <span className="text-xs tracking-wider text-paperdim/70">共 {items.length} 条事件</span>
        </div>

        {/* 事件卡片 */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {items.map((ev) => (
            <article
              key={`${ev.year}-${ev.title}`}
              className="card animate-fade-up flex flex-col p-6"
            >
              <div className="flex items-baseline justify-between gap-3 border-b border-paperedge/10 pb-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-garamond text-3xl font-semibold text-cinnabarlight">{ev.year}</span>
                  <h2 className="font-song text-xl font-bold tracking-wide text-paper">{ev.title}</h2>
                </div>
                <span className="badge border-bronze/40 text-bronzelight">{ev.era}</span>
              </div>
              {ev.alias && ev.alias !== ev.title && (
                <p className="mt-2 text-xs tracking-widest text-paperdim/70">又称：{ev.alias}</p>
              )}
              <p className="mt-3 text-sm leading-loose text-paper/85">{ev.desc}</p>
            </article>
          ))}
        </div>

        {items.length === 0 && (
          <p className="py-16 text-center text-paperdim">该时期暂无事件记录</p>
        )}
      </section>
    </div>
  )
}
