// app/statistical-analysis/page.tsx

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart2, PieChart as PieIcon, TrendingUp, Activity,
  Download, RefreshCw, Upload, Loader2, FileSpreadsheet,
  Database, FolderOpen, ChevronDown, X, Settings2,
  ChevronRight, Palette, Type, BarChart3, Plus, Trash2, Filter, Calculator
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area,
} from 'recharts'

type ChartType = 'bar' | 'pie' | 'line' | 'area'

interface ChartConfig {
  type: ChartType
  xAxis: string
  yAxes: string[]
  color: string
  title: string
  xLabel: string
  yLabel: string
  description: string
  rowLimit: string
  aggregation: 'sum' | 'avg' | 'count'
  sortDirection: 'none' | 'asc' | 'desc'
  splitBy: string
}

interface FilterItem {
  column: string
  operator: 'equals' | 'contains' | '>=' | '<='
  value: string
}

interface FormulaItem {
  name: string
  colA: string
  operator: '+' | '-' | '*' | '/'
  colB: string
  multiplier: number
}

interface ChartData {
  data: Record<string, string | number>[]
  numericColumns: string[]
  categoricalColumns: string[]
  summary: string
  allStats?: Record<string, any>
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#3b82f6',
]

const CHART_PALETTE: Record<string, string[]> = {
  '#6366f1': ['#6366f1','#818cf8','#a5b4fc','#c7d2fe','#e0e7ff'],
  '#8b5cf6': ['#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#ede9fe'],
  '#06b6d4': ['#06b6d4','#22d3ee','#67e8f9','#a5f3fc','#cffafe'],
  '#10b981': ['#10b981','#34d399','#6ee7b7','#a7f3d0','#d1fae5'],
  '#f59e0b': ['#f59e0b','#fbbf24','#fcd34d','#fde68a','#fef3c7'],
  '#ef4444': ['#ef4444','#f87171','#fca5a5','#fecaca','#fee2e2'],
  '#ec4899': ['#ec4899','#f472b6','#f9a8d4','#fbcfe8','#fdf2f8'],
  '#3b82f6': ['#3b82f6','#60a5fa','#93c5fd','#bfdbfe','#dbeafe'],
}

// ─── File Selector Component ──────────────────────────────────────────────

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

const CHART_TYPES: { type: ChartType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: 'bar',  label: 'Bar Chart',  icon: BarChart2,   desc: 'Compare values across categories' },
  { type: 'pie',  label: 'Pie Chart',  icon: PieIcon,     desc: 'Show proportional distribution' },
  { type: 'line', label: 'Line Chart', icon: TrendingUp,  desc: 'Track trends over time or sequence' },
  { type: 'area', label: 'Area Chart', icon: Activity,    desc: 'Visualise cumulative change' },
]

// ─── Export Utility ────────────────────────────────────────────────────────

function downloadChart(containerEl: HTMLDivElement | null, format: 'png' | 'jpeg', filename: string) {
  if (!containerEl) { toast.error('Chart container not ready'); return }
  const svgEl = containerEl.querySelector('svg')
  if (!svgEl) { toast.error('Chart rendering not found'); return }

  const serialiser = new XMLSerializer()
  const svgStr = serialiser.serializeToString(svgEl)
  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = svgEl.clientWidth * scale
  canvas.height = svgEl.clientHeight * scale
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  img.onload = () => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    const link = document.createElement('a')
    link.download = `${filename}.${format}`
    link.href = canvas.toDataURL(`image/${format}`, 0.97)
    link.click()
    toast.success(`Downloaded as ${format.toUpperCase()}`)
  }
  img.src = url
}

// ─── Inner Render Chart Component ──────────────────────────────────────────

