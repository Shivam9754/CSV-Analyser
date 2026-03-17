'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  description?: string
  insight?: string
  children: React.ReactNode
  className?: string
  isLoading?: boolean
  index?: number
}

export function ChartCard({
  title,
  description,
  insight,
  children,
  className,
  isLoading = false,
  index = 0,
}: ChartCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden card-hover-lift group opacity-0 animate-fade-in-up",
        className
      )}
      style={{ animationDelay: `${(index + 4) * 100}ms`, animationFillMode: 'forwards' }}
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      </div>
      
      <CardHeader className="pb-2 relative">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors duration-300">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-[250px] w-full rounded-lg animate-shimmer" />
          </div>
        ) : (
          <>
            <div className="h-[250px] chart-glow">{children}</div>
            {insight && (
              <div className="mt-4 rounded-xl bg-gradient-to-r from-muted/80 to-muted/40 p-4 border border-border/50 insight-highlight">
                <div className="flex items-start gap-2">
                  <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">AI Insight:</span> {insight}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      {/* Animated top accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  )
}

export function ChartCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-16 w-full mt-4 rounded-lg" />
      </CardContent>
    </Card>
  )
}
