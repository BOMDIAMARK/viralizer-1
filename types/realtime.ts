export interface HistorySnapshot {
  id: string
  imageUrl: string
  timestamp: string
}

export interface RealtimeUpdateData {
  prompt: string
  aiStrength: number
  inputMode: string
  canvasState: any
}
