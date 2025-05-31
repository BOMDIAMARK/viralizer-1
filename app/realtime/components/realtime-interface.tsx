"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { RealtimeCanvas } from "./realtime-canvas"
import { RealtimePreview } from "./realtime-preview"
import { RealtimeToolbar } from "./realtime-toolbar"
import { RealtimeHistory } from "./realtime-history"
import { RealtimePrompt } from "./realtime-prompt"
import { RealtimeControls } from "./realtime-controls"
import { useRealtimeStore } from "@/stores/realtimeStore"

export const RealtimeInterface: React.FC = () => {
  const { prompt, aiStrength, inputMode, setGeneratedImage, addHistorySnapshot } = useRealtimeStore()

  const [canvasState, setCanvasState] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Simular conexão WebSocket
  useEffect(() => {
    setIsConnected(true)
    return () => setIsConnected(false)
  }, [])

  // Simular geração em tempo real
  useEffect(() => {
    if (isConnected && (canvasState || prompt)) {
      // Debounce para evitar muitas chamadas
      const timeoutId = setTimeout(() => {
        // Simular geração de imagem
        const mockImageUrl = `/placeholder.svg?height=512&width=512&text=Generated+Image`
        setGeneratedImage(mockImageUrl)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [prompt, aiStrength, inputMode, canvasState, isConnected, setGeneratedImage])

  return (
    <div className="h-[80vh] bg-white rounded-lg border overflow-hidden">
      <RealtimeToolbar />
      <div className="flex h-full">
        <div className="flex-1 flex">
          <div className="w-1/2 border-r">
            <RealtimeCanvas onStateChange={setCanvasState} />
          </div>
          <div className="w-1/2">
            <RealtimePreview />
          </div>
        </div>
        <div className="w-80 border-l">
          <RealtimeHistory />
        </div>
      </div>
      <div className="border-t">
        <RealtimePrompt />
        <RealtimeControls />
      </div>
    </div>
  )
}
