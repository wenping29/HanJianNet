import { Link } from 'react-router-dom'
import { CRITERIA } from '../components/DefinitionDrawer'

export default function About() {
  return (
    <div className="container-page max-w-4xl py-12">
      <h1 className="section-title">
        <span className="text-xl font-semibold tracking-[0.25em] text-paper">关于本馆</span>
        <span className="font-garamond text-xs italic text-bronzelight">ABOUT THE ARCHIVES</span>
      </h1>

      <section className="card mt-8 p-6 md:p-8">
        <h2 className="tracking-[0.2em] text-cinnabarlight">编纂说明</h2>
        <div className="mt-4 space-y-3 text-sm leading-loose text-paper/85">
          <p>
            本馆为近代汉奸史料档案的公众编纂项目，立场鲜明：记载变节者之名与行，保存史料、以史为鉴。
            收录范围以近代以来（宋末、明末、清末、民国及其他时期）符合认定标准的变节人物为主。
          </p>
          <p>
            收录原则：以公开史料为据，述而不作；每份档案须经后台审核后方可发布；所有修改留痕可溯，
            公众可在每份档案的"修改历史"中查看修改人、修改时间、修改内容与审核记录。
          </p>
        </div>
      </section>

      <section className="card mt-6 p-6 md:p-8">
        <h2 className="tracking-[0.2em] text-cinnabarlight">汉奸认定五项标准</h2>
        <ol className="mt-5 space-y-4">
          {CRITERIA.map((c, i) => (
            <li key={c.title} className="flex gap-4">
              <span className="font-song text-xl font-bold leading-none text-bronze">{['壹', '贰', '叁', '肆', '伍'][i]}</span>
              <div>
                <h3 className="tracking-widest text-paper">{c.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-paperdim">{c.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card mt-6 p-6 md:p-8">
        <h2 className="tracking-[0.2em] text-cinnabarlight">统计方法论</h2>
        <div className="mt-4 space-y-3 text-sm leading-loose text-paper/85">
          <p>
            首页统计看板数据来源于已发布档案的结构化字段：汉奸总数为已发布档案数量；
            被判刑总数指犯罪记录中有明确审判或刑罚结论的人数；子女信息数与后代现状数分别统计
            已录入的子女名单条目及去向明确的条目。
          </p>
          <p>统计口径随档案增补动态更新，更新机制为审核通过后即时生效。</p>
        </div>
      </section>

      <section className="card mt-6 border-cinnabar/30 p-6 md:p-8">
        <h2 className="tracking-[0.2em] text-cinnabarlight">免责声明</h2>
        <div className="mt-4 space-y-3 text-sm leading-loose text-paper/85">
          <p>
            本馆内容依据公开史料整理编纂，仅供历史研究与教育使用。引用史料均标注出处，
            如认为档案内容存在错误或侵犯合法权益，可通过提交修订流程提出，经审核后更正。
          </p>
          <p>用户提交的内容由提交人负责，经审核发布后视为本馆收录史料；转载请注明出处。</p>
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-paperdim">
        愿以此册，铭刻国耻，
        <Link to="/" className="ml-1 text-bronzelight underline underline-offset-4 hover:text-paper">
          返回首页
        </Link>
      </p>
    </div>
  )
}
