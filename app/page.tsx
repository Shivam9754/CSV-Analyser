'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useDashboardStore } from '@/lib/store/dashboard-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send, Upload, Sparkles, User, Bot, Loader2, FileSpreadsheet, MessageSquareText,
  ChevronDown, Hash, Calendar, Type, CheckCircle2, X, FolderOpen,
  BarChart3, Database,
} from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = ['hsl(var(--primary))','hsl(var(--chart-2))','hsl(var(--chart-3))','hsl(var(--chart-4))','hsl(var(--chart-5))']

const typeIcons = { string: Type, number: Hash, date: Calendar, boolean: CheckCircle2 }
const typeColors = {
  string: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  number: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  date: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  boolean: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

function parseChartFromContent(content: string) {
  const chartRegex = /```chart\n([\s\S]*?)\n```/g
  const charts: Array<{ type: string; title: string; data: Array<{ label: string; value: number }> }> = []
  let text = content
  let match
  while ((match = chartRegex.exec(content)) !== null) {
    try { charts.push(JSON.parse(match[1])); text = text.replace(match[0], '') } catch {}
  }
  return { text: text.trim(), charts }
}

function RenderChart({ chart }: { chart: { type: string; title: string; data: Array<{ label: string; value: number }> } }) {
  return (
    <Card className="p-4 my-4">
      <h4 className="font-medium mb-4 text-sm">{chart.title}</h4>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'pie' ? (
            <PieChart>
              <Pie data={chart.data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80}
                label={({ label, percent }) => `${label}: ${(percent*100).toFixed(0)}%`}>
                {chart.data.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          ) : chart.type === 'line' ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" /><YAxis className="text-xs" /><Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          ) : chart.type === 'area' ? (
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" /><YAxis className="text-xs" /><Tooltip />
              <Area type="monotone" dataKey="value" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" />
            </AreaChart>
          ) : (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" /><YAxis className="text-xs" /><Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function ChatMessage({ role, content }: { role: 'user'|'assistant'; content: string }) {
  const { text, charts } = parseChartFromContent(content)
  return (
    <div className={cn("flex gap-3", role === 'user' ? 'justify-end' : 'justify-start')}>
      {role === 'assistant' && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="size-4 text-primary" />
        </div>
      )}
      <div className={cn("max-w-[85%]", role === 'user' ? 'order-first' : '')}>
        <div className={cn("rounded-2xl px-4 py-3", role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
          {role === 'assistant' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                table: ({ children }) => <div className="overflow-x-auto my-2"><table className="min-w-full border-collapse text-sm">{children}</table></div>,
                th: ({ children }) => <th className="border border-border px-3 py-2 bg-muted font-medium text-left">{children}</th>,
                td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{children}</a>,
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  return isInline
                    ? <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                    : <code className={className} {...props}>{children}</code>
                },
              }}>{text}</ReactMarkdown>
            </div>
          ) : <p className="text-sm">{content}</p>}
        </div>
        {charts.map((chart, i) => <RenderChart key={i} chart={chart} />)}
      </div>
      {role === 'user' && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="size-4 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}

// File selector panel
function FileSelectorPanel({ onClose }: { onClose: () => void }) {
  const { fileLibrary, dataset, selectDatasetFromLibrary } = useDashboardStore()

  if (fileLibrary.length === 0) {
    return (
      <Card className="absolute bottom-full mb-2 left-0 right-0 z-20 p-4">
        <div className="text-center py-4">
          <Database className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No files in library</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Upload a CSV to start analyzing</p>
          <Link href="/upload" onClick={onClose}>
            <Button size="sm"><Upload className="size-3.5 mr-1.5" />Upload File</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="absolute bottom-full mb-2 left-0 right-0 z-20 shadow-xl border-primary/20">
      <div className="p-3 border-b flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <FolderOpen className="size-4 text-primary" />Choose a file to analyze
        </p>
        <Button variant="ghost" size="icon" className="size-6" onClick={onClose}><X className="size-3.5" /></Button>
      </div>
      <ScrollArea className="max-h-64">
        <div className="p-2 space-y-1">
          {fileLibrary.map((file) => {
            const isActive = dataset?.id === file.id
            return (
              <button
                key={file.id}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent",
                  isActive && "bg-primary/10 text-primary"
                )}
                onClick={() => { selectDatasetFromLibrary(file.id); onClose() }}
              >
                <FileSpreadsheet className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.rowCount.toLocaleString()} rows · {file.columns.length} cols ·{' '}
                    {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                  </p>
                </div>
                {isActive && <Badge className="shrink-0 text-[10px] h-4 px-1.5">Active</Badge>}
              </button>
            )
          })}
        </div>
      </ScrollArea>
      <div className="p-2 border-t">
        <Link href="/upload" onClick={onClose}>
          <Button variant="ghost" size="sm" className="w-full text-xs">
            <Upload className="size-3.5 mr-1.5" />Upload new file
          </Button>
        </Link>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { dataset, hasDataset, fileLibrary } = useDashboardStore()
  const [input, setInput] = useState('')
  const [showFileSelector, setShowFileSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const datasetSchema = dataset?.columns.map(col => `${col.name} (${col.type})`).join(', ')
  const sampleData = dataset?.data.slice(0, 500)

  const chat = useChat({
    api: '/api/chat',
    body: { datasetSchema, sampleData },
  })
  const { messages, status, error } = chat
  
  // Robust send handler to deal with AI SDK v6 changes
  const onSend = (content: string) => {
    if (!content.trim() || isLoading) return
    
    const sendMessage = (chat as any).sendMessage
    const append = (chat as any).append
    const chatOptions = {
      body: { datasetSchema, sampleData }
    }
    
    if (typeof sendMessage === 'function') {
      sendMessage({ text: content }, chatOptions)
    } else if (typeof append === 'function') {
      append({ role: 'user', content }, chatOptions)
    } else {
      console.error('Neither sendMessage nor append is a function', Object.keys(chat))
    }

    // Add to history
    useDashboardStore.getState().addQueryHistory({
      id: Math.random().toString(36).substring(2, 9),
      query: content,
      timestamp: new Date(),
      chartTypes: [], // Chart types are detected in response, but for now we track the prompt
      datasetId: dataset?.id,
      datasetName: dataset?.name,
      type: 'chat'
    })

    setInput('')
  }

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(input)
  }

  const suggestions = hasDataset
    ? ['What are the key statistics of this dataset?', 'Show me the top 10 records by highest values', 'Find any outliers or anomalies', 'Summarize the main trends and patterns']
    : ['What kind of data can I analyze?', 'How do I upload my dataset?', 'Show me an example analysis']

  const getMessageText = (message: typeof messages[0]): string => {
    if (message.parts && Array.isArray(message.parts)) {
      const partsText = message.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text').map(p => p.text).join('')
      if (partsText) return partsText
    }
    return message.content || ''
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-start h-[calc(100vh-3.5rem)] w-full">
        {/* Header */}
        <div className="border-b px-6 py-3 flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-base font-semibold">Data Analysis Chat</h1>
              {hasDataset && dataset ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {dataset.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <BarChart3 className="size-2.5" />{dataset.rowCount.toLocaleString()} rows
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {dataset.columns.length} cols
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No file selected</p>
              )}
            </div>
          </div>

          {/* Column pills (desktop) */}
          {hasDataset && dataset && (
            <div className="hidden lg:flex items-center gap-1 flex-wrap max-w-lg">
              {dataset.columns.slice(0,6).map(col => {
                const Icon = typeIcons[col.type]
                return (
                  <Badge key={col.name} variant="outline" className={cn("text-[10px] h-4 px-1.5 gap-1", typeColors[col.type])}>
                    <Icon className="size-2.5" />
                    {col.name.length > 12 ? col.name.slice(0,12)+'…' : col.name}
                  </Badge>
                )
              })}
              {dataset.columns.length > 6 && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">+{dataset.columns.length-6} more</Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {fileLibrary.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowFileSelector(v => !v)}>
                <FolderOpen className="size-3.5 mr-1.5" />
                Switch File
                <ChevronDown className="size-3 ml-1" />
              </Button>
            )}
            {!hasDataset && (
              <Link href="/upload">
                <Button size="sm"><Upload className="size-3.5 mr-1.5" />Upload</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 w-full flex flex-col items-start">
          {messages.length === 0 ? (
            <div className="flex flex-col items-start text-left w-full py-12">
              <div className="rounded-2xl bg-primary/10 p-6 mb-4">
                <MessageSquareText className="size-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {hasDataset ? `Analyzing ${dataset?.name}` : 'Ask Anything About Your Data'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {hasDataset
                  ? `I have loaded ${dataset?.rowCount.toLocaleString()} rows across ${dataset?.columns.length} columns. Ask me anything!`
                  : 'Upload a CSV file to start, or ask me what I can help with.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                 {suggestions.map((s, i) => (
                  <button key={i} onClick={() => onSend(s)}
                    className="text-left text-sm p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role as 'user'|'assistant'} content={getMessageText(msg)} />
              ))}
            </div>
          )}

          {isLoading && (
            <div className="w-full">
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Analyzing…</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="w-full">
              <div className="flex gap-3">
                 <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                   <Bot className="size-4 text-destructive" />
                 </div>
                 <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-3 text-sm">
                   <p className="font-semibold mb-1">Error analyzing data</p>
                   <p>{error.message || 'Please check your API key in .env.local and try again.'}</p>
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t px-6 py-4 relative w-full">
          <div className="w-full">
            {showFileSelector && <FileSelectorPanel onClose={() => setShowFileSelector(false)} />}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setShowFileSelector(v => !v)}
                title="Switch dataset"
              >
                <FileSpreadsheet className="size-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={hasDataset
                  ? `Ask about ${dataset?.name}… (e.g. "Show top 10 by revenue", "Find outliers")`
                  : 'Select a file or upload one to start…'}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              {hasDataset
                ? 'Ask for text analysis or say "show chart" for visualizations'
                : 'Use the file icon to switch datasets · Upload at /upload'}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
