"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles } from "lucide-react"
import { useEditStore } from "@/stores/editStore"

interface ToolbarBottomProps {
  onGenerate: (prompt: string) => void
}

export const ToolbarBottom = ({ onGenerate }: ToolbarBottomProps) => {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { activeTool } = useEditStore()

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    await onGenerate(prompt)
    setIsGenerating(false)
  }

  // Determinar o placeholder com base na ferramenta ativa
  const getPlaceholder = () => {
    switch (activeTool) {
      case "brush":
        return "Descreva o que deve aparecer na área pintada..."
      case "eraser":
        return "Descreva o que deve substituir a área apagada..."
      case "text":
        return "Digite o texto a ser adicionado..."
      case "magic":
        return "Descreva o efeito mágico a ser aplicado..."
      case "realtime":
        return "Descreva a modificação em tempo real..."
      case "enhance":
        return "Descreva como melhorar a imagem..."
      default:
        return "Escreva o que você quer mudar na imagem e clique em gerar. Ex: 'Adicionar óculos de sol'"
    }
  }

  return (
    <div className="h-16 bg-black border-t border-gray-800 flex items-center px-4">
      <div className="flex-1 flex items-center gap-2 max-w-3xl mx-auto w-full">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-coral-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleGenerate()
            }
          }}
        />

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="bg-coral-500 hover:bg-coral-600 text-white"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Gerar
        </Button>
      </div>
    </div>
  )
}
