'use client'

import { useState, useCallback } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onRemove?: () => void
  isUploading?: boolean
  uploadProgress?: number
  accept?: string
  maxSize?: number // in MB
}

export function FileUpload({
  onFileSelect,
  onRemove,
  isUploading = false,
  uploadProgress = 0,
  accept = '.csv',
  maxSize = 150,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): boolean => {
    setError(null)

    // Check file type
    const validTypes = accept.split(',').map(t => t.trim())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.some(t => t === fileExtension || t === file.type)) {
      setError(`Invalid file type. Please upload ${accept} files.`)
      return false
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      setError(`File too large. Maximum size is ${maxSize}MB.`)
      return false
    }

    return true
  }, [accept, maxSize])

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }, [validateFile, onFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    onRemove?.()
  }, [onRemove])

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed p-8 transition-all",
          "hover:border-primary/50 hover:bg-accent/50",
          isDragging && "border-primary bg-primary/5",
          error && "border-destructive/50",
          selectedFile && !error && "border-primary/50 bg-primary/5"
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {selectedFile && !error ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
                className="text-muted-foreground"
              >
                <X className="size-4 mr-1" />
                Remove
              </Button>
            </>
          ) : error ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please try again with a valid file
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Drag and drop your CSV file here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse (max {maxSize}MB)
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <File className="size-4" />
                <span>Supported format: CSV</span>
              </div>
            </>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Processing file...</span>
            <span className="font-medium">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  )
}
