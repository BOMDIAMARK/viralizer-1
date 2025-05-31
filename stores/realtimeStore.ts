import { create } from "zustand"
import type { HistorySnapshot } from "@/types/realtime"

interface RealtimeStore {
  // Estado
  prompt: string
  aiStrength: number
  inputMode: "compose" | "text" | "screen" | "camera"
  activeTool: string
  brushColor: string
  brushSize: number
  generatedImage: string | null
  isLoading: boolean
  history: HistorySnapshot[]

  // Ações
  setPrompt: (prompt: string) => void
  setAiStrength: (strength: number) => void
  setInputMode: (mode: "compose" | "text" | "screen" | "camera") => void
  setActiveTool: (tool: string) => void
  setBrushColor: (color: string) => void
  setBrushSize: (size: number) => void
  setGeneratedImage: (imageUrl: string | null) => void
  setIsLoading: (loading: boolean) => void
  addHistorySnapshot: (imageUrl: string) => void
  loadSnapshot: (snapshotId: string) => void
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  // Estado inicial
  prompt: "",
  aiStrength: 50,
  inputMode: "compose",
  activeTool: "brush",
  brushColor: "#000000",
  brushSize: 5,
  generatedImage: null,
  isLoading: false,
  history: [],

  // Ações
  setPrompt: (prompt) => set({ prompt }),
  setAiStrength: (strength) => set({ aiStrength: strength }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setBrushColor: (color) => set({ brushColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setGeneratedImage: (imageUrl) => set({ generatedImage: imageUrl, isLoading: false }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  addHistorySnapshot: (imageUrl) =>
    set((state) => {
      const newSnapshot: HistorySnapshot = {
        id: Date.now().toString(),
        imageUrl,
        timestamp: new Date().toISOString(),
      }
      return { history: [...state.history, newSnapshot] }
    }),

  loadSnapshot: (snapshotId) => {
    const snapshot = get().history.find((s) => s.id === snapshotId)
    if (snapshot) {
      set({ generatedImage: snapshot.imageUrl })
    }
  },
}))
