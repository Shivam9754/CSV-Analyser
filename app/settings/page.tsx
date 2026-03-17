'use client'

import { useState } from 'react'
import { Settings, Database, Palette, Bell, User, Shield } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDashboardStore } from '@/lib/store/dashboard-store'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { dataset, setDataset, clearQueryHistory } = useDashboardStore()
  const [notifications, setNotifications] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [chartAnimations, setChartAnimations] = useState(true)

  const handleClearData = () => {
    setDataset(null)
    clearQueryHistory()
    toast.success('All data cleared successfully')
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your dashboard preferences and data
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="size-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="size-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="size-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="size-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-4" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" placeholder="Your name" defaultValue="User" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" defaultValue="user@example.com" />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-4" />
                  AI Settings
                </CardTitle>
                <CardDescription>
                  Configure AI behavior for dashboard generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Select defaultValue="gpt-4o-mini">
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recommended)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="claude-3">Claude 3 Sonnet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-generate insights</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate insights when data changes
                    </p>
                  </div>
                  <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Dataset</CardTitle>
                <CardDescription>
                  Information about your uploaded data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dataset ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Dataset Name</p>
                        <p className="font-medium">{dataset.name}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Columns</p>
                        <p className="font-medium">{dataset.columns.length}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Rows</p>
                        <p className="font-medium">{dataset.rowCount.toLocaleString()}</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Column Schema</p>
                      <div className="flex flex-wrap gap-2">
                        {dataset.columns.map(col => (
                          <span key={col.name} className="rounded-md bg-muted px-2 py-1 text-xs">
                            {col.name} <span className="text-muted-foreground">({col.type})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Database className="mx-auto size-12 text-muted-foreground/50" />
                    <h3 className="mt-4 font-semibold">No dataset loaded</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Upload a CSV file to start analyzing your data
                    </p>
                    <Button className="mt-4" onClick={() => window.location.href = '/upload'}>
                      Upload Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that affect your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Clear All Data</p>
                    <p className="text-sm text-muted-foreground">
                      Remove uploaded dataset and query history
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleClearData}>
                    Clear Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Appearance</CardTitle>
                <CardDescription>
                  Customize how your dashboard looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Chart Animations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable smooth animations for charts
                    </p>
                  </div>
                  <Switch checked={chartAnimations} onCheckedChange={setChartAnimations} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Default Chart Colors</Label>
                  <Select defaultValue="default">
                    <SelectTrigger>
                      <SelectValue placeholder="Select color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="vibrant">Vibrant</SelectItem>
                      <SelectItem value="pastel">Pastel</SelectItem>
                      <SelectItem value="monochrome">Monochrome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what updates you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for important insights
                    </p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly summary reports via email
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alert on Anomalies</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when AI detects unusual patterns
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
