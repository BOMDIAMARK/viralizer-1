"use client"

import type React from "react"
import { useRealtimeStore } from "@/stores/realtimeStore"
import { Button } from "@/components/ui/button"
import { Download, Heart } from "lucide-react"

export const RealtimeHistory: React.FC = () => {
  const { history, loadSnapshot, addHistorySnapshot, generatedImage } = useRealtimeStore()

  const handleSaveSnapshot = () => {
    if (generatedImage) {
      addHistorySnapshot(generatedImage)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-medium mb-2">Histórico</h3>
        <Button size="sm" onClick={handleSaveSnapshot} disabled={!generatedImage} className="w-full">
          Salvar Snapshot
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {history.map((snapshot) => (
          <div
            key={snapshot.id}
            className="border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
            onClick={() => loadSnapshot(snapshot.id)}
          >
            <img
              src={snapshot.imageUrl || "/placeholder.svg"}
              alt={`Snapshot ${snapshot.id}`}
              className="w-full h-20 object-cover rounded mb-2"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{new Date(snapshot.timestamp).toLocaleTimeString()}</span>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm">
                  <Heart className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center text-muted-foreground text-sm">Nenhum snapshot salvo ainda</div>
        )}
      </div>
    </div>
  )
}
