import { create } from "zustand"

export type EditTool = "select" | "brush" | "eraser" | "text" | "magic" | "realtime"

interface EditState {
  activeTool: EditTool
  activeCanvas: any | null
  brushSize: number
  brushColor: string
  isDrawing: boolean
}

interface EditActions {
  setActiveTool: (tool: EditTool) => void
  setActiveCanvas: (canvas: any) => void
  setBrushSize: (size: number) => void
  setBrushColor: (color: string) => void
  setIsDrawing: (drawing: boolean) => void
}

export const useEditStore = create<EditState & EditActions>((set) => ({
  // Estado inicial
  activeTool: "select",
  activeCanvas: null,
  brushSize: 20,
  brushColor: "#ffffff",
  isDrawing: false,

  // Ações
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveCanvas: (canvas) => set({ activeCanvas: canvas }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushColor: (color) => set({ brushColor: color }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
}))
