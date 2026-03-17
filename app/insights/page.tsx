'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Filter, RefreshCw, Upload, Loader2, BarChart3, PieChart, LineChart,
  ThumbsUp, ThumbsDown, FileText, Sparkles, Database, FolderOpen,
  FileSpreadsheet, ChevronDown, X, Hash,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/lib/store/dashboard-store'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  LineChart as RechartsLine, Line, Area, AreaChart,
} from 'recharts'

interface Insight {
  id: string
  type: 'positive' | 'negative' | 'warning' | 'info'
  title: string
  description: string
  metric?: string | null
  change?: number | null
  category: string
}

interface AnalysisResult {
  insights: Insight[]
  summary: { totalRows: number; totalColumns: number; numericColumns: string[]; categoricalColumns: string[]; dateColumns: string[] }
  statistics: Record<string, { min?: number | null; max?: number | null; mean?: number | null; sum?: number | null; uniqueCount?: number | null }>
  charts: { barChartData: { name: string; value: number; [k: string]: string | number }[]; pieChartData: { name: string; value: number }[]; lineChartData: { name: string; value: number; trend?: number }[] }
  feedbackAnalysis?: {
    pros: { title: string; description: string; percentage: number }[]
    cons: { title: string; description: string; percentage: number }[]
    sentimentScore: number
    totalReviews: number
  } | null
  documentAnalysis?: {
    keyPoints: { title: string; description: string; importance: 'high' | 'medium' | 'low'; category: string }[]
    summary: string
  } | null
  dataType: 'numeric' | 'feedback' | 'document' | 'mixed'
}

const insightIcons = { positive: TrendingUp, negative: TrendingDown, warning: AlertTriangle, info: CheckCircle }
const insightStyles = {
  positive: { badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: 'text-emerald-500', bg: 'bg-emerald-500/5' },
  negative: { badge: 'bg-red-500/10 text-red-500 border-red-500/20', icon: 'text-red-500', bg: 'bg-red-500/5' },
  warning: { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: 'text-amber-500', bg: 'bg-amber-500/5' },
  info: { badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: 'text-blue-500', bg: 'bg-blue-500/5' },
}
const CHART_COLORS = ['hsl(var(--primary))','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4']
const types = ['All','positive','negative','warning','info']

