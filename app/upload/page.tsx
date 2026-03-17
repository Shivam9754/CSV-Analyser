'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import {
  ArrowRight, Database, FileSpreadsheet, Trash2, CheckCircle2,
  Calendar, Hash, Type, Clock, FolderOpen,
  BarChart3, Eye, X, AlertCircle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { FileUpload } from '@/components/dashboard/file-upload'
import { DataPreview } from '@/components/dashboard/data-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboardStore, type DataColumn, type Dataset } from '@/lib/store/dashboard-store'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

function inferColumnType(values: unknown[]): 'string' | 'number' | 'date' | 'boolean' {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonEmpty.length === 0) return 'string'
  if (nonEmpty.every(v => ['true','false','1','0','yes','no'].includes(String(v).toLowerCase()))) return 'boolean'
  if (nonEmpty.every(v => { const n = Number(String(v).replace(/,/g,'')); return !isNaN(n) && isFinite(n) })) return 'number'
  if (nonEmpty.every(v => !isNaN(new Date(v as string).getTime()))) return 'date'
  return 'string'
}

const typeIcons = { string: Type, number: Hash, date: Calendar, boolean: CheckCircle2 }
const typeColors = {
  string: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  number: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  date: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  boolean: 'bg-primary/10 text-primary border-primary/20',
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB'
  return (bytes/(1024*1024)).toFixed(1) + ' MB'
}

export default function UploadPage() {
  const router = useRouter()
  const { setDataset, addToFileLibrary, fileLibrary, removeFromFileLibrary, selectDatasetFromLibrary, dataset } = useDashboardStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsedData, setParsedData] = useState<{ columns: DataColumn[]; data: Record<string,unknown>[]; fileName: string; fileSize: number } | null>(null)
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    setIsProcessing(true); setProgress(0); setParsedData(null)
    Papa.parse<Record<string,string>>(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        setProgress(50)
        const data = results.data
        if (!data.length) { toast.error('File is empty'); setIsProcessing(false); return }
        const columnNames = Object.keys(data[0])
        const columns: DataColumn[] = columnNames.map(name => ({
          name, type: inferColumnType(data.slice(0,100).map(r => r[name])),
          sampleValues: data.slice(0,5).map(r => r[name]),
        }))
        setProgress(100)
        setParsedData({ columns, data: data as Record<string,unknown>[], fileName: file.name, fileSize: file.size })
        setIsProcessing(false)
        toast.success(`Parsed ${data.length.toLocaleString()} rows`)
      },
      error: (err) => { toast.error('Parse error: ' + err.message); setIsProcessing(false) },
    })
  }, [])

  const handleConfirmUpload = useCallback(() => {
    if (!parsedData) return
    if (fileLibrary.length >= 4) {
      toast.error('File library limit reached (max 4 files). Please remove a file first.')
      return
    }
    const ds: Dataset = {
      id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36), name: parsedData.fileName, columns: parsedData.columns,
      rowCount: parsedData.data.length, data: parsedData.data,
      uploadedAt: new Date(), size: parsedData.fileSize,
    }
    addToFileLibrary(ds); setDataset(ds)
    toast.success('Saved to library and activated!')
    setParsedData(null); router.push('/')
  }, [parsedData, addToFileLibrary, setDataset, router])

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Upload</h2>
          <p className="text-muted-foreground">Upload CSV files and manage your data library</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="size-5" />Upload New File</CardTitle>
                <CardDescription>Upload a CSV file — it will be saved to your library for reuse.</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFileSelect={handleFileSelect} 
                  onRemove={() => setParsedData(null)}
                  isUploading={isProcessing} 
                  uploadProgress={progress} 
                />
              </CardContent>
            </Card>

            {parsedData && (
              <>
                <DataPreview columns={parsedData.columns} data={parsedData.data} totalRows={parsedData.data.length} />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setParsedData(null)}><X className="size-4 mr-2" />Cancel</Button>
                  <Button size="lg" onClick={handleConfirmUpload}>
                    <Database className="size-4 mr-2" />Save to Library &amp; Analyze<ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {previewDataset && !parsedData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Eye className="size-4" />Preview: {previewDataset.name}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewDataset(null)}><X className="size-4" /></Button>
                </div>
                <DataPreview columns={previewDataset.columns} data={previewDataset.data} totalRows={previewDataset.rowCount} />
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="size-5" />File Library
                  {fileLibrary.length > 0 && <Badge variant="secondary" className="ml-auto">{fileLibrary.length} files</Badge>}
                </CardTitle>
                <CardDescription>All uploaded files. Click any to activate for analysis.</CardDescription>
              </CardHeader>
              <CardContent>
                {fileLibrary.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="rounded-full bg-primary/10 p-2">
                      <FileSpreadsheet className="size-4 text-primary" />
                    </div>
                    <p className="font-medium">No files yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Upload your first CSV to get started</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-2">
                    <div className="space-y-3">
                      {fileLibrary.map((file) => {
                        const isActive = dataset?.id === file.id
                        return (
                          <div
                            key={file.id}
                            className={cn(
                              "group rounded-lg border p-4 transition-all cursor-pointer hover:border-primary/50 hover:bg-accent/30",
                              isActive && "border-primary bg-primary/5"
                            )}
                            onClick={() => { selectDatasetFromLibrary(file.id); toast.success('Dataset activated'); router.push('/') }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet className="size-4 text-primary shrink-0" />
                                  <p className="font-medium text-sm truncate">{file.name}</p>
                                  {isActive && <Badge className="text-[10px] px-1.5 py-0 h-4 shrink-0">Active</Badge>}
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Hash className="size-3" />{file.rowCount.toLocaleString()} rows</span>
                                  <span>{file.columns.length} cols</span>
                                  {file.size && <span>{formatFileSize(file.size)}</span>}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <Clock className="size-3" />
                                  {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => { e.stopPropagation(); setPreviewDataset(file) }} title="Preview">
                                  <Eye className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); removeFromFileLibrary(file.id); toast.success('Removed') }} title="Remove">
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {file.columns.slice(0,5).map(col => {
                                const Icon = typeIcons[col.type]
                                return (
                                  <Badge key={col.name} variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 gap-1", typeColors[col.type])}>
                                    <Icon className="size-2.5" />{col.name.length > 10 ? col.name.slice(0,10)+'…' : col.name}
                                  </Badge>
                                )
                              })}
                              {file.columns.length > 5 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">+{file.columns.length-5}</Badge>}
                            </div>
                            {isActive
                              ? <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium"><CheckCircle2 className="size-3.5" />Active — being analyzed</div>
                              : <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-primary transition-colors"><BarChart3 className="size-3.5" />Click to activate</div>
                            }
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="size-4 text-amber-500" />Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5">
                <p>• Files persist across browser sessions</p>
                <p>• Click any file to make it active for Chat &amp; Insights</p>
                <p>• Preview any file without changing active dataset</p>
                <p>• Only the active file is used in analysis</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
