// app/api/statistical-analysis/route.ts

import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

interface FilterItem {
  column: string
  operator: 'equals' | 'contains' | '>=' | '<='
  value: string
}

interface FormulaItem {
  name: string
  colA: string
  operator: '+' | '-' | '*' | '/'
  colB: string
  multiplier?: number
}

interface GroupEntry {
  _counts?: Record<string, number>
  [key: string]: any // Allows any dynamically aggregated column value without index conflicts
}

// Safe custom virtual formulas evaluation
function applyFormulas(data: any[], formulas: FormulaItem[]): any[] {
  if (!formulas || formulas.length === 0) return data
  return data.map(row => {
    const newRow = { ...row }
    formulas.forEach(f => {
      const valA = parseFloat(String(row[f.colA] ?? 0).replace(/[,$%]/g, '')) || 0
      const valB = parseFloat(String(row[f.colB] ?? 0).replace(/[,$%]/g, '')) || 0
      let computed = 0
      
      if (f.operator === '+') computed = valA + valB
      else if (f.operator === '-') computed = valA - valB
      else if (f.operator === '*') computed = valA * valB
      else if (f.operator === '/') computed = valA / (valB || 1) // Safe divide

      newRow[f.name] = parseFloat((computed * (f.multiplier || 1)).toFixed(4))
    })
    return newRow
  })
}

// Applies inline row filters on the data
function applyFilters(data: any[], filters: FilterItem[]): any[] {
  if (!filters || filters.length === 0) return data
  return data.filter(row => {
    return filters.every(f => {
      const rowVal = row[f.column]
      if (rowVal === undefined || rowVal === null) return false
      
      const valStr = String(rowVal).toLowerCase()
      const compStr = String(f.value).toLowerCase()
      
      if (f.operator === 'equals') return valStr === compStr
      if (f.operator === 'contains') return valStr.includes(compStr)
      if (f.operator === '>=') return parseFloat(valStr) >= parseFloat(compStr)
      if (f.operator === '<=') return parseFloat(valStr) <= parseFloat(compStr)
      return true
    })
  })
}

// Processes dynamic grouping and multi-aggregation formats on the server
function aggregateData({
  data,
  xAxis,
  yAxes,
  splitBy,
  aggregation
}: {
  data: any[]
  xAxis: string
  yAxes: string[]
  splitBy?: string
  aggregation: 'sum' | 'avg' | 'count'
}): Record<string, any>[] {
  const groupedMap: Record<string, GroupEntry> = {}
  
  for (const row of data) {
    const xVal = String(row[xAxis] ?? 'Unknown')
    if (!groupedMap[xVal]) {
      groupedMap[xVal] = {}
      if (aggregation === 'avg') {
        groupedMap[xVal]._counts = {}
      }
    }

    const values = groupedMap[xVal]

    if (splitBy) {
      // Split Dimension Mode: Focus on grouping primary attribute (yAxes[0]) by splitBy category values
      const splitVal = String(row[splitBy] ?? 'Unknown')
      const yCol = yAxes[0]
      const yVal = parseFloat(String(row[yCol] ?? 0).replace(/[,$%]/g, '')) || 0
      
      if (aggregation === 'sum') {
        values[splitVal] = (values[splitVal] || 0) + yVal
      } else if (aggregation === 'avg') {
        values[splitVal] = (values[splitVal] || 0) + yVal
        values._counts![splitVal] = (values._counts![splitVal] || 0) + 1
      } else if (aggregation === 'count') {
        values[splitVal] = (values[splitVal] || 0) + 1
      }
    } else {
      // Comparative Attribute Mode: Compare multiple Y-Axes together
      yAxes.forEach(y => {
        const yVal = parseFloat(String(row[y] ?? 0).replace(/[,$%]/g, '')) || 0
        if (aggregation === 'sum') {
          values[y] = (values[y] || 0) + yVal
        } else if (aggregation === 'avg') {
          values[y] = (values[y] || 0) + yVal
          values._counts![y] = (values._counts![y] || 0) + 1
        } else if (aggregation === 'count') {
          values[y] = (values[y] || 0) + 1
        }
      })
    }
  }

  // Convert map to array structure format for Recharts
  return Object.entries(groupedMap).map(([xVal, values]) => {
    const resultObj: Record<string, any> = { [xAxis]: xVal }
    const counts = values._counts
    
    Object.entries(values).forEach(([key, val]) => {
      if (key === '_counts') return
      if (aggregation === 'avg' && counts && counts[key]) {
        resultObj[key] = parseFloat((val / counts[key]).toFixed(2))
      } else {
        resultObj[key] = parseFloat((Number(val) || 0).toFixed(2))
      }
    })
    
    return resultObj
  })
}

