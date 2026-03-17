import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

export const maxDuration = 60

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

// Insight schema
const insightSchema = z.object({
  id: z.string(),
  type: z.enum(['positive', 'negative', 'warning', 'info']),
  title: z.string(),
  description: z.string(),
  metric: z.string().nullable(),
  change: z.number().nullable(),
  category: z.string(),
})

// Feedback analysis schema
const feedbackAnalysisSchema = z.object({
  pros: z.array(z.object({
    title: z.string(),
    description: z.string(),
    percentage: z.number(),
  })),
  cons: z.array(z.object({
    title: z.string(),
    description: z.string(),
    percentage: z.number(),
  })),
  sentimentScore: z.number(),
  totalReviews: z.number(),
})

// Document analysis schema
const documentAnalysisSchema = z.object({
  keyPoints: z.array(z.object({
    title: z.string(),
    description: z.string(),
    importance: z.enum(['high', 'medium', 'low']),
    category: z.string(),
  })),
  summary: z.string(),
})

// Chart data schema
const chartDataSchema = z.object({
  labels: z.array(z.string()),
  datasets: z.array(z.object({
    label: z.string(),
    data: z.array(z.number()),
  })),
})

// Full analysis response schema
const analysisResponseSchema = z.object({
  insights: z.array(insightSchema),
  summary: z.object({
    totalRows: z.number(),
    totalColumns: z.number(),
    numericColumns: z.array(z.string()),
    categoricalColumns: z.array(z.string()),
    dateColumns: z.array(z.string()),
  }),
  statistics: z.record(z.string(), z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    mean: z.number().nullable(),
    sum: z.number().nullable(),
    uniqueCount: z.number().nullable(),
  })),
  chartData: chartDataSchema.nullable(),
  feedbackAnalysis: feedbackAnalysisSchema.nullable(),
  documentAnalysis: documentAnalysisSchema.nullable(),
  dataType: z.enum(['numeric', 'feedback', 'document', 'mixed']),
})

export type InsightData = z.infer<typeof insightSchema>
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>

interface DatasetColumn {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
}

export async function POST(req: Request) {
  try {
    const { columns, data, fileName }: { 
      columns: DatasetColumn[]
      data: Record<string, unknown>[]
      fileName: string
    } = await req.json()

    if (!columns || !data || data.length === 0) {
      return Response.json(
        { error: 'No data provided for analysis' },
        { status: 400 }
      )
    }

    // Try AI-powered analysis first
    try {
        const dataPreview = JSON.stringify(data.slice(0, 100), null, 2)
        const columnInfo = columns.map(c => `${c.name} (${c.type})`).join(', ')
        
        // Detect data type
        const columnNames = columns.map(c => c.name.toLowerCase()).join(' ')
        const isFeedback = columnNames.includes('review') || columnNames.includes('feedback') || 
                          columnNames.includes('comment') || columnNames.includes('rating') ||
                          columnNames.includes('sentiment')
        const isDocument = data.length < 10 && columns.some(c => c.type === 'string' && 
          data.some(row => String(row[c.name] || '').length > 200))
        
        const dataType = isFeedback ? 'feedback' : isDocument ? 'document' : 'numeric'
        
        const result = await generateText({
          model: openai('gpt-4o-mini'),
          system: "Respond ONLY with valid JSON matching the requested structure. NO markdown formatting, NO extra text.",
          prompt: `You are an expert data analyst. Analyze the following dataset thoroughly and provide comprehensive insights.

File Name: "${fileName}"
Data Type Detected: ${dataType}
Columns: ${columnInfo}
Total Rows: ${data.length}

Data Sample (up to 100 rows):
${dataPreview}

Based on this REAL data, provide a complete analysis including:

1. **Insights**: Generate 5-8 actionable insights about the data. Each insight should:
   - Have a clear type (positive, negative, warning, or info)
   - Include specific numbers from the data
   - Be categorized (Trends, Performance, Data Quality, Distribution, etc.)
   - Include percentage changes where applicable

2. **Summary**: Provide accurate counts of:
   - Total rows and columns
   - Which columns are numeric, categorical, or date-based

3. **Statistics**: For each numeric column, calculate:
   - Min, max, mean, sum values
   - For categorical columns, count unique values

4. **Chart Data**: Generate chart-ready data with:
   - Labels from the most relevant categorical column
   - Datasets from numeric columns that make sense to visualize

5. **${dataType === 'feedback' ? 'Feedback Analysis' : dataType === 'document' ? 'Document Analysis' : 'Additional Analysis'}**:
${dataType === 'feedback' ? `
   - Identify 3-5 PROS (positive themes) with percentages
   - Identify 3-5 CONS (negative themes) with percentages  
   - Calculate overall sentiment score (0-100)
   - Count total reviews analyzed
` : dataType === 'document' ? `
   - Extract 5-10 key points from the content
   - Rate importance (high/medium/low)
   - Categorize each point
   - Provide a concise summary
` : `
   - Focus on trends and patterns in the numeric data
   - Identify outliers or anomalies
   - Suggest correlations between columns
`}

IMPORTANT:
- Use ACTUAL values from the data
- Calculate real statistics, don't estimate
- Be specific with numbers and percentages
- Generate unique IDs like "insight-1", "insight-2", etc.
- MUST respond in valid JSON format only, respecting this EXACT schema shape:
{
  "insights": [{"id": "insight-1", "type": "positive", "title": "Growth", "description": "...", "metric": "+5%", "change": 5.0, "category": "Trends"}],
  "summary": { "totalRows": 100, "totalColumns": 5, "numericColumns": ["revenue"], "categoricalColumns": ["region"], "dateColumns": ["date"] },
  "statistics": { "revenue": { "min": 0, "max": 100, "mean": 50, "sum": 500, "uniqueCount": 10 } },
  "chartData": { "labels": ["Jan"], "datasets": [{"label": "revenue", "data": [100]}] },
  "feedbackAnalysis": null,
  "documentAnalysis": null,
  "dataType": "numeric"
}`,
        })

        if (result.text) {
          const parsed = JSON.parse(result.text.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '').trim())
          return Response.json(parsed)
        }
    } catch (error) {
      console.error('AI analysis failed, falling back to statistical analysis:', error)
    }

    // Fallback to statistical analysis without AI
    const analysis = analyzeDataStatistically(columns, data, fileName)
    return Response.json(analysis)

  } catch (error) {
    console.error('Error analyzing data:', error)
    return Response.json(
      { error: 'Failed to analyze data' },
      { status: 500 }
    )
  }
}

