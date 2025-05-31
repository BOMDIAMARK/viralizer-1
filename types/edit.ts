export interface ImageVersion {
  id: string
  url: string
  createdAt: Date
  prompt?: string
}

export interface EditStore {
  activeTool: string
  activeCanvas: any | null
  activeSelection: any[] | null
  history: any[]
  currentHistoryIndex: number

  setActiveTool: (tool: string) => void
  setActiveCanvas: (canvas: any) => void
  setActiveSelection: (selection: any[] | null) => void
  addToHistory: (state: any) => void
  undo: () => void
  redo: () => void
}
