'use client'

import { useState } from 'react'
import { 
  Box, 
  Search, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  LogOut,
  Clock,
  ExternalLink,
  MousePointer2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useDashboardStore, Dataset } from '@/lib/store/dashboard-store'
import { toast } from 'sonner'

interface DropboxModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MOCK_FILES = [
  { id: 'db-1', name: 'Q4_Returns_Data.csv', size: '1.2 MB', date: '2 hours ago' },
  { id: 'db-2', name: 'Global_Sales_2023.csv', size: '4.5 MB', date: 'Yesterday' },
  { id: 'db-3', name: 'Customer_Feedback_Leads.csv', size: '850 KB', date: 'Mar 12, 2024' },
  { id: 'db-4', name: 'Inventory_Audit_Log.csv', size: '2.1 MB', date: 'Mar 10, 2024' },
  { id: 'db-5', name: 'Marketing_Spend_Report.csv', size: '3.3 MB', date: 'Feb 28, 2024' },
]

export function DropboxModal({ open, onOpenChange }: DropboxModalProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [importingId, setImportingId] = useState<string | null>(null)
  const { addToFileLibrary, fileLibrary } = useDashboardStore()

  const handleLogin = () => {
    setIsLoggingIn(true)
    // Simulate OAuth flow
    setTimeout(() => {
      setIsLoggedIn(true)
      setIsLoggingIn(false)
      toast.success('Successfully connected to Dropbox')
    }, 1500)
  }

  const handleImport = (file: typeof MOCK_FILES[0]) => {
    if (fileLibrary.length >= 4) {
      toast.error('File library limit reached (max 4 files).')
      return
    }

    setImportingId(file.id)
    
    // Simulate downloading and parsing
    setTimeout(() => {
      const newDataset: Dataset = {
        id: `dropbox-${file.id}-${Date.now()}`,
        name: file.name,
        uploadedAt: new Date(),
        rowCount: 1200, // Mock row count
        columns: [
          { name: 'Date', type: 'date' },
          { name: 'Region', type: 'string' },
          { name: 'Value', type: 'number' },
          { name: 'Status', type: 'boolean' },
        ],
        data: [], // In a real app, this would be the parsed CSV data
        size: 1024 * 1024 * 1.5 // Mock size
      }
      
      addToFileLibrary(newDataset)
      setImportingId(null)
      toast.success(`${file.name} imported from Dropbox`)
    }, 1200)
  }

  const filteredFiles = MOCK_FILES.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0 border-primary/20 bg-background/95 backdrop-blur-sm">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#0061FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Box className="size-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Dropbox Integration</DialogTitle>
              <DialogDescription>
                Import your datasets directly from your Dropbox cloud storage
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-0 min-h-[400px] flex flex-col">
          {!isLoggedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
              <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 relative">
                 <Box className="size-10 text-primary/40" />
                 <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-background border flex items-center justify-center">
                    <ExternalLink className="size-4 text-primary" />
                 </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect your account</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-[300px]">
                Sign in to your Dropbox account to browse and import your CSV files into Conversational BI.
              </p>
              <Button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="w-full max-w-[240px] bg-[#0061FF] hover:bg-[#0052D9] text-white gap-2 h-11"
              >
                {isLoggingIn ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>Continue with Dropbox <ChevronRight className="size-4" /></>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-6 uppercase tracking-widest font-medium">
                Secure OAuth 2.0 Connection
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b bg-muted/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search your Dropbox files..." 
                    className="pl-10 h-10 border-primary/10 bg-background focus-visible:ring-primary/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 max-h-[400px]">
                <div className="p-2 space-y-1">
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map((file) => {
                      const isImporting = importingId === file.id
                      const isAlreadyImported = fileLibrary.some(f => f.name === file.name)

                      return (
                        <div 
                          key={file.id}
                          className={cn(
                            "group flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent",
                            "hover:bg-primary/5 hover:border-primary/10 cursor-default"
                          )}
                        >
                          <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                            <FileSpreadsheet className="size-5 text-emerald-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="size-3" /> {file.date}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {file.size}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isAlreadyImported ? (
                              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 gap-1 py-1">
                                <CheckCircle2 className="size-3" /> Imported
                              </Badge>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 gap-1.5 border-primary/20 hover:bg-primary hover:text-primary-foreground group-hover:border-primary transition-all"
                                onClick={() => handleImport(file)}
                                disabled={!!importingId}
                              >
                                {isImporting ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <>Import <Download className="size-3" /></>
                                )}
                              </Button>
                            )}
                            
                            {/* Drag handle simulation */}
                            <div 
                              className="size-8 rounded-lg border flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Drag to dashboard"
                            >
                              <MousePointer2 className="size-4 rotate-[-15deg]" />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-12 text-center">
                      <Search className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium">No CSV files found</p>
                      <p className="text-xs text-muted-foreground">Try a different search term</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium">Connected as dropbox_user@example.com</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => setIsLoggedIn(false)}
                >
                  <LogOut className="size-3 mr-1.5" /> Disconnect
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
