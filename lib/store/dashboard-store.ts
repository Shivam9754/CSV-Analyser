import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DataColumn {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  sampleValues?: unknown[]
}

export interface Dataset {
  id: string
  name: string
  columns: DataColumn[]
  rowCount: number
  data: Record<string, unknown>[]
  uploadedAt: Date
  size?: number // in bytes
}

export interface QueryHistoryItem {
  id: string
  query: string
  timestamp: Date
  chartTypes: string[]
  datasetId?: string
  datasetName?: string
  type: 'chat' | 'insights'
}

export interface ChatSession {
  id: string
  datasetId: string
  datasetName: string
  messages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[]
  createdAt: Date
  updatedAt: Date
}

interface DashboardStore {
  // Current active dataset
  dataset: Dataset | null
  hasDataset: boolean

  // All uploaded files library
  fileLibrary: Dataset[]

  // Query history
  queryHistory: QueryHistoryItem[]
  currentQuery: string

  // Chat sessions per dataset
  chatSessions: ChatSession[]

  // Actions
  setDataset: (dataset: Dataset | null) => void
  addToFileLibrary: (dataset: Dataset) => void
  removeFromFileLibrary: (id: string) => void
  selectDatasetFromLibrary: (id: string) => void

  addQueryHistory: (item: QueryHistoryItem) => void
  clearQueryHistory: () => void
  setCurrentQuery: (query: string) => void

  addChatSession: (session: ChatSession) => void
  updateChatSession: (id: string, messages: ChatSession['messages']) => void
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      dataset: null,
      hasDataset: false,
      fileLibrary: [],
      queryHistory: [],
      currentQuery: '',
      chatSessions: [],

      setDataset: (dataset) =>
        set({ dataset, hasDataset: dataset !== null }),

      addToFileLibrary: (dataset) =>
        set((state) => {
          // Avoid duplicates by name
          const exists = state.fileLibrary.find((f) => f.name === dataset.name)
          if (exists) {
            // Replace existing
            return {
              fileLibrary: state.fileLibrary.map((f) =>
                f.name === dataset.name ? dataset : f
              ),
            }
          }
          return { fileLibrary: [...state.fileLibrary, dataset] }
        }),

      removeFromFileLibrary: (id) =>
        set((state) => {
          const newLibrary = state.fileLibrary.filter((f) => f.id !== id)
          // If removing the active dataset, clear it
          const newDataset =
            state.dataset?.id === id ? null : state.dataset
          return {
            fileLibrary: newLibrary,
            dataset: newDataset,
            hasDataset: newDataset !== null,
          }
        }),

      selectDatasetFromLibrary: (id) =>
        set((state) => {
          const found = state.fileLibrary.find((f) => f.id === id)
          if (!found) return state
          return { dataset: found, hasDataset: true }
        }),

      addQueryHistory: (item) =>
        set((state) => ({
          queryHistory: [item, ...state.queryHistory].slice(0, 100),
        })),

      clearQueryHistory: () => set({ queryHistory: [] }),

      setCurrentQuery: (currentQuery) => set({ currentQuery }),

      addChatSession: (session) =>
        set((state) => ({
          chatSessions: [session, ...state.chatSessions].slice(0, 50),
        })),

      updateChatSession: (id, messages) =>
        set((state) => ({
          chatSessions: state.chatSessions.map((s) =>
            s.id === id ? { ...s, messages, updatedAt: new Date() } : s
          ),
        })),
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        fileLibrary: state.fileLibrary.map((f) => ({
          ...f,
          // Limit stored data to 500 rows per file to save space
          data: f.data.slice(0, 500),
        })),
        queryHistory: state.queryHistory,
        chatSessions: state.chatSessions,
      }),
    }
  )
)
