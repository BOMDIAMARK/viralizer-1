"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Upload, ImageIcon } from "lucide-react"

interface AssetSelectorProps {
  onImageSelect: (url: string) => void
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({ onImageSelect }) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onImageSelect(url)
    }
  }

  const handleSampleImage = () => {
    const sampleUrl = `/placeholder.svg?height=512&width=512&text=Sample+Image`
    onImageSelect(sampleUrl)
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-gray-400" />
        </div>

        <div>
          <h3 className="text-lg font-medium">Selecione uma imagem</h3>
          <p className="text-muted-foreground">Faça upload de uma imagem ou escolha uma das amostras</p>
        </div>

        <div className="flex justify-center space-x-4">
          <Button asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Upload
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </Button>

          <Button variant="outline" onClick={handleSampleImage}>
            Usar Amostra
          </Button>
        </div>
      </div>
    </div>
  )
}
