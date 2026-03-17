import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'


const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

function calculateStatistics(data: Record<string, unknown>[]) {
  if (!data?.length) return null
  const columns = Object.keys(data[0] || {})
  const stats: Record<string, {
    type: 'numeric' | 'categorical'
    min?: number; max?: number; sum?: number; avg?: number; median?: number
    count: number
    uniqueValues?: string[]
    topValues?: { value: string; count: number }[]
  }> = {}

  columns.forEach(col => {
    const values = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '')
    const numericVals = values.map(v => {
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,$%]/g, ''))
      return isNaN(n) ? null : n
    }).filter((v): v is number => v !== null)

    if (numericVals.length > values.length * 0.7) {
      const sorted = [...numericVals].sort((a, b) => a - b)
      stats[col] = {
        type: 'numeric', count: numericVals.length,
        min: Math.min(...numericVals), max: Math.max(...numericVals),
        sum: numericVals.reduce((a, b) => a + b, 0),
        avg: numericVals.reduce((a, b) => a + b, 0) / numericVals.length,
        median: sorted[Math.floor(sorted.length / 2)],
      }
    } else {
      const counts: Record<string, number> = {}
      values.forEach(v => { const k = String(v); counts[k] = (counts[k] || 0) + 1 })
      stats[col] = {
        type: 'categorical', count: values.length,
        uniqueValues: Object.keys(counts).slice(0, 20),
        topValues: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([value, count]) => ({ value, count })),
      }
    }
  })
  return stats
}

type RawMessage = { role: string; content: unknown; parts?: { type: string; text?: string }[] }

function extractText(msg: RawMessage): string {
  // parts-based (AI SDK UIMessage format)
  if (Array.isArray(msg.parts)) {
    return msg.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text').map(p => p.text).join('')
  }
  // plain content string
  if (typeof msg.content === 'string') return msg.content
  // content array (OpenAI format)
  if (Array.isArray(msg.content)) {
    return (msg.content as { type: string; text?: string }[])
      .filter(c => c.type === 'text').map(c => c.text ?? '').join('')
  }
  return ''
}
const hardcodedMessages: Record<string, string> = {
  "What kind of data can I analyze?": "You can analyze any structured data provided in CSV format! Common use cases include:\n\n- **Financial Data**: Revenue, expenses, profit margins, and budget tracking.\n- **Sales Records**: Customer demographics, product performance, and regional trends.\n- **Operational Metrics**: Task completion rates, employee productivity, and resource allocation.\n\nSimply upload your file in the **Data Upload** section to get started.",
  "How do I upload my dataset?": "Uploading your data is easy:\n\n1. Go to the [Data Upload](/upload) page from the sidebar.\n2. Drag and drop your CSV file or click to browse.\n3. Wait for the analysis to complete.\n4. Once uploaded, your file will appear in the **File Library** on the dashboard, ready for chat analysis and visualization!",
  "Show me an example analysis": "## Example Analysis: Monthly Performance 2023\n\nI've generated an analysis based on a typical business performance dataset (similar to your `test_data_upload.csv`):\n\n### 📈 Executive Summary\n- **Total Revenue**: $828,000\n- **Total Profit**: $377,000\n- **Average Margin**: 45.5%\n\n### 🔍 Key Insights\n1. **Growth Trend**: Revenue showed a consistent upward trajectory, starting at $50k in January and peaking at $100k in December.\n2. **Profitability Peak**: The highest profit was recorded in the final quarter, sustained by strong performance in the 'Software' and 'Services' categories.\n3. **Category Breakdown**: 'Software' remains the dominant revenue driver, accounting for ~40% of total revenue.\n\n### 📊 Visualization\n```chart\n{\n  \"type\": \"line\",\n  \"title\": \"Revenue vs Profit Trend\",\n  \"data\": [\n    { \"label\": \"Jan\", \"value\": 50000 },\n    { \"label\": \"Mar\", \"value\": 60000 },\n    { \"label\": \"Jun\", \"value\": 70000 },\n    { \"label\": \"Sep\", \"value\": 85000 },\n    { \"label\": \"Dec\", \"value\": 100000 }\n  ]\n}\n```\n\nHow would you like to proceed with your own data?"
};

export async function POST(req: Request) {

  const { messages = [], datasetSchema, sampleData }: {
    messages: RawMessage[]
    datasetSchema?: string
    sampleData?: Record<string, unknown>[]
  } = await req.json()

  const lastMessage = extractText(messages[messages.length - 1] || {})
  if (hardcodedMessages[lastMessage]) {
    const text = hardcodedMessages[lastMessage]
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(`data: {"type":"start"}\n\n`)
        controller.enqueue(`data: {"type":"start-step"}\n\n`)
        controller.enqueue(`data: {"type":"text-start","id":"0"}\n\n`)
        controller.enqueue(`data: {"type":"text-delta","id":"0","delta":${JSON.stringify(text)}}\n\n`)
        controller.enqueue(`data: {"type":"text-end","id":"0"}\n\n`)
        controller.enqueue(`data: {"type":"finish-step"}\n\n`)
        controller.enqueue(`data: {"type":"finish","finishReason":"stop"}\n\n`)
        controller.enqueue(`data: [DONE]\n\n`)
        controller.close()
      },
    })
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'x-vercel-ai-ui-message-stream': 'v1',
      },
    })
  }


  let dataContext = ''
  if (sampleData?.length) {
    const columns = datasetSchema || Object.keys(sampleData[0] || {}).join(', ')
    const stats = calculateStatistics(sampleData)
    const sampleSize = Math.min(100, sampleData.length)
    dataContext = `\n\nDATASET INFO:\n- Columns: ${columns}\n- Total Rows: ${sampleData.length}\n\nSTATISTICS:\n${JSON.stringify(stats, null, 2)}\n\nSAMPLE DATA (${sampleSize} rows):\n${JSON.stringify(sampleData.slice(0, sampleSize), null, 2)}`
  } else {
    dataContext = `\nNO DATASET LOADED — ask the user to upload a CSV from the "Data Upload" page.`
  }

  const systemPrompt = `You are a professional data analyst. Provide insightful, detailed analysis in a conversational manner.

## RESPONSE STYLE:
- **Be Conversational & Detailed**: 2–4 paragraphs minimum for substantive questions.
- **Use Specific Numbers**: Always cite actual values from the data.
- **Format for Readability**: Use **bold** for key metrics, bullet points, markdown tables.
- **Provide Context**: Explain WHY numbers matter.

## CHART GENERATION:
Only include charts when user explicitly asks for a visualization/chart/graph:
\`\`\`chart
{"type": "bar|line|pie|area", "title": "Title", "data": [{"label": "A", "value": 100}]}
\`\`\`
${dataContext}`

  // Convert raw messages to ModelMessage format
  const modelMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: extractText(m),
    }))
    .filter(m => m.content.length > 0)

  try {
    const result = streamText({
      model: openai.chat('gpt-4o-mini'),
      system: systemPrompt,
      messages: modelMessages,
      abortSignal: req.signal,
    })
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to analyze data' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
