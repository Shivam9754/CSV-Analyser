'use client'

import { useState } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const exampleQueries = [
  "Show monthly sales revenue for Q3 broken down by region",
  "What are the top 5 performing products this year?",
  "Compare customer acquisition costs across channels",
  "Show me the trend of user engagement over the last 6 months",
]

interface QueryInputProps {
  onSubmit: (query: string) => void
  isLoading?: boolean
}

export function QueryInput({ onSubmit, isLoading = false }: QueryInputProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      onSubmit(query.trim())
    }
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-xl border bg-card shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your data anything..."
            className="min-h-[100px] resize-none border-0 bg-transparent pr-14 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-3">
            <Button
              type="submit"
              size="icon"
              disabled={!query.trim() || isLoading}
              className={cn(
                "size-10 rounded-lg transition-all",
                query.trim() && !isLoading && "bg-primary shadow-lg shadow-primary/25"
              )}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              <span className="sr-only">Submit query</span>
            </Button>
          </div>
        </div>
      </form>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4" />
          <span>Try an example query:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleExampleClick(example)}
              className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
