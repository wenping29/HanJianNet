import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as echarts from 'echarts'
import { api } from '../lib/api'
import { matchProvince, fullProvinceName } from '../lib/provinces'
import type { TraitorSummary } from '../types'
import { containerPageStyle } from '../style'

const CHINA_GEOJSON_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json'

export default function TraitorMap() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ province: string; count: number }[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // 并行获取地图 GeoJSON + 汉奸数据
        const [geoJson, traitorRes] = await Promise.all([
          fetch(CHINA_GEOJSON_URL).then((r) => r.json()),
          api.listTraitors({}),
        ])

        if (cancelled) return

        const traitors: TraitorSummary[] = traitorRes.items

        // 按省份统计
        const counts = new Map<string, number>()
        for (const t of traitors) {
          const prov = matchProvince(t.nativePlace)
          if (prov) {
            counts.set(prov, (counts.get(prov) ?? 0) + 1)
          }
        }

        const sortedStats = [...counts.entries()]
          .map(([province, count]) => ({ province, count }))
          .sort((a, b) => b.count - a.count)

        setStats(sortedStats)
        setTotal(traitors.length)

        // 构建 ECharts 数据
        const maxCount = Math.max(1, ...sortedStats.map((s) => s.count))
        const mapData = sortedStats.map((s) => ({
          name: fullProvinceName(s.province),
          value: s.count,
        }))

        // 注册地图
        echarts.registerMap('china', geoJson)

        // 初始化图表（容器始终在 DOM 中，此时 ref 可用）
        const el = chartRef.current
        if (el && !cancelled) {
          const chart = echarts.init(el)
          chartInstance.current = chart
          chart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
              trigger: 'item',
              backgroundColor: '#1a1410',
              borderColor: '#8b6914',
              borderWidth: 1,
              textStyle: { color: '#e8dcc8', fontSize: 13 },
              formatter: (p: { name?: string; value?: number }) =>
                `<b>${p.name}</b><br/>汉奸档案：${p.value && p.value > 0 ? p.value + ' 人' : '暂无记录'}`,
            },
            visualMap: {
              min: 0,
              max: maxCount,
              left: 20,
              bottom: 20,
              calculable: true,
              text: ['多', '少'],
              textStyle: { color: '#9a8870', fontSize: 11 },
              inRange: {
                color: ['#3d2a2a', '#7a2828', '#b03838', '#d85050', '#f08080'],
              },
            },
            series: [
              {
                type: 'map',
                map: 'china',
                roam: true,
                zoom: 1.2,
                top: 50,
                bottom: 20,
                label: {
                  show: true,
                  fontSize: 9,
                  color: '#c4b5a0',
                },
                emphasis: {
                  label: { color: '#fff', fontSize: 11 },
                  itemStyle: { areaColor: '#c84040', borderColor: '#f0c060' },
                },
                itemStyle: {
                  borderColor: '#5a4030',
                  borderWidth: 0.5,
                  areaColor: '#2a1a1a',
                },
                data: mapData,
              },
            ],
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '地图加载失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  return (
    <section style={containerPageStyle} className="py-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* 左栏：标题 + 描述 + 省份排名 */}
        <div className="flex flex-col gap-6">
          {/* 标题区 */}
          <div className="card flex flex-col p-6">
            <p className="font-garamond text-sm italic tracking-widest text-bronzelight">TRAITOR MAP</p>
            <h1 className="mt-3 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl">
              汉奸地图
            </h1>
            <p className="mt-4 leading-loose text-paperdim">
              按省份统计在册汉奸数量，昭示各省流毒分布
            </p>
            {total > 0 && (
              <p className="mt-2 text-sm text-cinnabarlight">当前共录入 {total} 人</p>
            )}
          </div>

          {/* 省份排名 */}
          {!loading && !error && stats.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="section-title">
                <span className="text-base font-semibold tracking-widest text-paper">各省统计</span>
                <span className="font-garamond text-xs italic text-bronzelight">RANKING</span>
              </h2>
              <div className="flex flex-col gap-2">
                {stats.map((s, i) => (
                  <Link
                    key={s.province}
                    to={`/roster`}
                    className="card flex items-center justify-between px-3 py-2.5 transition-colors hover:border-cinnabar/40"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-garamond text-xs text-bronzelight/70">{i + 1}</span>
                      <span className="text-sm text-paper">{s.province}</span>
                    </span>
                    <span className="font-garamond text-lg font-bold text-cinnabarlight">{s.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右栏：地图 */}
        <div className="card relative min-h-[700px] overflow-hidden p-2">
          <div ref={chartRef} className="h-[700px] w-full" />

          {/* 加载遮罩 */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-inkcard/90">
              <p className="text-paperdim">地图加载中…</p>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-inkcard/90 px-8 text-center">
              <p className="text-sm text-cinnabarlight">{error}</p>
              <p className="mt-2 text-xs tracking-wider text-paperdim/60">
                地图数据需联网获取，请检查网络后刷新
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