function calculateNumericStats(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = sum / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)
  const median = sorted[Math.floor(sorted.length / 2)]

  const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  return { min, max, sum, avg, median, stdDev }
}

export async function POST(req: Request) {
  try {
    const { data, xAxis, yAxes, chartType, rowLimit, aggregation, sortDirection, splitBy, filters, formulas } = await req.json()

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    if (!xAxis || !yAxes || !Array.isArray(yAxes) || yAxes.length === 0) {
      return NextResponse.json({ error: 'X-Axis and at least one Y-Axis is required' }, { status: 400 })
    }

    // 1. Process custom formulas (virtual calculated columns)
    const formulatedData = applyFormulas(data, formulas || [])

    // 2. Apply custom row filters
    const filteredRows = applyFilters(formulatedData, filters || [])

    // 3. Slice dataset based on requested Row Limits
    let limitedRows = filteredRows
    if (rowLimit && rowLimit !== 'all') {
      const numLimit = parseInt(rowLimit, 10)
      if (!isNaN(numLimit)) {
        limitedRows = filteredRows.slice(0, numLimit)
      }
    }

    // 4. Group & Aggregate data
    const aggregatedData = aggregateData({
      data: limitedRows,
      xAxis,
      yAxes,
      splitBy,
      aggregation: aggregation || 'sum'
    })

    // 5. Apply Value-Based sorting to the final aggregated dataset
    if (sortDirection && sortDirection !== 'none') {
      const primaryKey = splitBy 
        ? Object.keys(aggregatedData[0] || {}).find(k => k !== xAxis) 
        : yAxes[0]
      
      if (primaryKey) {
        aggregatedData.sort((a, b) => {
          const valA = Number(a[primaryKey]) || 0
          const valB = Number(b[primaryKey]) || 0
          return sortDirection === 'asc' ? valA - valB : valB - valA
        })
      }
    }

    // 6. Compute statistics for the AI Prompt Context
    const allStats: Record<string, any> = {}
    yAxes.forEach(y => {
      const rawValues = limitedRows
        .map(row => {
          const val = row[y]
          return typeof val === 'number' ? val : parseFloat(String(val).replace(/[,$%]/g, ''))
        })
        .filter((val): val is number => !isNaN(val))
      
      allStats[y] = calculateNumericStats(rawValues)
    })

    // 7. Call OpenAI with clean logical parameters
    const systemPrompt = `You are an expert data analyst and statistician.`
    const prompt = `Analyze this aggregated chart data with complex business logic:
    - Chart Representation: ${chartType}
    - Aggregation Function applied: ${aggregation || 'sum'}
    - Row Limit Constraint: ${rowLimit} (Evaluated ${limitedRows.length} total raw rows)
    - X-Axis Field (Categories): "${xAxis}"
    - Comparative Attributes: ${yAxes.map(y => `"${y}"`).join(', ')}
    ${splitBy ? `- Secondary Segment Category (Split Series): "${splitBy}"` : ''}
    ${filters && filters.length > 0 ? `- Filters applied: ${JSON.stringify(filters)}` : ''}

    Aggregated Dataset Results:
    ${JSON.stringify(aggregatedData.slice(0, 30), null, 2)}

    Underlying Variable Raw Statistics:
    ${JSON.stringify(allStats, null, 2)}

    Please produce an analytical summary (2-3 paragraphs). Compare and contrast indicators across categories. Highlight trends, distributions, and outliers. Focus entirely on professional analysis.`

    const { text: summary } = await generateText({
      model: openai.chat('gpt-4o-mini'),
      system: systemPrompt,
      prompt: prompt,
    })

    return NextResponse.json({
      aggregatedData,
      allStats,
      summary,
    })

  } catch (error) {
    console.error('Statistical Analysis API Error:', error)
    return NextResponse.json({ error: 'Failed to generate statistical analysis' }, { status: 500 })
  }
}