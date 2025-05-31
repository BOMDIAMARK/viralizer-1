"use client"

import type React from "react"
import { useRealtimeStore } from "@/stores/realtimeStore"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export const RealtimeControls: React.FC = () => {
  const { aiStrength, setAiStrength, brushSize, setBrushSize, brushColor, setBrushColor } = useRealtimeStore()

  return (
    <div className="p-4 space-y-4">
      <div>
        <Label className="text-sm font-medium">AI Strength: {aiStrength}%</Label>
        <Slider
          value={[aiStrength]}
          onValueChange={(value) => setAiStrength(value[0])}
          max={100}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Tamanho do Pincel: {brushSize}px</Label>
        <Slider
          value={[brushSize]}
          onValueChange={(value) => setBrushSize(value[0])}
          min={1}
          max={50}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Cor do Pincel</Label>
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="mt-2 w-full h-8 rounded border"
        />
      </div>
    </div>
  )
}
