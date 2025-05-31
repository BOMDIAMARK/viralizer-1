"use client"

import type React from "react"

import { CheckCircle2, ImageIcon, Images, ZoomIn } from "lucide-react"

interface IndicatorProps {
  valid: boolean
  label: string
  description: string
  icon: React.ReactNode
}

function Indicator({ valid, label, description, icon }: IndicatorProps) {
  return (
    <div
      className={`flex items-start p-3 rounded-md border ${valid ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30" : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30"}`}
    >
      <div className={`mr-3 mt-1 ${valid ? "text-green-500" : "text-amber-500"}`}>
        {valid ? <CheckCircle2 size={20} /> : icon}
      </div>
      <div>
        <p
          className={`font-medium ${valid ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}`}
        >
          {label}
        </p>
        <p className={`text-xs ${valid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
          {description}
        </p>
      </div>
    </div>
  )
}

interface ImageQualityIndicatorsProps {
  imageCount: number
  // For simplicity, we'll simulate resolution and diversity checks based on count
  // In a real app, you'd analyze image dimensions and potentially use AI for diversity
}

export function ImageQualityIndicators({ imageCount }: ImageQualityIndicatorsProps) {
  const quantityValid = imageCount >= 3 && imageCount <= 10
  // Simulate resolution: assume valid if enough images are provided for now
  const resolutionValid = imageCount >= 3
  // Simulate diversity: assume valid if enough images are provided
  const diversityValid = imageCount >= 3

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Análise de Qualidade das Imagens</h4>
      <Indicator
        valid={quantityValid}
        label="Quantidade de Imagens"
        description={
          quantityValid ? `${imageCount} imagens selecionadas.` : `Envie de 3 a 10 imagens. (Atual: ${imageCount})`
        }
        icon={<Images size={20} />}
      />
      <Indicator
        valid={resolutionValid}
        label="Resolução (Estimada)"
        description={
          resolutionValid
            ? "Ideal: Imagens com boa resolução (ex: 512px+)."
            : "Envie imagens com boa resolução para melhores resultados."
        }
        icon={<ZoomIn size={20} />}
      />
      <Indicator
        valid={diversityValid}
        label="Diversidade de Ângulos (Estimada)"
        description={
          diversityValid
            ? "Ideal: Imagens com ângulos e expressões variadas."
            : "Procure incluir imagens com ângulos e expressões diferentes."
        }
        icon={<ImageIcon size={20} />}
      />
      <p className="text-xs text-muted-foreground pt-1">
        Estes são indicadores estimados. Para melhores resultados, siga as dicas de qualidade. A análise real da
        qualidade das imagens é feita pelo modelo de IA durante o treinamento.
      </p>
    </div>
  )
}
