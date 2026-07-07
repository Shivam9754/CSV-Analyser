# Conversational BI — AI-Powered Business Intelligence Dashboard

A full-stack Next.js 15 app that lets you upload CSV files, chat with your data in natural language, and generate AI-powered insights.

---

## Features

- **File Library** — Upload multiple CSV files; they persist across browser sessions
- **Chat with Data** — Ask questions in plain English; get real-time AI analysis with optional charts
- **AI Insights** — Automatic statistical analysis, trend detection, charts, sentiment/feedback analysis
- **File Selector** — Switch between datasets in Chat and Insights without leaving the page
- **Multilingual** — English, Arabic, Japanese, Hindi
- **Themes** — Light/Dark mode + 4 accent colour options

---

## Quick Start

### 1. Install Node.js 18+
Download from https://nodejs.org

### 2. Install dependencies
```bash
npm install
```

### 3. Add your API key
Edit `.env.local`:
```
OPENAI_API_KEY=your_key_here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

**Get a free/cheap key:**
- **OpenRouter** (recommended): https://openrouter.ai — supports `gpt-4o-mini` cheaply
- **OpenAI**: https://platform.openai.com/api-keys

### 4. Run the dev server
```bash
npm run dev
```

Open **http://localhost:3000**

---

## How to Use

### Upload Files
1. Go to **Data Upload** in the sidebar
2. Drag & drop a CSV file or click to browse
3. Preview the data, then click **"Save to Library & Analyze"**
4. All uploaded files appear in the **File Library** panel on the right
5. Click any file to make it the **active dataset**

### Chat with Data
1. Go to **Chat** (home page)
2. Your active file is shown in the header
3. Click the 📁 file icon in the input bar to **switch datasets** without navigating away
4. Ask anything: "Show me the top 10 by revenue", "Find outliers", "What are the trends?"
5. Say "show chart" or "visualize X" to get inline charts

### Generate Insights
1. Go to **AI Insights**
2. Use the file selector at the top to pick which file to analyze
3. Click **"Generate Insights"**
4. Get statistics, charts, pros/cons (for feedback data), key points (for document data), and filterable insight cards

### History
- Every query is saved in **History**
- Click any past query to re-run it

---

## Project Structure

```
app/
  page.tsx              # Chat page (main)
  upload/page.tsx       # File upload + library
  insights/page.tsx     # AI insights
  history/page.tsx      # Query history
  settings/page.tsx     # Settings
  api/
    chat/route.ts              # Streaming chat API
    generate-dashboard/route.ts # Dashboard generation
    generate-insights/route.ts  # Insights generation

components/
  dashboard/            # Layout, sidebar, header, modals
  ui/                   # shadcn/ui components

lib/
  store/dashboard-store.ts   # Zustand state (file library, dataset, history)
  utils.ts

contexts/
  settings-context.tsx  # Language, theme, profile settings
```

---

## Build for Production

```bash
npm run build
npm start
```

---

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v3**
- **shadcn/ui**
- **AI SDK (Vercel)** — streaming chat
- **OpenAI / OpenRouter** — GPT-4o-mini
- **Recharts** — data visualizations
- **Zustand** — state management
- **PapaParse** — CSV parsing
- **Zod** — schema validation
# Conversational-BI
