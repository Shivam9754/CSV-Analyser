'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface FollowUpChatProps {
  onQuerySubmit: (query: string) => void
  isLoading?: boolean
  className?: string
  isOpen: boolean
  onClose: () => void
}

export function FollowUpChat({
  onQuerySubmit,
  isLoading = false,
  className,
  isOpen,
  onClose,
}: FollowUpChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'I can help you refine your analysis. Try asking follow-up questions like:\n\n• "Filter this to only show the East region"\n• "Compare this with last quarter"\n• "Show only Electronics category"\n• "What caused this spike in March?"',
      timestamp: new Date(),
    },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    onQuerySubmit(input.trim())
    setInput('')

    // Simulate AI response after query processing
    setTimeout(() => {
      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
        role: 'assistant',
        content: `I've updated the dashboard based on your request: "${input.trim()}". The visualizations and insights have been refreshed to reflect this filter.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 2500)
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-96 rounded-xl border bg-card shadow-2xl",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Dashboard Assistant</h3>
            <p className="text-xs text-muted-foreground">Ask follow-up questions</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="h-80 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  message.role === 'assistant'
                    ? "bg-primary/10"
                    : "bg-muted"
                )}
              >
                {message.role === 'assistant' ? (
                  <Bot className="size-4 text-primary" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                  message.role === 'assistant'
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <div className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="size-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="size-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

// Floating chat button to open the chat
export function ChatButton({ onClick, hasMessages = false }: { onClick: () => void; hasMessages?: boolean }) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-4 right-4 z-40 size-14 rounded-full shadow-lg"
    >
      <Sparkles className="size-6" />
      {hasMessages && (
        <span className="absolute top-0 right-0 size-3 rounded-full bg-destructive" />
      )}
      <span className="sr-only">Open chat assistant</span>
    </Button>
  )
}
