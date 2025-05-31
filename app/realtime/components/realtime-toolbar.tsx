"use client"

import type React from "react"
import { useRealtimeStore } from "@/stores/realtimeStore"
import { Button } from "@/components/ui/button"
import { Brush, Eraser, Square, Circle, Type, Camera, Monitor } from "lucide-react"

export const RealtimeToolbar: React.FC = () => {
  const { activeTool, setActiveTool, inputMode, setInputMode } = useRealtimeStore()

  const tools = [
    { id: "brush", icon: Brush, label: "Pincel" },
    { id: "eraser", icon: Eraser, label: "Borracha" },
    { id: "square", icon: Square, label: "Quadrado" },
    { id: "circle", icon: Circle, label: "Círculo" },
  ]

  const modes = [
    { id: "compose", icon: Brush, label: "Compose" },
    { id: "text", icon: Type, label: "Text" },
    { id: "camera", icon: Camera, label: "Camera" },
    { id: "screen", icon: Monitor, label: "Screen" },
  ]

  return (
    <div className="h-12 bg-gray-50 border-b flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium mr-2">Modo:</span>
        {modes.map((mode) => (
          <Button
            key={mode.id}
            variant={inputMode === mode.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setInputMode(mode.id as any)}
          >
            <mode.icon className="h-4 w-4 mr-1" />
            {mode.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium mr-2">Ferramentas:</span>
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTool(tool.id)}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  )
}
