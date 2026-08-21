import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-garamond text-6xl font-semibold text-paperedge/20">404</p>
      <h1 className="mt-4 text-xl font-bold tracking-[0.3em] text-paper">页面不存在</h1>
      <Link to="/reviews" className="btn-ghost mt-8">
        返回待审队列
      </Link>
    </div>
  )
}
