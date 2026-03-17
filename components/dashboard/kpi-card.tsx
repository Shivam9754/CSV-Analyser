'use client'

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface KPICardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
  index?: number
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon,
  className,
  index = 0,
}: KPICardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0
  const isNeutral = change === 0 || change === undefined

  // Color accents based on change
  const accentColor = isPositive 
    ? 'from-emerald-500/20 via-emerald-500/10' 
    : isNegative 
    ? 'from-rose-500/20 via-rose-500/10' 
    : 'from-primary/20 via-primary/10'

  return (
    <Card 
      className={cn(
        "relative overflow-hidden card-hover-lift group opacity-0 animate-fade-in-up",
        className
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      {/* Background gradient accent */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        accentColor
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            "bg-muted/50 text-muted-foreground",
            "group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110"
          )}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold tracking-tight animate-count-up">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                isPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                isNegative && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                isNeutral && "bg-muted text-muted-foreground"
              )}
            >
              {isPositive && <ArrowUpRight className="size-3" />}
              {isNegative && <ArrowDownRight className="size-3" />}
              {isNeutral && <Minus className="size-3" />}
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
      
      {/* Animated bottom accent line */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  )
}

interface KPIGridProps {
  metrics: Omit<KPICardProps, 'index'>[]
}

export function KPIGrid({ metrics }: KPIGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <KPICard key={index} {...metric} index={index} />
      ))}
    </div>
  )
}
