"use client"

import type React from "react"
import { useRealtimeStore } from "@/stores/realtimeStore"
import { Input } from "@/components/ui/input"

export const RealtimePrompt: React.FC = () => {
  const { prompt, setPrompt } = useRealtimeStore()

  return (
    <div className="p-4 border-b">
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Descreva o que você quer gerar..."
        className="w-full"
      />
    </div>
  )
}
