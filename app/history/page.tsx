'use client'

import { formatDistanceToNow } from 'date-fns'
import { History, Search, Trash2, ArrowRight, BarChart, LineChart, PieChart, MessageSquareText, Lightbulb, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboardStore, type QueryHistoryItem } from '@/lib/store/dashboard-store'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

const chartIcons: Record<string, React.ReactNode> = {
  line: <LineChart className="size-3" />,
  bar: <BarChart className="size-3" />,
  pie: <PieChart className="size-3" />,
  area: <LineChart className="size-3" />,
  scatter: <BarChart className="size-3" />,
}

import { format } from 'date-fns'

function HistoryItem({ item, onRerun }: { item: QueryHistoryItem; onRerun: (query: string) => void }) {
  const Icon = item.type === 'insights' ? Lightbulb : MessageSquareText
  
  return (
    <div 
      className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/30 cursor-pointer group"
      onClick={() => onRerun(item.query)}
    >
      <div className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        item.type === 'insights' ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
      )}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge variant={item.type === 'insights' ? 'secondary' : 'default'} className="text-[10px] h-4 px-1.5 uppercase font-bold tracking-wider">
            {item.type}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(item.timestamp), 'MMM d, yyyy · p')}
          </span>
        </div>
        <p className="font-medium text-sm line-clamp-2 leading-relaxed">{item.query}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[10px] font-medium">
            <Database className="size-3" />
            {item.datasetName || 'No dataset'}
          </div>
          {item.chartTypes.length > 0 && (
            <div className="flex items-center gap-1">
              {item.chartTypes.slice(0, 2).map((type, i) => (
                <div key={i} className="flex items-center gap-1 border rounded px-1.5 py-0.5 text-[9px]">
                  {chartIcons[type]}
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onRerun(item.query) }}
        className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
      >
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const { queryHistory, clearQueryHistory, setCurrentQuery } = useDashboardStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return queryHistory
    return queryHistory.filter(item =>
      item.query.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [queryHistory, searchTerm])

  const handleRerun = (query: string) => {
    setCurrentQuery(query)
    router.push('/')
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Query History</h2>
            <p className="text-muted-foreground">
              Click on any query to resume where you left off
            </p>
          </div>
          {queryHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearQueryHistory}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4 mr-2" />
              Clear History
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search History</CardTitle>
            <CardDescription>
              {queryHistory.length} queries in history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center">
                <History className="mx-auto size-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">No queries yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm
                    ? 'No queries match your search'
                    : 'Your query history will appear here'
                  }
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => router.push('/')}
                  >
                    Start Querying
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {filteredHistory.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onRerun={handleRerun}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
