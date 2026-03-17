'use client'

import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface Insight {
  id: string
  type: 'positive' | 'negative' | 'warning' | 'info'
  title: string
  description: string
  metric?: string
  change?: number
}

interface InsightsPanelProps {
  insights: Insight[]
  isLoading?: boolean
  className?: string
}

const insightIcons = {
  positive: TrendingUp,
  negative: TrendingDown,
  warning: AlertTriangle,
  info: CheckCircle,
}

const insightStyles = {
  positive: {
    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: 'text-emerald-500',
  },
  negative: {
    badge: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: 'text-red-500',
  },
  warning: {
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    icon: 'text-amber-500',
  },
  info: {
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: 'text-blue-500',
  },
}

export function InsightsPanel({ insights, isLoading, className }: InsightsPanelProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="size-4 text-primary animate-pulse" />
            Generating Insights...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="size-4 text-primary" />
          AI-Generated Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          <div className="space-y-3">
            {insights.map((insight) => {
              const Icon = insightIcons[insight.type]
              const styles = insightStyles[insight.type]

              return (
                <div
                  key={insight.id}
                  className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5", styles.icon)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium">{insight.title}</h4>
                        {insight.change !== undefined && (
                          <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                            {insight.change > 0 ? '+' : ''}{insight.change}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                      {insight.metric && (
                        <p className="text-xs font-medium text-primary mt-2">
                          {insight.metric}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
