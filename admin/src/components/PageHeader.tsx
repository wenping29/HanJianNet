import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** 主标题（中文） */
  title: string
  /** 英文副标题 */
  subtitle?: string
  /** 右侧操作区（按钮组等） */
  actions?: ReactNode
  /** 标题下方内容（描述文字、筛选栏等） */
  children?: ReactNode
}

export default function PageHeader({ title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <header className="animate-fade-up border-b border-paperedge/15 pb-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-[0.25em] text-paper">{title}</h1>
          {subtitle && (
            <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </header>
  )
}
