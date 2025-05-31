"use client"

import type React from "react"
import { useState } from "react"
import { AssetSelector } from "./asset-selector"
import { EnhancerPreview } from "./enhancer-preview"
import { EnhancerControls } from "./enhancer-controls"
import { useEnhancerStore } from "@/stores/enhancerStore"
import { toast } from "sonner"

export const EnhancerInterface: React.FC = () => {
  const {
    inputImageUrl,
    setInputImageUrl,
    enhancementParams,
    outputImageUrl,
    setOutputImageUrl,
    setJobId,
    setJobStatus,
    jobStatus,
    jobId,
  } = useEnhancerStore()

  const [isPolling, setIsPolling] = useState(false)

  // Iniciar processo de aprimoramento
  const handleEnhance = async () => {
    if (!inputImageUrl) {
      toast.error("Selecione uma imagem para aprimorar.")
      return
    }

    setJobStatus("processing")
    setJobId(null)
    setOutputImageUrl(null)
    setIsPolling(true)

    try {
      // Simular chamada para API (em produção, usar API real)
      const mockJobId = Date.now().toString()
      setJobId(mockJobId)
      toast.success("Aprimoramento iniciado...")

      // Simular processamento
      setTimeout(() => {
        const mockOutputUrl = `/placeholder.svg?height=1024&width=1024&text=Enhanced+Image`
        setOutputImageUrl(mockOutputUrl)
        setJobStatus("succeeded")
        setIsPolling(false)
        toast.success("Aprimoramento concluído!")
      }, 3000)
    } catch (error: any) {
      setJobStatus("failed")
      setIsPolling(false)
      toast.error(`Erro: ${error.message}`)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <AssetSelector onImageSelect={setInputImageUrl} />
        <div className="mt-8">
          <EnhancerPreview />
        </div>
      </div>
      <div>
        <EnhancerControls onEnhance={handleEnhance} />
      </div>
    </div>
  )
}