function RenderChart({
  config, data, colors,
}: {
  config: ChartConfig
  data: Record<string, string | number>[]
  colors: string[]
}) {
  const xLabel = config.xLabel || config.xAxis
  const yLabel = config.yLabel || (config.splitBy ? `${config.yAxes[0]} (Split by ${config.splitBy})` : config.yAxes.join(', '))

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }

  const keys = Object.keys(data[0] || {}).filter(key => key !== config.xAxis)

  if (config.type === 'bar') return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, bottom: 60, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={config.xAxis}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: xLabel, position: 'insideBottom', offset: -40, fontSize: 12, fill: 'hsl(var(--foreground))' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: 'hsl(var(--foreground))' }}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        {keys.map((seriesKey, index) => (
          <Bar 
            key={seriesKey} 
            dataKey={seriesKey} 
            stackId={config.splitBy ? "stacked_series" : undefined}
            fill={colors[index % colors.length]} 
            radius={[4, 4, 0, 0]} 
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )

  if (config.type === 'pie') {
    const activeKey = keys[0] || ''
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={120}
            dataKey={activeKey}
            nameKey={config.xAxis}
            paddingAngle={3}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            labelLine={{ strokeWidth: 1 }}
          >
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (config.type === 'line') return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, bottom: 60, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={config.xAxis}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: xLabel, position: 'insideBottom', offset: -40, fontSize: 12, fill: 'hsl(var(--foreground))' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: 'hsl(var(--foreground))' }}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        {keys.map((seriesKey, index) => (
          <Line
            key={seriesKey}
            type="monotone"
            dataKey={seriesKey}
            stroke={colors[index % colors.length]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: colors[index % colors.length], strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 20, right: 30, bottom: 60, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={config.xAxis}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: xLabel, position: 'insideBottom', offset: -40, fontSize: 12, fill: 'hsl(var(--foreground))' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: 'hsl(var(--foreground))' }}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        {keys.map((seriesKey, index) => (
          <Area
            key={seriesKey}
            type="monotone"
            dataKey={seriesKey}
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.15}
            strokeWidth={2.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function StatisticalAnalysisPage() {
  const router = useRouter()
  const { dataset, hasDataset, fileLibrary } = useDashboardStore()

  const [showFileSelector, setShowFileSelector] = useState(false)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(true)

  const [filters, setFilters] = useState<FilterItem[]>([])
  const [formulas, setFormulas] = useState<FormulaItem[]>([])

  const [tempFilter, setTempFilter] = useState<FilterItem>({ column: '', operator: 'equals', value: '' })
  const [tempFormula, setTempFormula] = useState<FormulaItem>({ name: '', colA: '', operator: '+', colB: '', multiplier: 1 })

  const [config, setConfig] = useState<ChartConfig>({
    type: 'bar',
    xAxis: '',
    yAxes: [],
    color: '#6366f1',
    title: '',
    xLabel: '',
    yLabel: '',
    description: '',
    rowLimit: '100',
    aggregation: 'sum',
    sortDirection: 'none',
    splitBy: '',
  })

  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const colors = CHART_PALETTE[config.color] || CHART_PALETTE['#6366f1']

  const allColumns = dataset?.columns.map(c => c.name) || []
  const rawNumericColumns = dataset?.columns.filter(c => c.type === 'number').map(c => c.name) || []
  const categoricalColumns = dataset?.columns.filter(c => c.type !== 'number').map(c => c.name) || []

  const numericColumns = [...rawNumericColumns, ...formulas.map(f => f.name)]

  const addFilter = () => {
    if (!tempFilter.column || !tempFilter.value) {
      toast.error('Specify column and target filter value')
      return
    }
    setFilters([...filters, tempFilter])
    setTempFilter({ column: '', operator: 'equals', value: '' })
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const addFormula = () => {
    if (!tempFormula.name || !tempFormula.colA) {
      toast.error('Complete calculated attribute fields')
      return
    }
    if (formulas.some(f => f.name === tempFormula.name) || allColumns.includes(tempFormula.name)) {
      toast.error('Formula name overlaps existing column name')
      return
    }
    setFormulas([...formulas, tempFormula])
    setTempFormula({ name: '', colA: '', operator: '+', colB: '', multiplier: 1 })
  }

  const removeFormula = (index: number) => {
    setFormulas(formulas.filter((_, i) => i !== index))
  }

  const buildChartData = async () => {
    if (!dataset || !config.xAxis || config.yAxes.length === 0) {
      toast.error('Configure X-Axis and select at least one numeric Y-Axis attribute')
      return
    }
    setIsLoading(true)

    try {
      const response = await fetch('/api/statistical-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataset.data,
          xAxis: config.xAxis,
          yAxes: config.yAxes,
          chartType: config.type,
          rowLimit: config.rowLimit,
          aggregation: config.aggregation,
          sortDirection: config.sortDirection,
          splitBy: config.type === 'pie' ? '' : config.splitBy,
          filters,
          formulas,
        }),
      })

      if (!response.ok) {
        throw new Error('API processing error')
      }

      const result = await response.json()

      setChartData({
        data: result.aggregatedData,
        numericColumns,
        categoricalColumns,
        summary: result.summary,
        allStats: result.allStats,
      })

      setConfig(prev => ({
        ...prev,
        title: prev.title || (config.splitBy ? `${config.yAxes[0]} grouped by ${config.xAxis} split by ${config.splitBy}` : `${config.yAxes.join(' & ')} by ${config.xAxis}`),
        xLabel: prev.xLabel || config.xAxis,
        yLabel: prev.yLabel || (config.splitBy ? `${config.yAxes[0]} split by ${config.splitBy}` : config.yAxes.join(', ')),
        description: prev.description || result.summary,
      }))

      setShowConfig(false)
      toast.success('Analytics chart completed successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to construct complex chart output')
    } finally {
      setIsLoading(false)
    }
  }

  const resetChart = () => {
    setChartData(null)
    setShowConfig(true)
    setConfig(prev => ({ ...prev, title: '', xLabel: '', yLabel: '', description: '', yAxes: [], splitBy: '' }))
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Statistical Analysis</h2>
            <p className="text-muted-foreground text-sm">
              {chartData
                ? `Showing ${config.type} chart · ${chartData.data.length} aggregated points`
                : 'Configure dataset parameters, set formulas and row filters, then generate charts.'}
            </p>
          </div>
          {chartData && (
            <Button variant="outline" size="sm" onClick={resetChart}>
              <RefreshCw className="size-4 mr-2" />New Chart
            </Button>
          )}
        </div>

        {/* ── Main Setup Card ── */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" />Analytics Configurator
                </CardTitle>
                <CardDescription>Select attributes, set aggregations, apply sorting, and configure advanced data models</CardDescription>
              </div>
              {chartData && (
                <Button variant="ghost" size="sm" onClick={() => setShowConfig(v => !v)} className="gap-2">
                  <Settings2 className="size-4" />
                  {showConfig ? 'Hide' : 'Configure'}
                  <ChevronRight className={cn('size-4 transition-transform', showConfig && 'rotate-90')} />
                </Button>
              )}
            </div>
          </CardHeader>

          {showConfig && (
            <CardContent className="space-y-6 pt-0">
              
              {/* File selector row */}
              <div className="flex flex-col sm:flex-row gap-3">
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
                          <p className="text-xs text-muted-foreground">{dataset.rowCount.toLocaleString()} rows · {dataset.columns.length} cols</p>
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
                  onClick={buildChartData}
                  disabled={isLoading || !hasDataset || !config.xAxis || config.yAxes.length === 0}
                >
                  {isLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <BarChart3 className="size-4 mr-2" />}
                  Generate Analysis
                </Button>

                {!hasDataset && (
                  <Button variant="outline" onClick={() => router.push('/upload')}>
                    <Upload className="size-4 mr-2" />Upload File
                  </Button>
                )}
              </div>

              {/* Chart type selector */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Chart Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CHART_TYPES.map(({ type, label, icon: Icon, desc }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setConfig(p => ({ ...p, type, splitBy: type === 'pie' ? '' : p.splitBy }))}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all hover:border-primary/60 hover:bg-primary/5",
                        config.type === type ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                      )}
                    >
                      <Icon className="size-5" />
                      <span className="text-xs font-medium">{label}</span>
                      <span className="text-[10px] opacity-70 leading-tight hidden sm:block">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Formulas Builder Panel */}
              {hasDataset && (
                <div className="space-y-3 border rounded-lg p-4 bg-background/40">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Calculator className="size-4" /> Calculated Attribute Formulas (Virtual Columns)
                  </h4>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Formula Output Name</Label>
                      <Input
                        value={tempFormula.name}
                        onChange={e => setTempFormula(p => ({ ...p, name: e.target.value }))}
                        className="h-8 text-xs w-36"
                        placeholder="Margin%"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Attribute A</Label>
                      <Select
                        value={tempFormula.colA}
                        onValueChange={v => setTempFormula(p => ({ ...p, colA: v }))}
                      >
                        <SelectTrigger className="h-8 text-xs w-36">
                          <SelectValue placeholder="Attribute A" />
                        </SelectTrigger>
                        <SelectContent>
                          {rawNumericColumns.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Math Op</Label>
                      <Select
                        value={tempFormula.operator}
                        onValueChange={(v: any) => setTempFormula(p => ({ ...p, operator: v }))}
                      >
                        <SelectTrigger className="h-8 text-xs w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['+', '-', '*', '/'].map(op => <SelectItem key={op} value={op} className="text-xs">{op}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Attribute B</Label>
                      <Select
                        value={tempFormula.colB}
                        onValueChange={v => setTempFormula(p => ({ ...p, colB: v }))}
                      >
                        <SelectTrigger className="h-8 text-xs w-36">
                          <SelectValue placeholder="Attribute B" />
                        </SelectTrigger>
                        <SelectContent>
                          {rawNumericColumns.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Multiplier</Label>
                      <Input
                        type="number"
                        value={tempFormula.multiplier}
                        onChange={e => setTempFormula(p => ({ ...p, multiplier: parseFloat(e.target.value) || 1 }))}
                        className="h-8 text-xs w-20"
                      />
                    </div>
                    <Button type="button" size="sm" onClick={addFormula} className="h-8 px-2"><Plus className="size-3.5 mr-1" />Add</Button>
                  </div>

                  {formulas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formulas.map((f, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 px-2 py-1 text-xs">
                          <span>{f.name} = ({f.colA} {f.operator} {f.colB}) * {f.multiplier}</span>
                          <button type="button" onClick={() => removeFormula(i)} className="text-destructive hover:scale-110 ml-1"><X className="size-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Data Row Filters Panel */}
              {hasDataset && (
                <div className="space-y-3 border rounded-lg p-4 bg-background/40">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Filter className="size-4" /> Row Filters (Dataset Scope Clauses)
                  </h4>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Target Column</Label>
                      <Select
                        value={tempFilter.column}
                        onValueChange={v => setTempFilter(p => ({ ...p, column: v }))}
                      >
                        <SelectTrigger className="h-8 text-xs w-44">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {allColumns.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Operator</Label>
                      <Select
                        value={tempFilter.operator}
                        onValueChange={(v: any) => setTempFilter(p => ({ ...p, operator: v }))}
                      >
                        <SelectTrigger className="h-8 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals" className="text-xs">Equals</SelectItem>
                          <SelectItem value="contains" className="text-xs">Contains</SelectItem>
                          <SelectItem value=">=" className="text-xs">&gt;= (Greater/Equal)</SelectItem>
                          <SelectItem value="<=" className="text-xs">&lt;= (Less/Equal)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Value</Label>
                      <Input
                        value={tempFilter.value}
                        onChange={e => setTempFilter(p => ({ ...p, value: e.target.value }))}
                        className="h-8 text-xs w-36"
                        placeholder="Criteria value"
                      />
                    </div>
                    <Button type="button" size="sm" onClick={addFilter} className="h-8 px-2"><Plus className="size-3.5 mr-1" />Apply Filter</Button>
                  </div>

                  {filters.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {filters.map((f, i) => (
                        <Badge key={i} variant="outline" className="gap-1 border-primary/30 px-2 py-1 text-xs">
                          <span>{f.column} {f.operator} "{f.value}"</span>
                          <button type="button" onClick={() => removeFilter(i)} className="text-destructive hover:scale-110 ml-1"><X className="size-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Core Layout Selectors */}
              {hasDataset && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t pt-4">
                  {/* Category Axis */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">X-Axis (Category)</Label>
                    <Select
                      value={config.xAxis}
                      onValueChange={v => setConfig(p => ({ ...p, xAxis: v, xLabel: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Category column" />
                      </SelectTrigger>
                      <SelectContent>
                        {allColumns.map(c => <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Split Dimensions Series Dropdown (Fixed empty string issue) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-primary">Split Series (Stacked Category)</Label>
                    <Select
                      value={config.splitBy || "none"}
                      disabled={config.type === 'pie'}
                      onValueChange={v => setConfig(p => ({ ...p, splitBy: v === "none" ? "" : v, yAxes: v && v !== "none" ? [p.yAxes[0] || ''] : p.yAxes }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Optional Split Dimension" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-sm italic text-muted-foreground">No Split Series</SelectItem>
                        {categoricalColumns.map(c => <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rows Limit Constraints */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Evaluation Row Limit</Label>
                    <Select
                      value={config.rowLimit}
                      onValueChange={v => setConfig(p => ({ ...p, rowLimit: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="First 100 rows" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10" className="text-sm">First 10 Rows</SelectItem>
                        <SelectItem value="50" className="text-sm">First 50 Rows</SelectItem>
                        <SelectItem value="100" className="text-sm">First 100 Rows</SelectItem>
                        <SelectItem value="500" className="text-sm">First 500 Rows</SelectItem>
                        <SelectItem value="all" className="text-sm">Evaluate All Rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Multi-Attribute Picker / Selection Checkboxes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Y-Axis Attribute Values
                    </Label>
                    
                    {config.type === 'pie' || config.splitBy ? (
                      // Single Selection mode for Pie and Split-by Series Chart types
                      <Select
                        value={config.yAxes[0] || ''}
                        onValueChange={val => setConfig(p => ({ ...p, yAxes: [val] }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select single value" />
                        </SelectTrigger>
                        <SelectContent>
                          {numericColumns.map(col => <SelectItem key={col} value={col} className="text-sm">{col}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      // Multi Selection checkbox scrolling list for Bar, Line, Area Comparison charts
                      <div className="border rounded-md p-2 bg-background/50 max-h-32 overflow-y-auto space-y-1">
                        {numericColumns.length > 0 ? (
                          numericColumns.map(col => {
                            const isChecked = config.yAxes.includes(col)
                            return (
                              <label key={col} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent/40 p-1 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setConfig(p => ({ ...p, yAxes: [...p.yAxes, col] }))
                                    } else {
                                      setConfig(p => ({ ...p, yAxes: p.yAxes.filter(y => y !== col) }))
                                    }
                                  }}
                                  className="rounded text-primary focus:ring-primary size-3.5"
                                />
                                <span className="truncate">{col}</span>
                              </label>
                            )
                          })
                        ) : (
                          <p className="text-[11px] text-muted-foreground p-1">No numeric attributes found.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aggregation Functions & Sorting criteria selectors */}
              {hasDataset && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Mathematical Aggregation</Label>
                    <Select
                      value={config.aggregation}
                      onValueChange={(v: any) => setConfig(p => ({ ...p, aggregation: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sum" className="text-sm">Sum (Totals)</SelectItem>
                        <SelectItem value="avg" className="text-sm">Average (Means)</SelectItem>
                        <SelectItem value="count" className="text-sm">Count (Item Frequency)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-indigo-500">Value Sorting Criteria</Label>
                    <Select
                      value={config.sortDirection}
                      onValueChange={(v: any) => setConfig(p => ({ ...p, sortDirection: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-sm">No Sorting</SelectItem>
                        <SelectItem value="asc" className="text-sm">Lowest-to-Highest Value</SelectItem>
                        <SelectItem value="desc" className="text-sm">Highest-to-Lowest Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Axis labels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Type className="size-3" />X Axis Label
                  </Label>
                  <Input
                    placeholder="X axis label…"
                    value={config.xLabel}
                    onChange={e => setConfig(p => ({ ...p, xLabel: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Type className="size-3" />Y Axis Label
                  </Label>
                  <Input
                    placeholder="Y axis label…"
                    value={config.yLabel}
                    onChange={e => setConfig(p => ({ ...p, yLabel: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Chart title */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Chart Title</Label>
                <Input
                  placeholder="Give your chart a title…"
                  value={config.title}
                  onChange={e => setConfig(p => ({ ...p, title: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Palette className="size-3" />Color Theme (Cycles shades for split dimensions)
                </Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(col => (
                    <button
                      key={col}
                      onClick={() => setConfig(p => ({ ...p, color: col }))}
                      className={cn(
                        'size-7 rounded-full border-2 transition-transform hover:scale-110',
                        config.color === col ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                      style={{ background: col }}
                      title={col}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 ml-1">
                    <input
                      type="color"
                      value={config.color}
                      onChange={e => setConfig(p => ({ ...p, color: e.target.value }))}
                      className="size-7 rounded-full border cursor-pointer bg-transparent p-0.5"
                      title="Custom color"
                    />
                    <span className="text-xs text-muted-foreground">Custom</span>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ── Loading ── */}
        {isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="size-8 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analyzing Complex Criteria &amp; Generating Chart…</h3>
              <p className="text-muted-foreground text-sm text-center">
                Processing data using OpenAI Engine
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Chart output ── */}
        {chartData && !isLoading && (
          <div className="space-y-4">
            {/* Chart card */}
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">
                      {config.title || (config.splitBy ? `${config.yAxes[0]} grouped by ${config.xAxis} split by ${config.splitBy}` : `${config.yAxes.join(' & ')} by ${config.xAxis}`)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] capitalize">{config.type} chart</Badge>
                      <Badge variant="secondary" className="text-[10px] uppercase">{config.aggregation}</Badge>
                      <span>{chartData.data.length} aggregated categories</span>
                      {config.type === 'pie' && config.yAxes.length > 1 && (
                        <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                          Pie charts show first active column: {config.yAxes[0]}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>

                  {/* Download buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Label className="text-xs text-muted-foreground">Download:</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadChart(chartContainerRef.current, 'png', config.title || 'chart')}
                    >
                      <Download className="size-3.5 mr-1.5" />PNG
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadChart(chartContainerRef.current, 'jpeg', config.title || 'chart')}
                    >
                      <Download className="size-3.5 mr-1.5" />JPG
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="h-[420px] w-full" ref={chartContainerRef}>
                  <RenderChart
                    config={config}
                    data={chartData.data}
                    colors={colors}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Editable legend labels & description */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Legend / axis label editor */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="size-4 text-primary" />Edit Labels &amp; Legend
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Chart Title</Label>
                    <Input
                      value={config.title}
                      onChange={e => setConfig(p => ({ ...p, title: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="Chart title…"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">X Label</Label>
                      <Input
                        value={config.xLabel}
                        onChange={e => setConfig(p => ({ ...p, xLabel: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="X axis…"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Y Label</Label>
                      <Input
                        value={config.yLabel}
                        onChange={e => setConfig(p => ({ ...p, yLabel: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="Y axis…"
                      />
                    </div>
                  </div>
                  {/* Color re-pick inline */}
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Palette className="size-3" />Color</Label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_COLORS.map(col => (
                        <button
                          key={col}
                          onClick={() => setConfig(p => ({ ...p, color: col }))}
                          className={cn('size-6 rounded-full border-2 transition-transform hover:scale-110', config.color === col ? 'border-foreground' : 'border-transparent')}
                          style={{ background: col }}
                        />
                      ))}
                      <input
                        type="color"
                        value={config.color}
                        onChange={e => setConfig(p => ({ ...p, color: e.target.value }))}
                        className="size-6 rounded-full border cursor-pointer bg-transparent p-0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart description */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="size-4 text-primary" />AI Statistical Interpretation
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Generated by gpt-4o-mini</CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="w-full text-sm text-muted-foreground bg-muted/40 rounded-lg p-3 border resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    rows={6}
                    value={config.description}
                    onChange={e => setConfig(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe what this chart represents…"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Statistical summary strip (Displays primary column baseline metrics) */}
            {chartData.data.length > 0 && (() => {
              const primaryY = config.yAxes[0] || ''
              const values = chartData.data.map(d => Number(d[primaryY]) || 0)
              const total = values.reduce((a, b) => a + b, 0)
              const avg = total / values.length
              const max = Math.max(...values)
              const min = Math.min(...values)
              const maxLabel = chartData.data.find(d => Number(d[primaryY]) === max)?.[config.xAxis]
              const minLabel = chartData.data.find(d => Number(d[primaryY]) === min)?.[config.xAxis]

              return (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground tracking-wide block font-semibold uppercase">
                    Aggregated Metrics (Baseline: {primaryY})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Sum', value: total.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: 'text-primary' },
                      { label: 'Category Avg', value: avg.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: 'text-blue-500' },
                      { label: 'Highest Category', value: `${max.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${maxLabel})`, color: 'text-emerald-500' },
                      { label: 'Lowest Category', value: `${min.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${minLabel})`, color: 'text-amber-500' },
                    ].map(item => (
                      <Card key={item.label} className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                        <p className={cn('text-base font-bold truncate', item.color)}>{item.value}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Empty state ── */}
        {!chartData && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <BarChart3 className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Visualise</h3>
              <p className="text-muted-foreground text-center max-w-md text-sm mb-6">
                {hasDataset
                  ? `File loaded: ${dataset?.name}. Select X and Y axes above, then click Generate.`
                  : fileLibrary.length > 0
                    ? 'Choose a file from the selector above, configure the chart, and generate.'
                    : 'Upload a CSV file first, then come back here to generate charts.'}
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