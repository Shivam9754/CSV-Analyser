'use client'

import { useMemo } from 'react'
import { DollarSign, Users, TrendingUp, ShoppingCart, Percent, Hash } from 'lucide-react'
import { KPIGrid, type KPICardProps } from './kpi-card'
import { ChartCard, ChartCardSkeleton } from './chart-card'
import { InsightsPanel, type Insight } from './insights-panel'
import {
  LineChartComponent,
  BarChartComponent,
  PieChartComponent,
  AreaChartComponent,
} from './dashboard-charts'
import type { DashboardResponse, ChartData, KPIData, InsightData } from '@/app/api/generate-dashboard/route'

interface DynamicDashboardProps {
  data: DashboardResponse | null
  isLoading: boolean
}

const iconMap: Record<string, React.ReactNode> = {
  revenue: <DollarSign className="size-4" />,
  users: <Users className="size-4" />,
  growth: <TrendingUp className="size-4" />,
  orders: <ShoppingCart className="size-4" />,
  rate: <Percent className="size-4" />,
  count: <Hash className="size-4" />,
}

function getIconForKPI(title: string): React.ReactNode {
  const lowerTitle = title.toLowerCase()
  if (lowerTitle.includes('revenue') || lowerTitle.includes('sales') || lowerTitle.includes('profit')) {
    return iconMap.revenue
  }
  if (lowerTitle.includes('user') || lowerTitle.includes('customer') || lowerTitle.includes('visitor')) {
    return iconMap.users
  }
  if (lowerTitle.includes('growth') || lowerTitle.includes('increase') || lowerTitle.includes('trend')) {
    return iconMap.growth
  }
  if (lowerTitle.includes('order') || lowerTitle.includes('purchase') || lowerTitle.includes('transaction')) {
    return iconMap.orders
  }
  if (lowerTitle.includes('rate') || lowerTitle.includes('percentage') || lowerTitle.includes('conversion')) {
    return iconMap.rate
  }
  return iconMap.count
}

function transformKPIs(kpis: KPIData[]): KPICardProps[] {
  return kpis.map(kpi => ({
    title: kpi.title,
    value: kpi.value,
    change: kpi.change ?? undefined,
    changeLabel: kpi.changeLabel ?? 'vs last period',
    icon: getIconForKPI(kpi.title),
  }))
}

function transformInsights(insights: InsightData[]): Insight[] {
  return insights.map(insight => ({
    id: insight.id,
    type: insight.type,
    title: insight.title,
    description: insight.description,
    metric: insight.metric ?? undefined,
    change: insight.change ?? undefined,
  }))
}

function transformChartData(chart: ChartData): { xKey: string; yKeys: string[]; data: Record<string, string | number>[] } {
  const yKeys = chart.yAxes
  const xKey = chart.xAxis || 'label'
  
  const data = chart.data.map(point => ({
    [xKey]: point.label,
    ...point.values,
  }))

  return { xKey, yKeys, data }
}

function renderChart(chart: ChartData) {
  const { xKey, yKeys, data } = transformChartData(chart)

  switch (chart.chartType) {
    case 'line':
      return <LineChartComponent data={data} xKey={xKey} yKeys={yKeys} />
    case 'bar':
      return <BarChartComponent data={data} xKey={xKey} yKeys={yKeys} />
    case 'pie':
      const pieData = chart.data.map(point => ({
        name: point.label,
        value: Object.values(point.values)[0] || 0,
      }))
      return <PieChartComponent data={pieData} />
    case 'area':
      return <AreaChartComponent data={data} xKey={xKey} yKeys={yKeys} />
    default:
      return <BarChartComponent data={data} xKey={xKey} yKeys={yKeys} />
  }
}

export function DynamicDashboard({ data, isLoading }: DynamicDashboardProps) {
  const kpis = useMemo(() => {
    if (!data?.kpis) return []
    return transformKPIs(data.kpis)
  }, [data?.kpis])

  const insights = useMemo(() => {
    if (!data?.insights) return []
    return transformInsights(data.insights)
  }, [data?.insights])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* KPI Skeletons */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-xl bg-card border animate-pulse" />
          ))}
        </div>

        {/* Chart Grid Skeletons */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ChartCardSkeleton />
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCardSkeleton />
              <ChartCardSkeleton />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="h-[450px] rounded-xl bg-card border animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data.summary && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">{data.summary}</p>
        </div>
      )}

      {/* KPIs */}
      {kpis.length > 0 && <KPIGrid metrics={kpis} />}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {data.charts.map((chart, index) => (
            <ChartCard
              key={chart.id}
              title={chart.title}
              description={chart.description}
              insight={chart.insight}
              className={index === 0 ? '' : ''}
            >
              {renderChart(chart)}
            </ChartCard>
          ))}
        </div>

        {/* Insights Panel */}
        <div className="lg:col-span-1 space-y-6">
          <InsightsPanel insights={insights} />

          {/* Suggested Queries */}
          {data.suggestedQueries && data.suggestedQueries.length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-medium mb-3">Suggested Follow-ups</h3>
              <div className="space-y-2">
                {data.suggestedQueries.map((query, index) => (
                  <button
                    key={index}
                    className="w-full text-left text-xs text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
