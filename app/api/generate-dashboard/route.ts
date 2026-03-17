import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

export const maxDuration = 60

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

const chartDataPointSchema = z.object({
  label: z.string(),
  values: z.record(z.string(), z.number()),
})

const chartSchema = z.object({
  id: z.string(),
  chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter']),
  title: z.string(),
  description: z.string(),
  xAxis: z.string().nullable(),
  yAxes: z.array(z.string()),
  insight: z.string(),
  data: z.array(chartDataPointSchema),
})

const kpiSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.string(),
  change: z.number().nullable(),
  changeLabel: z.string().nullable(),
})

const insightSchema = z.object({
  id: z.string(),
  type: z.enum(['positive', 'negative', 'warning', 'info']),
  title: z.string(),
  description: z.string(),
  metric: z.string().nullable(),
  change: z.number().nullable(),
})

const dashboardResponseSchema = z.object({
  summary: z.string(),
  kpis: z.array(kpiSchema),
  charts: z.array(chartSchema),
  insights: z.array(insightSchema),
  suggestedQueries: z.array(z.string()),
})

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>
export type ChartData = z.infer<typeof chartSchema>
export type KPIData = z.infer<typeof kpiSchema>
export type InsightData = z.infer<typeof insightSchema>

export async function POST(req: Request) {
  const { query, datasetSchema, sampleData }: { 
    query: string
    datasetSchema?: string 
    sampleData?: Record<string, unknown>[]
  } = await req.json()

  // If we have real data, try AI analysis first
  if (sampleData && sampleData.length > 0) {
    try {
      const dataPreview = JSON.stringify(sampleData.slice(0, 50), null, 2)
      const columns = datasetSchema || Object.keys(sampleData[0] || {}).join(', ')
      
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: "Respond ONLY with valid JSON matching the requested structure. NO markdown formatting, NO extra text.",
        prompt: `You are a data analyst. Analyze the following dataset and generate a comprehensive dashboard response.

User Query: "${query}"

Dataset Columns: ${columns}
Total Rows: ${sampleData.length}

Sample Data (first 50 rows):
${dataPreview}

Based on this REAL data, generate:
1. A summary that directly addresses the user's query with specific numbers from the data
2. 4 relevant KPIs with actual values calculated from the data
3. 3-4 charts that visualize the data meaningfully (use actual data points from the dataset)
4. 3-4 insights about patterns, trends, or anomalies you observe in the data
5. 4 suggested follow-up queries

IMPORTANT: 
- Use REAL values from the data, not made up numbers
- Generate unique IDs using format like "kpi-1", "chart-1", "insight-1"
- MUST respond in valid JSON format only, respecting this EXACT schema shape:
{
  "summary": "Specific analysis summary...",
  "kpis": [{"id":"kpi-1", "title":"Revenue", "value":"$10K", "change":5.2, "changeLabel":"vs last quarter"}],
  "charts": [{"id":"chart-1", "chartType":"bar", "title":"Sales", "description":"...", "xAxis":"region", "yAxes":["sales"], "insight":"...", "data":[{"label":"North", "values":{"sales":500}}]}],
  "insights": [{"id":"insight-1", "type":"positive", "title":"...", "description":"...", "metric":"+5%", "change":5.0}],
  "suggestedQueries": ["What are the top regions?"]
}`,
      })

      if (result.text) {
        const parsed = JSON.parse(result.text.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '').trim())
        return Response.json(parsed)
      }
    } catch (error) {
      console.error('AI analysis failed, falling back to statistical analysis:', error)
      // Fallback to statistical analysis with real data
      const dashboard = generateStatisticalDashboard(query, sampleData)
      return Response.json(dashboard)
    }
  }

  // Fallback to mock data generation if no data provided
  const dashboard = generateMockDashboard(query)
  return Response.json(dashboard)
}

