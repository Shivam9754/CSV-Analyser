'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MessageSquareText,
  Upload,
  Lightbulb,
  History,
  Sparkles,
  User,
  Settings,
  Globe,
  LogOut,
  ChevronUp,
  Box,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSettings } from '@/contexts/settings-context'
import { ProfileModal } from './profile-modal'
import { SettingsModal } from './settings-modal'
import { DropboxModal } from './dropbox-modal'

const navigationKeys = [
  {
    key: 'current_chat',
    href: '/',
    icon: MessageSquareText,
  },
  {
    key: 'data_upload',
    href: '/upload',
    icon: Upload,
  },
  {
    key: 'insights',
    href: '/insights',
    icon: Lightbulb,
  },
  {
    key: 'query_history',
    href: '/history',
    icon: History,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, profile } = useSettings()
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dropboxOpen, setDropboxOpen] = useState(false)

  const handleLogout = () => {
    router.push('/login')
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="group-data-[state=collapsed]:hidden">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquareText className="size-4" />
                  </div>
                  <span className="font-bold text-lg">Conversational BI</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationKeys.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={t(item.key)}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{t(item.key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                {/* Dropbox Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setDropboxOpen(true)}
                    tooltip="Dropbox"
                    className="text-primary hover:text-primary"
                  >
                    <Box className="size-4" />
                    <span>Dropbox</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                        {profile?.firstName?.charAt(0) || 'U'}{profile?.lastName?.charAt(0) || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{profile?.firstName || 'User'} {profile?.lastName || ''}</span>
                      <span className="truncate text-xs text-muted-foreground">{profile?.emailId || ''}</span>
                    </div>
                    <ChevronUp className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem className="gap-2" onClick={() => setProfileOpen(true)}>
                    <User className="size-4" />
                    {t('profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => setSettingsOpen(true)}>
                    <Settings className="size-4" />
                    {t('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" asChild>
                    <a href="https://conversational-bi-help.vercel.app" target="_blank" rel="noopener noreferrer">
                      <Globe className="size-4" />
                      {t('help')}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={handleLogout}>
                    <LogOut className="size-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        
        <SidebarRail />
      </Sidebar>

      {/* Modals */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DropboxModal open={dropboxOpen} onOpenChange={setDropboxOpen} />
    </>
  )
}
