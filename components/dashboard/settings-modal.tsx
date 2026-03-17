'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/contexts/settings-context'
import { 
  X, 
  Settings, 
  Database, 
  Palette, 
  Bell,
  User,
  Sparkles,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/lib/store/dashboard-store'
import { toast } from 'sonner'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

type SettingsTab = 'general' | 'data' | 'appearance' | 'notifications'

const accentColors = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
]

const aiModels = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
]

const timeZones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

const languages = [
  { value: 'en-uk', label: 'English (UK)' },
  { value: 'en', label: 'English (US)' },
  { value: 'ar', label: 'العربية (Arabic)' },
  { value: 'ja', label: '日本語 (Japanese)' },
  { value: 'hi', label: 'हिंदी (Hindi)' },
]

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { accentColor, setAccentColor, profile, setProfile, t, language, setLanguage } = useSettings()
  const { dataset, setDataset, clearQueryHistory } = useDashboardStore()
  
  // Form state for profile
  const [displayName, setDisplayName] = useState(profile?.firstName + ' ' + profile?.lastName || '')
  const [email, setEmail] = useState(profile?.emailId || '')
  const [phoneNo, setPhoneNo] = useState(profile?.phoneNo || '')
  const [timeZone, setTimeZone] = useState('Asia/Kolkata')
  
  // AI Settings
  const [aiModel, setAiModel] = useState('gpt-4o-mini')
  const [autoGenerateInsights, setAutoGenerateInsights] = useState(true)
  
  // Appearance
  const [appearance, setAppearance] = useState<string>(theme || 'system')
  
  // Notification settings
  const [responseNotif, setResponseNotif] = useState<'push' | 'push_email'>('push')
  const [tasksNotif, setTasksNotif] = useState<'push' | 'push_email'>('push_email')
  const [projectsNotif, setProjectsNotif] = useState<'push' | 'push_email'>('push_email')

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.firstName + ' ' + profile.lastName)
      setEmail(profile.emailId)
      setPhoneNo(profile.phoneNo)
    }
  }, [profile])

  useEffect(() => {
    if (appearance !== theme) {
      setTheme(appearance)
    }
  }, [appearance, setTheme, theme])

  if (!open) return null

  const handleSaveProfile = () => {
    const names = displayName.trim().split(' ')
    const firstName = names[0] || ''
    const lastName = names.slice(1).join(' ') || ''
    setProfile({
      ...profile,
      firstName,
      lastName,
      emailId: email,
      phoneNo: phoneNo,
    })
    toast.success(t('save_changes'))
  }

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color as 'blue' | 'red' | 'green' | 'yellow')
  }

  const handleClearData = () => {
    setDataset(null)
    clearQueryHistory()
    toast.success(t('clear_data'))
  }

  const tabs = [
    { id: 'general' as const, labelKey: 'general', icon: Settings },
    { id: 'data' as const, labelKey: 'data', icon: Database },
    { id: 'appearance' as const, labelKey: 'appearance', icon: Palette },
    { id: 'notifications' as const, labelKey: 'notifications', icon: Bell },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-lg border bg-card shadow-lg animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">{t('settings')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings_description')}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="size-5" />
            <span className="sr-only">{t('close')}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="size-4" />
                {t(tab.labelKey)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-1">
                  <User className="size-4 text-muted-foreground" />
                  <h3 className="font-semibold">{t('profile')}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t('profile_description')}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">{t('display_name')}</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="User"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNo">{t('phone_number')}</Label>
                    <Input
                      id="phoneNo"
                      type="tel"
                      value={phoneNo}
                      onChange={(e) => setPhoneNo(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeZone">{t('time_zone')}</Label>
                    <Select value={timeZone} onValueChange={setTimeZone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeZones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="language">{t('language')}</Label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as 'en-uk' | 'en' | 'ar' | 'ja' | 'hi')}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t('language_description')}
                    </p>
                  </div>
                </div>
                
                <Button onClick={handleSaveProfile} className="mt-4">
                  {t('save_changes')}
                </Button>
              </div>

              {/* AI Settings Section */}
              <div className="rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="size-4 text-muted-foreground" />
                  <h3 className="font-semibold">{t('ai_settings')}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t('ai_settings_description')}</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('ai_model')}</Label>
                    <Select value={aiModel} onValueChange={setAiModel}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {aiModels.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('auto_generate')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('auto_generate_description')}
                      </p>
                    </div>
                    <Switch
                      checked={autoGenerateInsights}
                      onCheckedChange={setAutoGenerateInsights}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Current Dataset */}
              <div className="rounded-lg border p-6">
                <h3 className="font-semibold mb-1">{t('current_dataset')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('dataset_description')}</p>
                
                {dataset ? (
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Name:</span> {dataset.name}</p>
                    <p className="text-sm"><span className="font-medium">Rows:</span> {dataset.rowCount}</p>
                    <p className="text-sm"><span className="font-medium">Columns:</span> {dataset.columns.length}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Database className="size-12 text-muted-foreground/50 mb-4" />
                    <h4 className="font-semibold mb-1">{t('no_dataset')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('upload_prompt')}
                    </p>
                    <Button variant="outline" onClick={() => { onClose(); router.push('/upload') }}>
                      <Upload className="size-4 mr-2" />
                      {t('upload_data')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="rounded-lg border border-destructive/30 p-6">
                <h3 className="font-semibold text-destructive mb-1">{t('danger_zone')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('danger_description')}</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('clear_all_data')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('clear_description')}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleClearData}>
                    {t('clear_data')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <h3 className="font-semibold mb-4">{t('theme')}</h3>
                
                <div className="space-y-4">
                  {/* Appearance Mode */}
                  <div className="flex items-center justify-between">
                    <Label>{t('mode')}</Label>
                    <Select value={appearance} onValueChange={setAppearance}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">{t('system')}</SelectItem>
                        <SelectItem value="light">{t('light')}</SelectItem>
                        <SelectItem value="dark">{t('dark')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Accent Color */}
                  <div className="flex items-center justify-between">
                    <Label>{t('accent_color')}</Label>
                    <div className="flex items-center gap-2">
                      {accentColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => handleAccentColorChange(color.value)}
                          className={cn(
                            "size-8 rounded-full transition-all",
                            color.class,
                            accentColor === color.value 
                              ? "ring-2 ring-offset-2 ring-offset-background ring-foreground" 
                              : "opacity-60 hover:opacity-100"
                          )}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <h3 className="font-semibold mb-4">{t('notification_preferences')}</h3>
                
                <div className="space-y-4">
                  {/* Responses */}
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <Label className="font-medium">{t('responses')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('responses_description')}
                      </p>
                    </div>
                    <Select value={responseNotif} onValueChange={(v) => setResponseNotif(v as 'push' | 'push_email')}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="push">{t('push')}</SelectItem>
                        <SelectItem value="push_email">{t('push_email')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tasks */}
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <Label className="font-medium">{t('tasks')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('tasks_description')}
                      </p>
                    </div>
                    <Select value={tasksNotif} onValueChange={(v) => setTasksNotif(v as 'push' | 'push_email')}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="push">{t('push')}</SelectItem>
                        <SelectItem value="push_email">{t('push_email')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Projects */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="font-medium">{t('projects')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('projects_description')}
                      </p>
                    </div>
                    <Select value={projectsNotif} onValueChange={(v) => setProjectsNotif(v as 'push' | 'push_email')}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="push">{t('push')}</SelectItem>
                        <SelectItem value="push_email">{t('push_email')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