// Statistical analysis fallback
function analyzeDataStatistically(
  columns: DatasetColumn[],
  data: Record<string, unknown>[],
  fileName: string
): AnalysisResponse {
  const numericColumns = columns.filter(c => c.type === 'number').map(c => c.name)
  const categoricalColumns = columns.filter(c => c.type === 'string').map(c => c.name)
  const dateColumns = columns.filter(c => c.type === 'date').map(c => c.name)
  
  const statistics: AnalysisResponse['statistics'] = {}
  const insights: InsightData[] = []
  
  // Analyze numeric columns
  numericColumns.forEach((colName, idx) => {
    const values = data
      .map(row => {
        const val = row[colName]
        if (val === null || val === undefined || val === '') return NaN
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''))
        return num
      })
      .filter(v => !isNaN(v))
    
    if (values.length === 0) {
      statistics[colName] = { min: null, max: null, mean: null, sum: null, uniqueCount: null }
      return
    }
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / values.length
    
    statistics[colName] = { min, max, mean, sum, uniqueCount: new Set(values).size }
    
    // Generate insight for this column
    if (values.length >= 3) {
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      const change = ((secondAvg - firstAvg) / firstAvg) * 100
      
      if (Math.abs(change) > 5) {
        insights.push({
          id: `insight-${idx + 1}`,
          type: change > 0 ? 'positive' : 'negative',
          title: change > 0 ? `Growth in ${colName}` : `Decline in ${colName}`,
          description: `${Math.abs(change).toFixed(1)}% ${change > 0 ? 'increase' : 'decrease'} detected in ${colName}.`,
          metric: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
          change: parseFloat(change.toFixed(1)),
          category: 'Trends',
        })
      }
    }
  })
  
  // Analyze categorical columns
  categoricalColumns.forEach(colName => {
    const valueCounts: Record<string, number> = {}
    data.forEach(row => {
      const val = String(row[colName] || 'Unknown')
      valueCounts[val] = (valueCounts[val] || 0) + 1
    })
    
    statistics[colName] = {
      min: null,
      max: null,
      mean: null,
      sum: null,
      uniqueCount: Object.keys(valueCounts).length,
    }
  })
  
  // Add overview insight
  insights.unshift({
    id: 'insight-0',
    type: 'info',
    title: 'Dataset Overview',
    description: `Analyzed "${fileName}" with ${data.length.toLocaleString()} rows and ${columns.length} columns.`,
    metric: `${data.length.toLocaleString()} records`,
    change: null,
    category: 'Overview',
  })
  
  // Generate chart data
  let chartData: AnalysisResponse['chartData'] = null
  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    const labelCol = categoricalColumns[0]
    const valueCounts: Record<string, Record<string, number>> = {}
    
    data.forEach(row => {
      const label = String(row[labelCol] || 'Unknown')
      if (!valueCounts[label]) valueCounts[label] = {}
      
      numericColumns.slice(0, 3).forEach(numCol => {
        const val = typeof row[numCol] === 'number' ? row[numCol] : parseFloat(String(row[numCol]).replace(/,/g, ''))
        if (!isNaN(val as number)) {
          valueCounts[label][numCol] = (valueCounts[label][numCol] || 0) + (val as number)
        }
      })
    })
    
    const labels = Object.keys(valueCounts).slice(0, 10)
    const datasets = numericColumns.slice(0, 3).map(numCol => ({
      label: numCol,
      data: labels.map(label => valueCounts[label][numCol] || 0),
    }))
    
    chartData = { labels, datasets }
  }
  
  // Detect data type
  const columnNames = columns.map(c => c.name.toLowerCase()).join(' ')
  const isFeedback = columnNames.includes('review') || columnNames.includes('feedback') || 
                    columnNames.includes('comment') || columnNames.includes('rating')
  const dataType = isFeedback ? 'feedback' : 'numeric'
  
  return {
    insights,
    summary: {
      totalRows: data.length,
      totalColumns: columns.length,
      numericColumns,
      categoricalColumns,
      dateColumns,
    },
    statistics,
    chartData,
    feedbackAnalysis: null,
    documentAnalysis: null,
    dataType: dataType as 'numeric' | 'feedback' | 'document' | 'mixed',
  }
}
