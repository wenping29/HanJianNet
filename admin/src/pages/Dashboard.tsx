import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { DashboardOverview, LoginTrendPoint } from '../types'

const DAY_OPTIONS = [7, 14, 30] as const

/** 秒数格式化为「3天4小时」这类时长文案 */
function formatDuration(seconds: number, t: (k: string) => string): string {
  const total = Math.max(0, Math.floor(seconds))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (d > 0) return `${d}${t('dashboard.unitDay')}${h}${t('dashboard.unitHour')}`
  if (h > 0) return `${h}${t('dashboard.unitHour')}${m}${t('dashboard.unitMin')}`
  if (m > 0) return `${m}${t('dashboard.unitMin')}${s}${t('dashboard.unitSec')}`
  return `${s}${t('dashboard.unitSec')}`
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-paperedge/10 py-2 last:border-0">
      <span className="shrink-0 text-xs tracking-widest text-paperdim/70">{label}</span>
      <span className="min-w-0 break-all text-right font-garamond text-sm text-paper">{value}</span>
    </div>
  )
}

function StatusCard({
  title,
  badge,
  badgeOk,
  children,
}: {
  title: string
  badge: string
  badgeOk: boolean
  children: ReactNode
}) {
  return (
    <section className="card animate-fade-up p-5">
      <header className="flex items-center justify-between gap-3 border-b border-paperedge/15 pb-3">
        <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">{title}</h2>
        <span
          className={`badge ${
            badgeOk
              ? 'border-bronze/60 bg-bronze/15 text-bronzelight'
              : 'border-cinnabar/60 bg-cinnabar/15 text-cinnabarlight'
          }`}
        >
          {badge}
        </span>
      </header>
      <div className="mt-1">{children}</div>
    </section>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [trend, setTrend] = useState<LoginTrendPoint[]>([])
  const [days, setDays] = useState<number>(14)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    Promise.all([api.dashboardOverview(), api.loginTrend(14)])
      .then(([ov, tr]) => {
        if (!alive) return
        setOverview(ov)
        setTrend(tr.items)
      })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : t('common.loadFailed'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [t])

  // 切换天数只重新拉趋势，不重载整页
  const changeDays = useCallback(
    async (d: number) => {
      setDays(d)
      setError('')
      try {
        const r = await api.loginTrend(d)
        setTrend(r.items)
      } catch (e) {
        setError(e instanceof Error ? e.message : t('common.loadFailed'))
      }
    },
    [t],
  )

  const server = overview?.server
  const database = overview?.database
  const counts = overview?.counts

  const statCards = counts
    ? [
        { label: t('dashboard.traitorCount'), value: counts.traitorCount },
        { label: t('dashboard.visitorCount'), value: counts.visitorCount },
        { label: t('dashboard.pageViewCount'), value: counts.pageViewCount },
        { label: t('dashboard.userCount'), value: counts.userCount },
        { label: t('dashboard.activeUserCount'), value: counts.activeUserCount },
        { label: t('dashboard.queryCount'), value: counts.queryCount },
      ]
    : []

  return (
    <div className="container-page py-0">
      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">{t('common.loading')}</div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* 服务器 / 数据库状态 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <StatusCard
              title={t('dashboard.serverStatus')}
              badge={server?.environment ?? '—'}
              badgeOk
            >
              <InfoRow label={t('dashboard.machineName')} value={server?.machineName ?? '—'} />
              <InfoRow label={t('dashboard.os')} value={server?.osDescription ?? '—'} />
              <InfoRow label={t('dashboard.framework')} value={server?.framework ?? '—'} />
              <InfoRow
                label={t('dashboard.cpuCores')}
                value={server ? String(server.processorCount) : '—'}
              />
              <InfoRow
                label={t('dashboard.memory')}
                value={server ? `${server.workingSetMb} MB` : '—'}
              />
              <InfoRow
                label={t('dashboard.managedMemory')}
                value={server ? `${server.managedMemoryMb} MB` : '—'}
              />
              <InfoRow
                label={t('dashboard.uptime')}
                value={
                  server?.uptimeSeconds != null ? formatDuration(server.uptimeSeconds, t) : '—'
                }
              />
              <InfoRow label={t('dashboard.startedAt')} value={formatDateTime(server?.startedAt)} />
              <InfoRow
                label={t('dashboard.osUptime')}
                value={server ? formatDuration(server.osUptimeSeconds, t) : '—'}
              />
            </StatusCard>

            <StatusCard
              title={t('dashboard.databaseStatus')}
              badge={database?.connected ? t('dashboard.normal') : t('dashboard.abnormal')}
              badgeOk={!!database?.connected}
            >
              <InfoRow label={t('dashboard.dbProvider')} value={database?.provider ?? '—'} />
              <InfoRow label={t('dashboard.dbName')} value={database?.databaseName ?? '—'} />
              <InfoRow label={t('dashboard.dbVersion')} value={database?.serverVersion ?? '—'} />
              <InfoRow
                label={t('dashboard.dbLatency')}
                value={database?.latencyMs != null ? `${database.latencyMs} ms` : '—'}
              />
            </StatusCard>
          </div>

          {/* 指标卡 */}
          {counts && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {statCards.map((c) => (
                <div key={c.label} className="card animate-fade-up p-4">
                  <p className="text-xs tracking-widest text-paperdim">{c.label}</p>
                  <p className="mt-2 font-garamond text-3xl font-semibold text-paper">
                    {c.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 每日登录用户趋势 */}
          <section className="card animate-fade-up p-5">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-paperedge/15 pb-3">
              <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">
                {t('dashboard.dailyLoginTitle')}
              </h2>
              <div className="flex items-center gap-2">
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => changeDays(d)}
                    className={`rounded-sm border px-3 py-1.5 text-xs transition ${
                      days === d
                        ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight'
                        : 'border-paperedge/25 text-paperdim hover:border-bronzelight hover:text-paper'
                    }`}
                  >
                    {t('dashboard.days', { count: d })}
                  </button>
                ))}
              </div>
            </header>

            <div className="mt-4 h-[280px] w-full">
              {trend.length === 0 ? (
                <p className="py-20 text-center text-paperdim/60">{t('dashboard.noTrendData')}</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
                    <CartesianGrid stroke="#2B2620" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      stroke="#C9BFA6"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis stroke="#C9BFA6" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#171310',
                        border: '1px solid #8C6B3A',
                        color: '#F2EAD8',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name={t('dashboard.dailyLoginTitle')}
                      stroke="#C04A3A"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#B9975B' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
