"use client"

import type React from "react"
import { useEnhancerStore } from "@/stores/enhancerStore"
import { Loader2 } from "lucide-react"

export const EnhancerPreview: React.FC = () => {
  const { inputImageUrl, outputImageUrl, jobStatus } = useEnhancerStore()

  const isLoading = jobStatus === "processing" || jobStatus === "starting"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Imagem Original */}
      <div className="space-y-2">
        <h3 className="font-medium">Original</h3>
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {inputImageUrl ? (
            <img src={inputImageUrl || "/placeholder.svg"} alt="Original" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Nenhuma imagem selecionada</p>
            </div>
          )}
        </div>
      </div>

      {/* Imagem Aprimorada */}
      <div className="space-y-2">
        <h3 className="font-medium">Aprimorada</h3>
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          {outputImageUrl ? (
            <img src={outputImageUrl || "/placeholder.svg"} alt="Enhanced" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-muted-foreground">
              <p>A imagem aprimorada aparecerá aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
