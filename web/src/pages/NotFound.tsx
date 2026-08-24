import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="ink-hero flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="font-garamond text-7xl font-semibold text-paperedge/20">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-[0.3em] text-paper">卷宗未寻获</h1>
      <p className="mt-3 text-sm text-paperdim">您访问的页面不存在或已被移除。</p>
      <Link to="/" className="btn-primary mt-8">
        返回首页
      </Link>
    </div>
  )
}
