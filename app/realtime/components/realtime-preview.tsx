"use client"

import type React from "react"
import { useRealtimeStore } from "@/stores/realtimeStore"
import { Loader2 } from "lucide-react"

export const RealtimePreview: React.FC = () => {
  const { generatedImage, isLoading } = useRealtimeStore()

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-medium">Pré-visualização AI</h3>
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {generatedImage ? (
          <img
            src={generatedImage || "/placeholder.svg"}
            alt="AI Generated Preview"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-center text-muted-foreground">
            <p>A pré-visualização aparecerá aqui</p>
            <p className="text-sm mt-2">Desenhe no canvas ou digite um prompt</p>
          </div>
        )}
      </div>
    </div>
  )
}
