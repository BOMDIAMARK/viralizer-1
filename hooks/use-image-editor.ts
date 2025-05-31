"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

type EditorOperation = "textToImage" | "imageToImage" | "inpainting" | "upscale" | "removeBackground"

interface EditorSettings {
  width?: number
  height?: number
  numOutputs?: number
  scale?: number
  [key: string]: any
}

export function useImageEditor() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [variations, setVariations] = useState<string[]>([])
  const { toast } = useToast()

  const processImage = async (
    operation: EditorOperation,
    options: {
      imageUrl?: string
      prompt?: string
      mask?: string
      settings?: EditorSettings
    },
  ) => {
    try {
      setIsProcessing(true)

      const response = await fetch("/api/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation,
          imageUrl: options.imageUrl || currentImage,
          prompt: options.prompt,
          mask: options.mask,
          settings: options.settings,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar imagem")
      }

      // Processar o resultado
      if (Array.isArray(data.result) && data.result.length > 0) {
        // Se retornou múltiplas imagens, salvar como variações
        setVariations(data.result)
        setCurrentImage(data.result[0])
      } else {
        // Se retornou uma única imagem
        setCurrentImage(data.result)
        // Adicionar à lista de variações se não existir
        if (!variations.includes(data.result)) {
          setVariations((prev) => [...prev, data.result])
        }
      }

      return data.result
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar a imagem",
        variant: "destructive",
      })
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const generateFromText = async (prompt: string, settings?: EditorSettings) => {
    return processImage("textToImage", { prompt, settings })
  }

  const editWithPrompt = async (prompt: string, settings?: EditorSettings) => {
    if (!currentImage) {
      toast({
        title: "Erro",
        description: "Nenhuma imagem selecionada para editar",
        variant: "destructive",
      })
      return null
    }
    return processImage("imageToImage", { prompt, settings })
  }

  const inpaint = async (prompt: string, mask: string, settings?: EditorSettings) => {
    if (!currentImage) {
      toast({
        title: "Erro",
        description: "Nenhuma imagem selecionada para editar",
        variant: "destructive",
      })
      return null
    }
    return processImage("inpainting", { prompt, mask, settings })
  }

  const upscale = async (settings?: EditorSettings) => {
    if (!currentImage) {
      toast({
        title: "Erro",
        description: "Nenhuma imagem selecionada para upscale",
        variant: "destructive",
      })
      return null
    }
    return processImage("upscale", { settings })
  }

  const removeBackground = async () => {
    if (!currentImage) {
      toast({
        title: "Erro",
        description: "Nenhuma imagem selecionada para remover fundo",
        variant: "destructive",
      })
      return null
    }
    return processImage("removeBackground", {})
  }

  const setImage = (imageUrl: string) => {
    setCurrentImage(imageUrl)
    if (!variations.includes(imageUrl)) {
      setVariations((prev) => [...prev, imageUrl])
    }
  }

  return {
    currentImage,
    setImage,
    variations,
    setVariations,
    isProcessing,
    generateFromText,
    editWithPrompt,
    inpaint,
    upscale,
    removeBackground,
  }
}
