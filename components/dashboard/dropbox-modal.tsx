'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  FileSpreadsheet,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDashboardStore, Dataset } from '@/lib/store/dashboard-store'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface DropboxModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Extend window to include Dropbox Chooser types
declare global {
  interface Window {
    Dropbox?: {
      choose: (options: {
        success: (files: DropboxFile[]) => void
        cancel: () => void
        linkType: 'preview' | 'direct'
        multiselect: boolean
        extensions?: string[]
        folderselect?: boolean
      }) => void
    }
  }
}

interface DropboxFile {
  name: string
  link: string
  bytes: number
  icon: string
  thumbnailLink?: string
  isDir: boolean
}

const APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY

export function DropboxModal({ open, onOpenChange }: DropboxModalProps) {
  const [sdkReady, setSdkReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importedFile, setImportedFile] = useState<string | null>(null)
  const { addToFileLibrary, fileLibrary } = useDashboardStore()

  // Load Dropbox Chooser SDK dynamically
  useEffect(() => {
    if (!APP_KEY) return

    const existing = document.getElementById('dropboxjs')
    if (existing) {
      setSdkReady(true)
      return
    }

    const script = document.createElement('script')
    script.id = 'dropboxjs'
    script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
    script.setAttribute('data-app-key', APP_KEY)
    script.onload = () => setSdkReady(true)
    script.onerror = () => toast.error('Failed to load Dropbox SDK')
    document.head.appendChild(script)
  }, [])

  const handleChoose = useCallback(() => {
    if (!window.Dropbox) {
      toast.error('Dropbox SDK not loaded yet. Please try again.')
      return
    }

    if (fileLibrary.length >= 4) {
      toast.error('File library limit reached (max 4 files).')
      return
    }

    window.Dropbox.choose({
      success: async (files) => {
        const file = files[0]
        if (!file) return

        // Validate it's a CSV
        if (!file.name.toLowerCase().endsWith('.csv')) {
          toast.error('Only CSV files are supported. Please pick a .csv file.')
          return
        }

        setIsLoading(true)

        try {
          // Fetch the file content
          const response = await fetch(file.link)
          if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`)
          const text = await response.text()

          // Parse with PapaParse
          const parsed = Papa.parse<Record<string, string>>(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
          })

          if (parsed.errors.length > 0 && parsed.data.length === 0) {
            throw new Error('Failed to parse CSV file.')
          }

          const headers = parsed.meta.fields || []
          // Detect column types
          const columns = headers.map((name) => {
            const values = parsed.data.map((r) => r[name]).filter(Boolean)
            const numericCount = values.filter((v) => !isNaN(Number(v)) && v !== '').length
            const dateCount = values.filter((v) => !isNaN(Date.parse(v)) && v.length > 4).length
            let type: 'string' | 'number' | 'date' | 'boolean' = 'string'
            if (numericCount > values.length * 0.8) type = 'number'
            else if (dateCount > values.length * 0.8) type = 'date'
            return { name, type }
          })

          const dataset: Dataset = {
            id: `dropbox-${Date.now()}`,
            name: file.name,
            uploadedAt: new Date(),
            rowCount: parsed.data.length,
            columns,
            data: parsed.data,
            size: file.bytes,
          }

          addToFileLibrary(dataset)
          setImportedFile(file.name)
          toast.success(`✓ ${file.name} imported from Dropbox (${parsed.data.length.toLocaleString()} rows)`)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          toast.error(`Import failed: ${msg}`)
        } finally {
          setIsLoading(false)
        }
      },
      cancel: () => {
        // User closed the picker — do nothing
      },
      linkType: 'direct',
      multiselect: false,
      extensions: ['.csv'],
    })
  }, [fileLibrary, addToFileLibrary])

  const noAppKey = !APP_KEY

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0 border-primary/20 bg-background/95 backdrop-blur-sm">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#0061FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Box className="size-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Dropbox</DialogTitle>
              <DialogDescription>
                Pick a CSV file directly from your Dropbox account
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 flex flex-col items-center text-center gap-6 min-h-[300px] justify-center">
          {noAppKey ? (
            /* No App Key configured */
            <div className="w-full animate-in fade-in duration-300">
              <div className="size-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="size-8 text-amber-500" />
              </div>
              <h3 className="text-base font-semibold mb-2">Dropbox App Key Missing</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-[320px] mx-auto">
                To enable Dropbox, add your App Key to{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env.local</code>:
              </p>
              <div className="bg-muted/60 rounded-xl p-3 text-left font-mono text-xs text-muted-foreground border w-full mb-6">
                NEXT_PUBLIC_DROPBOX_APP_KEY=your_app_key_here
              </div>
              <a
                href="https://www.dropbox.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#0061FF] hover:underline font-medium"
              >
                Get your free App Key at dropbox.com/developers
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          ) : importedFile ? (
            /* Success state */
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </div>
              <h3 className="text-base font-semibold mb-1">File Imported!</h3>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2 justify-center">
                <FileSpreadsheet className="size-4 text-emerald-500" />
                {importedFile}
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Your dataset is ready. Close this panel and start analyzing.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setImportedFile(null) }}
                >
                  Import Another
                </Button>
                <Button
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Start Analyzing →
                </Button>
              </div>
            </div>
          ) : (
            /* Ready state */
            <div className="animate-in fade-in zoom-in duration-300 w-full">
              <div className="size-20 rounded-full bg-[#0061FF]/10 flex items-center justify-center mx-auto mb-5 relative">
                <Box className="size-10 text-[#0061FF]/60" />
                <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-background border-2 border-[#0061FF]/20 flex items-center justify-center">
                  <ExternalLink className="size-4 text-[#0061FF]" />
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">Connect to Dropbox</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-[300px] mx-auto">
                Click below to open the Dropbox file picker. Log in with your Dropbox account and select any CSV file.
              </p>

              <Button
                onClick={handleChoose}
                disabled={!sdkReady || isLoading}
                className={cn(
                  "w-full max-w-[260px] h-11 gap-2 font-medium transition-all",
                  "bg-[#0061FF] hover:bg-[#0052D9] text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importing file…
                  </>
                ) : !sdkReady ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading SDK…
                  </>
                ) : (
                  <>
                    <Box className="size-4" />
                    Choose from Dropbox
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground mt-5 uppercase tracking-widest font-medium">
                Powered by Dropbox Chooser SDK · CSV only
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