// Statistical analysis function for real data
function generateStatisticalDashboard(query: string, data: Record<string, unknown>[]): DashboardResponse {
  const columns = Object.keys(data[0] || {})
  const numericCols = columns.filter(col => 
    data.some(row => typeof row[col] === 'number' || !isNaN(parseFloat(String(row[col]))))
  )
  const categoricalCols = columns.filter(col => !numericCols.includes(col))
  
  // Calculate statistics for numeric columns
  const stats: Record<string, { min: number; max: number; sum: number; avg: number; count: number }> = {}
  numericCols.forEach(col => {
    const values = data.map(row => {
      const val = row[col]
      return typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''))
    }).filter(v => !isNaN(v))
    
    if (values.length > 0) {
      stats[col] = {
        min: Math.min(...values),
        max: Math.max(...values),
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
      }
    }
  })
  
  // Generate KPIs from actual data
  const kpis: KPIData[] = numericCols.slice(0, 4).map((col, i) => {
    const s = stats[col]
    if (!s) return { id: `kpi-${i + 1}`, title: col, value: 'N/A', change: null, changeLabel: null }
    
    // Calculate trend (first half vs second half)
    const values = data.map(row => {
      const val = row[col]
      return typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''))
    }).filter(v => !isNaN(v))
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1)
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1)
    const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
    
    const formatValue = (v: number) => {
      if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
      if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`
      return v.toFixed(2)
    }
    
    return {
      id: `kpi-${i + 1}`,
      title: `Total ${col}`,
      value: formatValue(s.sum),
      change: parseFloat(change.toFixed(1)),
      changeLabel: 'trend',
    }
  })
  
  // Generate charts from actual data
  const charts: ChartData[] = []
  
  // Line chart for first numeric column over index
  if (numericCols[0] && stats[numericCols[0]]) {
    const col = numericCols[0]
    const sampleSize = Math.min(12, data.length)
    const step = Math.max(1, Math.floor(data.length / sampleSize))
    
    charts.push({
      id: 'chart-1',
      chartType: 'line',
      title: `${col} Trend`,
      description: `${col} values over data points`,
      xAxis: 'index',
      yAxes: [col],
      insight: `Average ${col}: ${stats[col].avg.toFixed(2)}`,
      data: Array.from({ length: sampleSize }, (_, i) => {
        const idx = i * step
        const row = data[idx] || data[data.length - 1]
        const val = typeof row[col] === 'number' ? row[col] : parseFloat(String(row[col]).replace(/,/g, ''))
        return {
          label: `Point ${i + 1}`,
          values: { [col]: isNaN(val as number) ? 0 : val as number },
        }
      }),
    })
  }
  
  // Bar chart for categorical breakdown
  if (categoricalCols[0] && numericCols[0]) {
    const catCol = categoricalCols[0]
    const numCol = numericCols[0]
    const grouped: Record<string, number> = {}
    
    data.forEach(row => {
      const cat = String(row[catCol] || 'Unknown')
      const val = typeof row[numCol] === 'number' ? row[numCol] : parseFloat(String(row[numCol]).replace(/,/g, ''))
      if (!isNaN(val as number)) {
        grouped[cat] = (grouped[cat] || 0) + (val as number)
      }
    })
    
    const sortedGroups = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 6)
    
    charts.push({
      id: 'chart-2',
      chartType: 'bar',
      title: `${numCol} by ${catCol}`,
      description: `Distribution of ${numCol} across ${catCol} categories`,
      xAxis: catCol,
      yAxes: [numCol],
      insight: `Top category: ${sortedGroups[0]?.[0] || 'N/A'}`,
      data: sortedGroups.map(([label, value]) => ({
        label,
        values: { [numCol]: value },
      })),
    })
  }
  
  // Pie chart for category distribution
  if (categoricalCols[0]) {
    const catCol = categoricalCols[0]
    const counts: Record<string, number> = {}
    data.forEach(row => {
      const cat = String(row[catCol] || 'Unknown')
      counts[cat] = (counts[cat] || 0) + 1
    })
    
    const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const total = sortedCounts.reduce((a, b) => a + b[1], 0)
    
    charts.push({
      id: 'chart-3',
      chartType: 'pie',
      title: `${catCol} Distribution`,
      description: `Breakdown by ${catCol}`,
      xAxis: null,
      yAxes: ['value'],
      insight: `${sortedCounts.length} unique categories`,
      data: sortedCounts.map(([label, count]) => ({
        label,
        values: { value: Math.round((count / total) * 100) },
      })),
    })
  }
  
  // Generate insights from actual data
  const insights: InsightData[] = []
  
  numericCols.slice(0, 2).forEach((col, i) => {
    const s = stats[col]
    if (!s) return
    
    const values = data.map(row => {
      const val = row[col]
      return typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''))
    }).filter(v => !isNaN(v))
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1)
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1)
    const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
    
    insights.push({
      id: `insight-${i + 1}`,
      type: change >= 0 ? 'positive' : 'negative',
      title: change >= 0 ? `Growth in ${col}` : `Decline in ${col}`,
      description: `${col} shows a ${Math.abs(change).toFixed(1)}% ${change >= 0 ? 'increase' : 'decrease'} trend.`,
      metric: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      change: parseFloat(change.toFixed(1)),
    })
  })
  
  insights.push({
    id: `insight-${insights.length + 1}`,
    type: 'info',
    title: 'Data Summary',
    description: `Dataset contains ${data.length} records across ${columns.length} columns.`,
    metric: `${data.length} rows`,
    change: null,
  })
  
  // Generate dynamic suggested queries based on the actual data
  const suggestedQueries: string[] = []
  
  if (numericCols.length > 0) {
    suggestedQueries.push(`What is the total and average ${numericCols[0]}?`)
    if (numericCols.length > 1) {
      suggestedQueries.push(`How does ${numericCols[0]} correlate with ${numericCols[1]}?`)
    }
  }
  
  if (categoricalCols.length > 0) {
    suggestedQueries.push(`Show ${numericCols[0] || 'data'} breakdown by ${categoricalCols[0]}`)
    if (categoricalCols.length > 1) {
      suggestedQueries.push(`Compare performance across different ${categoricalCols[1]} values`)
    }
  }
  
  suggestedQueries.push(`What are the top 5 and bottom 5 records?`)
  suggestedQueries.push(`Identify any outliers or unusual patterns in the data`)
  
  return {
    summary: `Analysis of "${query}" based on ${data.length} data points. Key metrics: ${numericCols.slice(0, 3).map(col => `${col}: ${stats[col]?.sum.toFixed(0) || 'N/A'} total`).join(', ')}.`,
    kpis,
    charts,
    insights,
    suggestedQueries: suggestedQueries.slice(0, 4),
  }
}

// Mock data fallback function
function generateMockDashboard(query: string): DashboardResponse {
  const queryLower = query.toLowerCase()
  
  const isRevenue = queryLower.includes('revenue') || queryLower.includes('sales') || queryLower.includes('income')
  const isUsers = queryLower.includes('user') || queryLower.includes('customer') || queryLower.includes('visitor')
  const isComparison = queryLower.includes('compare') || queryLower.includes('vs') || queryLower.includes('region')
  
  const summary = isRevenue 
    ? `Analysis of revenue metrics shows strong Q4 performance with 12.5% growth. Key drivers include electronics and subscription services.`
    : isUsers 
    ? `User engagement metrics indicate healthy growth with 24,521 active users this month. Retention rates improved by 8.2%.`
    : `Dashboard generated based on your query: "${query}". Key metrics show positive trends across major indicators.`

  const kpis: KPIData[] = isRevenue ? [
    { id: 'kpi-1', title: 'Total Revenue', value: '$284,532', change: 12.5, changeLabel: 'vs last month' },
    { id: 'kpi-2', title: 'Avg Order Value', value: '$127.45', change: 5.3, changeLabel: 'vs last month' },
    { id: 'kpi-3', title: 'Transactions', value: '2,234', change: 8.7, changeLabel: 'vs last month' },
    { id: 'kpi-4', title: 'Profit Margin', value: '23.4%', change: 2.1, changeLabel: 'vs last month' },
  ] : isUsers ? [
    { id: 'kpi-1', title: 'Active Users', value: '24,521', change: 8.2, changeLabel: 'vs last month' },
    { id: 'kpi-2', title: 'New Signups', value: '3,847', change: 15.3, changeLabel: 'vs last month' },
    { id: 'kpi-3', title: 'Retention Rate', value: '78.2%', change: 4.5, changeLabel: 'vs last month' },
    { id: 'kpi-4', title: 'Avg Session', value: '4m 32s', change: -2.1, changeLabel: 'vs last month' },
  ] : [
    { id: 'kpi-1', title: 'Total Revenue', value: '$284,532', change: 12.5, changeLabel: 'vs last month' },
    { id: 'kpi-2', title: 'Active Users', value: '24,521', change: 8.2, changeLabel: 'vs last month' },
    { id: 'kpi-3', title: 'Conversion Rate', value: '3.24%', change: -2.1, changeLabel: 'vs last month' },
    { id: 'kpi-4', title: 'Total Orders', value: '1,429', change: 15.3, changeLabel: 'vs last month' },
  ]

  const charts: ChartData[] = [
    {
      id: 'chart-1',
      chartType: 'line',
      title: isRevenue ? 'Revenue Trend' : isUsers ? 'User Growth' : 'Monthly Trend',
      description: isRevenue ? 'Monthly revenue over time' : 'Monthly active users',
      xAxis: 'month',
      yAxes: isRevenue ? ['revenue'] : ['users'],
      insight: 'Strong upward trend with 15% growth in the last quarter.',
      data: [
        { label: 'Jan', values: isRevenue ? { revenue: 40000 } : { users: 18000 } },
        { label: 'Feb', values: isRevenue ? { revenue: 38000 } : { users: 19200 } },
        { label: 'Mar', values: isRevenue ? { revenue: 42000 } : { users: 20100 } },
        { label: 'Apr', values: isRevenue ? { revenue: 45000 } : { users: 20800 } },
        { label: 'May', values: isRevenue ? { revenue: 43000 } : { users: 21500 } },
        { label: 'Jun', values: isRevenue ? { revenue: 47000 } : { users: 22300 } },
      ],
    },
    {
      id: 'chart-2',
      chartType: 'bar',
      title: isComparison ? 'Regional Comparison' : 'Performance by Category',
      description: isComparison ? 'Sales by region' : 'Revenue by category',
      xAxis: isComparison ? 'region' : 'category',
      yAxes: ['actual', 'target'],
      insight: 'Electronics leads with 23% above target.',
      data: isComparison ? [
        { label: 'North', values: { actual: 4000, target: 4500 } },
        { label: 'South', values: { actual: 3000, target: 3200 } },
        { label: 'East', values: { actual: 2000, target: 2800 } },
        { label: 'West', values: { actual: 2780, target: 3000 } },
      ] : [
        { label: 'Electronics', values: { actual: 12000, target: 9800 } },
        { label: 'Clothing', values: { actual: 8500, target: 9000 } },
        { label: 'Home', values: { actual: 6200, target: 6500 } },
        { label: 'Sports', values: { actual: 4100, target: 4000 } },
      ],
    },
    {
      id: 'chart-3',
      chartType: 'pie',
      title: isRevenue ? 'Revenue by Category' : 'User Distribution',
      description: isRevenue ? 'Category breakdown' : 'User segments',
      xAxis: null,
      yAxes: ['value'],
      insight: 'Top category represents 33% of total.',
      data: isRevenue ? [
        { label: 'Electronics', values: { value: 33 } },
        { label: 'Clothing', values: { value: 25 } },
        { label: 'Home', values: { value: 20 } },
        { label: 'Sports', values: { value: 12 } },
        { label: 'Other', values: { value: 10 } },
      ] : [
        { label: 'Premium', values: { value: 28 } },
        { label: 'Standard', values: { value: 45 } },
        { label: 'Free', values: { value: 22 } },
        { label: 'Enterprise', values: { value: 5 } },
      ],
    },
  ]

  const insights: InsightData[] = [
    {
      id: 'insight-1',
      type: 'positive',
      title: isRevenue ? 'Strong Revenue Growth' : 'User Growth Momentum',
      description: isRevenue 
        ? 'Revenue increased by 12.5% compared to last month.'
        : 'Active user count grew 8.2% month-over-month.',
      metric: isRevenue ? '+12.5%' : '+8.2%',
      change: isRevenue ? 12.5 : 8.2,
    },
    {
      id: 'insight-2',
      type: 'positive',
      title: 'Top Performer',
      description: isComparison 
        ? 'North region leads with highest sales.'
        : 'Electronics category outperforms with 23% above target.',
      metric: '+23%',
      change: 23,
    },
    {
      id: 'insight-3',
      type: 'warning',
      title: 'Area for Improvement',
      description: isRevenue 
        ? 'Profit margins decreased slightly by 1.2%.'
        : 'Average session duration dropped 2.1%.',
      metric: '-2.1%',
      change: -2.1,
    },
    {
      id: 'insight-4',
      type: 'info',
      title: 'Trend Analysis',
      description: 'Q4 projected to exceed annual targets by 8-12%.',
      metric: '+10%',
      change: null,
    },
  ]

  const suggestedQueries = isRevenue ? [
    'What products have the highest profit margins?',
    'Compare Q3 vs Q4 revenue performance',
    'Show customer lifetime value by segment',
    'Which marketing channels drive the most revenue?',
  ] : isUsers ? [
    'What is the user retention rate by cohort?',
    'Show daily active users trend',
    'Which features have the highest engagement?',
    'Compare mobile vs desktop user behavior',
  ] : [
    'Show revenue trends for the past 6 months',
    'What are the top performing products?',
    'Compare performance across regions',
    'What is the customer acquisition cost trend?',
  ]

  return {
    summary,
    kpis,
    charts,
    insights,
    suggestedQueries,
  }
}