function FileSelectorInline({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { fileLibrary, dataset, selectDatasetFromLibrary } = useDashboardStore()
  if (!fileLibrary.length) return (
    <Card className="absolute top-full mt-1 left-0 right-0 z-20 p-4">
      <div className="text-center py-2">
        <p className="text-sm font-medium">No files in library</p>
        <Button size="sm" className="mt-2" onClick={() => { router.push('/upload'); onClose() }}>
          <Upload className="size-3.5 mr-1.5" />Upload File
        </Button>
      </div>
    </Card>
  )
  return (
    <Card className="absolute top-full mt-1 left-0 right-0 z-20 shadow-xl border-primary/20">
      <div className="p-2 border-b flex items-center justify-between">
        <p className="text-xs font-semibold px-1 flex items-center gap-1.5">
          <FolderOpen className="size-3.5 text-primary" />Select a file
        </p>
        <Button variant="ghost" size="icon" className="size-5" onClick={onClose}><X className="size-3" /></Button>
      </div>
      <ScrollArea className="max-h-52">
        <div className="p-1.5 space-y-0.5">
          {fileLibrary.map(file => (
            <button key={file.id}
              className={cn("w-full flex items-center gap-2 rounded px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent", dataset?.id === file.id && "bg-primary/10")}
              onClick={() => { selectDatasetFromLibrary(file.id); onClose() }}>
              <FileSpreadsheet className="size-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{file.rowCount.toLocaleString()} rows · {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}</p>
              </div>
              {dataset?.id === file.id && <Badge className="text-[9px] h-3.5 px-1">Active</Badge>}
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}

export default function InsightsPage() {
  const router = useRouter()
  const { dataset, hasDataset, fileLibrary, selectDatasetFromLibrary } = useDashboardStore()
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [activeChartTab, setActiveChartTab] = useState<'bar'|'pie'|'line'>('bar')
  const [showFileSelector, setShowFileSelector] = useState(false)

  const categories = analysis ? ['All', ...Array.from(new Set(analysis.insights.map(i => i.category)))] : ['All']
  const filteredInsights = analysis?.insights.filter(i => {
    if (categoryFilter !== 'All' && i.category !== categoryFilter) return false
    if (typeFilter !== 'All' && i.type !== typeFilter) return false
    return true
  }) || []

  const stats = analysis
    ? { total: analysis.insights.length, positive: analysis.insights.filter(i => i.type === 'positive').length, warning: analysis.insights.filter(i => i.type === 'warning').length, negative: analysis.insights.filter(i => i.type === 'negative').length }
    : { total: 0, positive: 0, warning: 0, negative: 0 }

  const generateInsights = async () => {
    if (!dataset) { toast.error('Select a file first'); return }
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: dataset.columns, data: dataset.data, fileName: dataset.name }),
      })
      if (!response.ok) throw new Error('Failed')
      const result = await response.json()
      // Normalise charts from API response into our format
      const normalized: AnalysisResult = {
        ...result,
        charts: result.chartData
          ? {
              barChartData: (result.chartData.labels || []).map((label: string, i: number) => ({
                name: label,
                ...Object.fromEntries((result.chartData.datasets || []).map((d: { label: string; data: number[] }) => [d.label, d.data[i] || 0])),
              })),
              pieChartData: (result.chartData.labels || []).map((label: string, i: number) => ({
                name: label,
                value: (result.chartData.datasets?.[0]?.data?.[i] || 0),
              })),
              lineChartData: (result.chartData.labels || []).map((label: string, i: number) => ({
                name: label,
                value: (result.chartData.datasets?.[0]?.data?.[i] || 0),
              })),
            }
          : { barChartData: [], pieChartData: [], lineChartData: [] },
      }
      setAnalysis(normalized)
      
      // Add to history
      useDashboardStore.getState().addQueryHistory({
        id: Math.random().toString(36).substring(2, 9),
        query: `Generated insights for ${dataset.name}`,
        timestamp: new Date(),
        chartTypes: ['bar', 'pie', 'line'],
        datasetId: dataset.id,
        datasetName: dataset.name,
        type: 'insights'
      })

      toast.success('Insights generated!')
    } catch {
      toast.error('Failed to generate insights')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI Insights</h2>
            <p className="text-muted-foreground">
              {analysis ? `Analysis complete — ${analysis.dataType} data · ${analysis.summary.totalRows.toLocaleString()} rows` : 'Select a file and generate insights'}
            </p>
          </div>
          {analysis && (
            <Button onClick={generateInsights} disabled={isLoading} variant="outline">
              {isLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}Regenerate
            </Button>
          )}
        </div>

        {/* File + Generate panel */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="size-5 text-primary" />Generate Insights</CardTitle>
            <CardDescription>Select any uploaded file and generate comprehensive AI-powered analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* File selector */}
              <div className="relative flex-1">
                <button
                  className={cn(
                    "w-full flex items-center gap-3 rounded-md border bg-background px-3 py-2.5 text-sm text-left transition-colors hover:border-primary/50",
                    showFileSelector && "border-primary ring-1 ring-primary/20"
                  )}
                  onClick={() => setShowFileSelector(v => !v)}
                >
                  {hasDataset && dataset ? (
                    <>
                      <FileSpreadsheet className="size-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{dataset.name}</p>
                        <p className="text-xs text-muted-foreground">{dataset.rowCount.toLocaleString()} rows · {dataset.columns.length} columns</p>
                      </div>
                      <Badge className="text-[10px] h-4 px-1.5 shrink-0">Active</Badge>
                    </>
                  ) : (
                    <>
                      <Database className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground flex-1">
                        {fileLibrary.length > 0 ? 'Select a file to analyze…' : 'No files uploaded yet'}
                      </span>
                    </>
                  )}
                  <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                </button>
                {showFileSelector && <FileSelectorInline onClose={() => setShowFileSelector(false)} />}
              </div>

              <Button
                onClick={generateInsights}
                disabled={isLoading || !hasDataset}
                className="sm:w-auto"
              >
                {isLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
                Generate Insights
              </Button>

              {!hasDataset && (
                <Button variant="outline" onClick={() => router.push('/upload')}>
                  <Upload className="size-4 mr-2" />Upload File
                </Button>
              )}
            </div>

            {/* Feature badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[['Statistical Analysis', BarChart3], ['Visual Charts', PieChart], ['Pros & Cons', ThumbsUp], ['Key Points', FileText]].map(([label, Icon]) => (
                <Badge key={label as string} variant="outline" className="text-xs gap-1">
                  {/* @ts-ignore */}
                  <Icon className="size-3" />{label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="size-8 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analyzing Your Data</h3>
              <p className="text-muted-foreground text-center max-w-md text-sm">
                AI is examining <strong>{dataset?.name}</strong> ({dataset?.rowCount.toLocaleString()} rows) for patterns, trends, and actionable insights…
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {analysis && !isLoading && (
          <>
            {/* Summary stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Total Rows', value: analysis.summary.totalRows.toLocaleString(), icon: null },
                { label: 'Insights', value: stats.total, icon: <Lightbulb className="size-8 text-primary/50" /> },
                { label: 'Positive', value: stats.positive, icon: <TrendingUp className="size-8 text-emerald-500/50" />, border: 'border-emerald-500/20', text: 'text-emerald-500' },
                { label: 'Warnings', value: stats.warning, icon: <AlertTriangle className="size-8 text-amber-500/50" />, border: 'border-amber-500/20', text: 'text-amber-500' },
                { label: 'Issues', value: stats.negative, icon: <TrendingDown className="size-8 text-red-500/50" />, border: 'border-red-500/20', text: 'text-red-500' },
              ].map((item) => (
                <Card key={item.label} className={item.border}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className={cn("text-2xl font-bold", item.text)}>{item.value}</p>
                      </div>
                      {item.icon}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Column breakdown */}
            {(analysis.summary.numericColumns.length > 0 || analysis.summary.categoricalColumns.length > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Dataset Schema — {dataset?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.summary.numericColumns.map(c => (
                      <Badge key={c} variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1">
                        <Hash className="size-2.5" />{c}
                      </Badge>
                    ))}
                    {analysis.summary.categoricalColumns.map(c => (
                      <Badge key={c} variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs gap-1">
                        <FileText className="size-2.5" />{c}
                      </Badge>
                    ))}
                    {analysis.summary.dateColumns.map(c => (
                      <Badge key={c} variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs gap-1">
                        <CheckCircle className="size-2.5" />{c}
                      </Badge>
                    ))}
                  </div>
                  {Object.keys(analysis.statistics).length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(analysis.statistics).slice(0, 8).map(([col, stat]) => (
                        <div key={col} className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium truncate mb-1">{col}</p>
                          {stat.sum != null && <p className="text-xs text-muted-foreground">Sum: <span className="text-foreground font-medium">{stat.sum.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span></p>}
                          {stat.mean != null && <p className="text-xs text-muted-foreground">Avg: <span className="text-foreground font-medium">{stat.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>}
                          {stat.min != null && stat.max != null && <p className="text-xs text-muted-foreground">Range: <span className="text-foreground font-medium">{stat.min.toLocaleString(undefined, { maximumFractionDigits: 1 })}–{stat.max.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span></p>}
                          {stat.uniqueCount != null && stat.sum == null && <p className="text-xs text-muted-foreground">Unique: <span className="text-foreground font-medium">{stat.uniqueCount}</span></p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            {(analysis.charts.barChartData.length > 0 || analysis.charts.pieChartData.length > 0 || analysis.charts.lineChartData.length > 0) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Data Visualisation</CardTitle>
                      <CardDescription>Charts generated from your actual data</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {(['bar','pie','line'] as const).map((t) => (
                        <Button key={t} variant={activeChartTab === t ? 'default' : 'outline'} size="sm"
                          onClick={() => setActiveChartTab(t)}>
                          {t === 'bar' ? <BarChart3 className="size-4" /> : t === 'pie' ? <PieChart className="size-4" /> : <LineChart className="size-4" />}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChartTab === 'bar' && analysis.charts.barChartData.length > 0 ? (
                        <BarChart data={analysis.charts.barChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" /><YAxis className="text-xs" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Legend />
                          {Object.keys(analysis.charts.barChartData[0] || {}).filter(k => k !== 'name').map((key, i) => (
                            <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4,4,0,0]} />
                          ))}
                        </BarChart>
                      ) : activeChartTab === 'pie' && analysis.charts.pieChartData.length > 0 ? (
                        <RechartsPie>
                          <Pie data={analysis.charts.pieChartData} cx="50%" cy="50%" labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                            outerRadius={120} fill="#8884d8" dataKey="value">
                            {analysis.charts.pieChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip /><Legend />
                        </RechartsPie>
                      ) : analysis.charts.lineChartData.length > 0 ? (
                        <AreaChart data={analysis.charts.lineChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" /><YAxis className="text-xs" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Legend />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                          {analysis.charts.lineChartData[0]?.trend !== undefined && (
                            <Line type="monotone" dataKey="trend" stroke="#10b981" strokeDasharray="5 5" dot={false} />
                          )}
                        </AreaChart>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No chart data available</div>
                      ) as React.ReactElement}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feedback Analysis */}
            {analysis.feedbackAnalysis && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-emerald-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base text-emerald-500"><ThumbsUp className="size-5" />Pros</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.feedbackAnalysis.pros.map((pro, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{pro.title}</p>
                            <p className="text-xs text-muted-foreground">{pro.description}</p>
                          </div>
                          <Badge className="ml-auto shrink-0 bg-emerald-500/10 text-emerald-600 border-0 text-xs">{pro.percentage}%</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-red-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base text-red-500"><ThumbsDown className="size-5" />Cons</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.feedbackAnalysis.cons.map((con, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{con.title}</p>
                            <p className="text-xs text-muted-foreground">{con.description}</p>
                          </div>
                          <Badge className="ml-auto shrink-0 bg-red-500/10 text-red-600 border-0 text-xs">{con.percentage}%</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Overall Sentiment Score · {analysis.feedbackAnalysis.totalReviews.toLocaleString()} reviews analysed</p>
                        <p className={cn("text-3xl font-bold", analysis.feedbackAnalysis.sentimentScore >= 70 ? 'text-emerald-500' : analysis.feedbackAnalysis.sentimentScore >= 50 ? 'text-amber-500' : 'text-red-500')}>
                          {analysis.feedbackAnalysis.sentimentScore}%
                        </p>
                      </div>
                      <div className="w-64 h-3 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full transition-all", analysis.feedbackAnalysis.sentimentScore >= 70 ? 'bg-emerald-500' : analysis.feedbackAnalysis.sentimentScore >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                          style={{ width: `${analysis.feedbackAnalysis.sentimentScore}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Document Analysis */}
            {analysis.documentAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><FileText className="size-5" />Key Points</CardTitle>
                  <CardDescription>{analysis.documentAnalysis.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.documentAnalysis.keyPoints.map((pt, i) => (
                      <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border",
                        pt.importance === 'high' ? 'bg-primary/5 border-primary/20' : pt.importance === 'medium' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-muted/50')}>
                        <Badge variant="outline" className={cn("shrink-0 text-xs",
                          pt.importance === 'high' ? 'border-primary text-primary' : pt.importance === 'medium' ? 'border-amber-500 text-amber-500' : '')}>
                          {pt.importance}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{pt.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{pt.description}</p>
                          <Badge variant="secondary" className="mt-1.5 text-xs">{pt.category}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Insights filtered */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base">All Insights</CardTitle>
                    <CardDescription>{filteredInsights.length} of {stats.total} showing</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="size-4 text-muted-foreground" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{types.map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t === 'All' ? 'All Types' : t}</SelectItem>)}</SelectContent>
                    </Select>
                    {(categoryFilter !== 'All' || typeFilter !== 'All') && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setCategoryFilter('All'); setTypeFilter('All') }}>
                        <X className="size-3 mr-1" />Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredInsights.length === 0 ? (
                  <div className="py-10 text-center">
                    <Lightbulb className="mx-auto size-10 text-muted-foreground/50 mb-3" />
                    <p className="font-medium">No insights match your filters</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => { setCategoryFilter('All'); setTypeFilter('All') }}>Clear Filters</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInsights.map((insight) => {
                      const Icon = insightIcons[insight.type]
                      const styles = insightStyles[insight.type]
                      return (
                        <div key={insight.id} className={cn("rounded-lg border p-4 transition-colors hover:bg-accent/30", styles.bg)}>
                          <div className="flex items-start gap-4">
                            <div className={cn("mt-1", styles.icon)}><Icon className="size-5" /></div>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{insight.category}</Badge>
                                    {insight.change != null && (
                                      <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                                        {insight.change > 0 ? '+' : ''}{insight.change}%
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.description}</p>
                              {insight.metric && <p className="text-sm font-medium text-primary">{insight.metric}</p>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty state */}
        {!analysis && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4"><Lightbulb className="size-8 text-muted-foreground" /></div>
              <h3 className="text-lg font-semibold mb-2">Ready to Analyse</h3>
              <p className="text-muted-foreground text-center max-w-md text-sm mb-6">
                {hasDataset
                  ? `File selected: ${dataset?.name}. Click "Generate Insights" above to start.`
                  : fileLibrary.length > 0
                    ? 'Select a file from the dropdown above and click "Generate Insights".'
                    : 'Upload a CSV file first, then generate insights here.'}
              </p>
              {!hasDataset && (
                <Button onClick={() => router.push('/upload')} variant="outline">
                  <Upload className="size-4 mr-2" />Upload a File
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
