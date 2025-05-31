"use client"

import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

interface FluxEditorState {
  originalImage: string | null
  editedImage: string | null
  prompt: string
  isProcessing: boolean
  error: string | null
  predictionId: string | null
  status: string | null // Replicate prediction status
}

const initialState: FluxEditorState = {
  originalImage: null,
  editedImage: null,
  prompt: "",
  isProcessing: false,
  error: null,
  predictionId: null,
  status: null,
}

export function useFluxEditor() {
  const [state, setState] = useState<FluxEditorState>(initialState)
  const { toast } = useToast()
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null)

  const setOriginalImage = useCallback((imageUrl: string | null) => {
    setState((prev) => ({
      ...prev,
      originalImage: imageUrl,
      editedImage: null,
      predictionId: null,
      status: null,
      error: null,
    }))
  }, [])

  const setPrompt = useCallback((prompt: string) => {
    setState((prev) => ({ ...prev, prompt }))
  }, [])

  const pollPredictionStatus = useCallback(
    async (predictionId: string) => {
      try {
        const response = await fetch(`/api/replicate-status/${predictionId}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch prediction status")
        }
        const prediction = await response.json()

        setState((prev) => ({ ...prev, status: prediction.status }))

        if (prediction.status === "succeeded") {
          setState((prev) => ({
            ...prev,
            editedImage: prediction.output?.[0] || null, // Flux-Kontext-Max returns an array
            isProcessing: false,
            error: null,
          }))
          if (pollingIntervalId) clearInterval(pollingIntervalId)
          setPollingIntervalId(null)
          toast({ title: "Sucesso!", description: "Imagem editada." })
        } else if (prediction.status === "failed" || prediction.status === "canceled") {
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            error: prediction.error || "Falha ao editar imagem.",
          }))
          if (pollingIntervalId) clearInterval(pollingIntervalId)
          setPollingIntervalId(null)
          toast({ title: "Erro", description: prediction.error || "Falha ao editar imagem.", variant: "destructive" })
        }
      } catch (err: any) {
        console.error("Polling error:", err)
        setState((prev) => ({ ...prev, isProcessing: false, error: err.message }))
        if (pollingIntervalId) clearInterval(pollingIntervalId)
        setPollingIntervalId(null)
        toast({ title: "Erro de Polling", description: err.message, variant: "destructive" })
      }
    },
    [toast, pollingIntervalId],
  )

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId)
      }
    }
  }, [pollingIntervalId])

  const submitEditRequest = useCallback(async () => {
    if (!state.originalImage || !state.prompt) {
      toast({ title: "Erro", description: "Imagem original e prompt são necessários.", variant: "destructive" })
      return
    }

    // Clear previous polling
    if (pollingIntervalId) clearInterval(pollingIntervalId)
    setPollingIntervalId(null)

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      error: null,
      editedImage: null,
      predictionId: null,
      status: "starting",
    }))

    try {
      // Resize image if necessary (client-side)
      const imageToEdit = await resizeImage(state.originalImage, 1024)

      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageToEdit, prompt: state.prompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao iniciar edição")
      }

      const { predictionId, status } = await response.json()
      setState((prev) => ({ ...prev, predictionId, status }))

      if (predictionId && (status === "starting" || status === "processing")) {
        // Start polling
        const intervalId = setInterval(() => pollPredictionStatus(predictionId), 5000) // Poll every 5 seconds
        setPollingIntervalId(intervalId)
      } else if (status === "succeeded") {
        // This case should ideally be handled by webhook or if API returns result directly
        // For now, assume polling will catch it or webhook updates DB.
        pollPredictionStatus(predictionId) // one quick check
      } else {
        setState((prev) => ({ ...prev, isProcessing: false, error: "Status inesperado: " + status }))
      }
    } catch (err: any) {
      console.error("Edit request error:", err)
      setState((prev) => ({ ...prev, isProcessing: false, error: err.message }))
      toast({ title: "Erro na Requisição", description: err.message, variant: "destructive" })
    }
  }, [state.originalImage, state.prompt, toast, pollPredictionStatus, pollingIntervalId])

  // Helper to resize image to max 1024px on longest side and convert to base64
  const resizeImage = (imageBase64: string, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          return reject(new Error("Failed to get canvas context"))
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/png")) // Or image/jpeg
      }
      img.onerror = (err) => reject(err)
      img.src = imageBase64
    })
  }

  return {
    ...state,
    setOriginalImage,
    setPrompt,
    submitEditRequest,
  }
}
