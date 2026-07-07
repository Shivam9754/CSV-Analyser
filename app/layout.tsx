// app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SettingsProvider } from '@/contexts/settings-context'
import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Conversational BI - AI-Powered Business Intelligence',
  description: 'Generate interactive data dashboards using natural language.',
  keywords: ['business intelligence', 'AI', 'data visualization', 'dashboard', 'analytics'],
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a14' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <SettingsProvider>
              {children}
              <Toaster />
            </SettingsProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}