'use client'

import { Hash, Type, Calendar, ToggleLeft } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { DataColumn } from '@/lib/store/dashboard-store'

interface DataPreviewProps {
  columns: DataColumn[]
  data: Record<string, unknown>[]
  totalRows: number
  previewRows?: number
}

const typeIcons = {
  string: Type,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
}

const typeColors = {
  string: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  number: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  date: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  boolean: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

export function DataPreview({
  columns,
  data,
  totalRows,
  previewRows = 10,
}: DataPreviewProps) {
  const previewData = data.slice(0, previewRows)

  return (
    <div className="space-y-6">
      {/* Column Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detected Columns</CardTitle>
          <CardDescription>
            {columns.length} columns detected with automatic type inference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {columns.map((column) => {
              const Icon = typeIcons[column.type]
              return (
                <Badge
                  key={column.name}
                  variant="outline"
                  className={typeColors[column.type]}
                >
                  <Icon className="size-3 mr-1" />
                  {column.name}
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Preview</CardTitle>
          <CardDescription>
            Showing {previewData.length} of {totalRows.toLocaleString()} rows
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="p-6 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.name} className="font-medium">
                        <div className="flex items-center gap-2">
                          {column.name}
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {column.type}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((column) => (
                        <TableCell key={column.name} className="font-mono text-sm">
                          {formatCellValue(row[column.name], column.type)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function formatCellValue(value: unknown, type: string): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  switch (type) {
    case 'number':
      const num = Number(value)
      if (isNaN(num)) return String(value)
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
    case 'boolean':
      return value ? 'true' : 'false'
    case 'date':
      try {
        return new Date(value as string).toLocaleDateString()
      } catch {
        return String(value)
      }
    default:
      const str = String(value)
      return str.length > 50 ? str.substring(0, 47) + '...' : str
  }
}
