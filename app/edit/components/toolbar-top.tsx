"use client"

import { Button } from "@/components/ui/button"
import { useEditStore } from "@/stores/editStore"
import { MousePointer, Paintbrush, Eraser, Type, Wand2, Scissors, ImageIcon, Layers, Zap, Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const ToolbarTop = () => {
  const { activeTool, setActiveTool } = useEditStore()

  const tools = [
    { id: "select", icon: MousePointer, label: "Selecionar" },
    { id: "brush", icon: Paintbrush, label: "Pincel" },
    { id: "eraser", icon: Eraser, label: "Borracha" },
    { id: "text", icon: Type, label: "Texto" },
    { id: "magic", icon: Wand2, label: "Mágica" },
    { id: "cut", icon: Scissors, label: "Recortar" },
    { id: "image", icon: ImageIcon, label: "Imagem" },
    { id: "layers", icon: Layers, label: "Camadas" },
    { id: "realtime", icon: Zap, label: "Tempo Real" },
    { id: "enhance", icon: Sparkles, label: "Melhorar" },
  ]

  return (
    <div className="h-12 bg-black border-b border-gray-800 flex items-center px-4">
      <TooltipProvider>
        <div className="flex items-center space-x-1">
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setActiveTool(tool.id)}
                  className={activeTool === tool.id ? "bg-coral-500 hover:bg-coral-600" : ""}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  )
}
