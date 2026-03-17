'use client'

import { Bell, Upload, LogIn, Mail, FileSpreadsheet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSettings } from '@/contexts/settings-context'

export function DashboardHeader() {
  const { t } = useSettings()

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-sm px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center gap-2 ml-2">
        <h1 className="text-lg font-semibold tracking-tight">
          {t('conversational_bi')}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 relative">
              <Bell className="size-4" />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-start gap-3 p-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <Upload className="size-4 text-green-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{t('data_uploaded')}</p>
                <p className="text-xs text-muted-foreground">sales_report_q1.csv uploaded</p>
                <p className="text-xs text-muted-foreground">2 {t('minutes_ago')}</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-start gap-3 p-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Mail className="size-4 text-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{t('csv_sent')}</p>
                <p className="text-xs text-muted-foreground">Dashboard export sent to skshivam@email.com</p>
                <p className="text-xs text-muted-foreground">15 {t('minutes_ago')}</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-start gap-3 p-3">
              <div className="rounded-full bg-primary/10 p-2">
                <FileSpreadsheet className="size-4 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{t('new_dataset')}</p>
                <p className="text-xs text-muted-foreground">customer_analytics.csv processed</p>
                <p className="text-xs text-muted-foreground">1 {t('hour_ago')}</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-start gap-3 p-3">
              <div className="rounded-full bg-amber-500/10 p-2">
                <LogIn className="size-4 text-amber-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{t('last_login')}</p>
                <p className="text-xs text-muted-foreground">New session started from Chrome, Windows</p>
                <p className="text-xs text-muted-foreground">{t('today_at')} 9:30 AM</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-sm text-primary">
              {t('view_all')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
