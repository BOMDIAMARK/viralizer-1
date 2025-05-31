"use client"

import { useState, useCallback } from "react"

interface EditorState {
  currentImage: string | null
  variations: string[]
  isProcessing: boolean
  history: string[]
  historyIndex: number
}

export function useEditor() {
  const [state, setState] = useState<EditorState>({
    currentImage: null,
    variations: [],
    isProcessing: false,
    history: [],
    historyIndex: -1,
  })

  const setImage = useCallback((imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      currentImage: imageUrl,
      history: [...prev.history.slice(0, prev.historyIndex + 1), imageUrl],
      historyIndex: prev.historyIndex + 1,
    }))
  }, [])

  const addToHistory = useCallback((imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      currentImage: imageUrl,
      history: [...prev.history.slice(0, prev.historyIndex + 1), imageUrl],
      historyIndex: prev.historyIndex + 1,
    }))
  }, [])

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1
        return {
          ...prev,
          currentImage: prev.history[newIndex],
          historyIndex: newIndex,
        }
      }
      return prev
    })
  }, [])

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1
        return {
          ...prev,
          currentImage: prev.history[newIndex],
          historyIndex: newIndex,
        }
      }
      return prev
    })
  }, [])

  const generateFromText = useCallback(
    async (prompt: string) => {
      setState((prev) => ({ ...prev, isProcessing: true }))

      try {
        const response = await fetch("/api/editor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generate",
            prompt,
          }),
        })

        if (!response.ok) {
          throw new Error("Falha na geração")
        }

        const data = await response.json()
        const imageUrl = Array.isArray(data.result) ? data.result[0] : data.result

        addToHistory(imageUrl)

        // Gerar variações
        setState((prev) => ({
          ...prev,
          variations: data.variations || [],
          isProcessing: false,
        }))
      } catch (error) {
        console.error("Erro ao gerar imagem:", error)
        setState((prev) => ({ ...prev, isProcessing: false }))
        throw error
      }
    },
    [addToHistory],
  )

  const editWithPrompt = useCallback(
    async (prompt: string) => {
      if (!state.currentImage) return

      setState((prev) => ({ ...prev, isProcessing: true }))

      try {
        const response = await fetch("/api/editor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "edit",
            prompt,
            imageUrl: state.currentImage,
          }),
        })

        if (!response.ok) {
          throw new Error("Falha na edição")
        }

        const data = await response.json()
        const imageUrl = Array.isArray(data.result) ? data.result[0] : data.result

        addToHistory(imageUrl)

        setState((prev) => ({
          ...prev,
          variations: data.variations || [],
          isProcessing: false,
        }))
      } catch (error) {
        console.error("Erro ao editar imagem:", error)
        setState((prev) => ({ ...prev, isProcessing: false }))
        throw error
      }
    },
    [state.currentImage, addToHistory],
  )

  const inpaint = useCallback(
    async (prompt: string, maskUrl: string) => {
      if (!state.currentImage) return

      setState((prev) => ({ ...prev, isProcessing: true }))

      try {
        const response = await fetch("/api/editor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "inpaint",
            prompt,
            imageUrl: state.currentImage,
            maskUrl,
          }),
        })

        if (!response.ok) {
          throw new Error("Falha no inpainting")
        }

        const data = await response.json()
        const imageUrl = Array.isArray(data.result) ? data.result[0] : data.result

        addToHistory(imageUrl)

        setState((prev) => ({
          ...prev,
          variations: data.variations || [],
          isProcessing: false,
        }))
      } catch (error) {
        console.error("Erro no inpainting:", error)
        setState((prev) => ({ ...prev, isProcessing: false }))
        throw error
      }
    },
    [state.currentImage, addToHistory],
  )

  const upscale = useCallback(async () => {
    if (!state.currentImage) return

    setState((prev) => ({ ...prev, isProcessing: true }))

    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "upscale",
          imageUrl: state.currentImage,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha no upscale")
      }

      const data = await response.json()
      addToHistory(data.result)

      setState((prev) => ({ ...prev, isProcessing: false }))
    } catch (error) {
      console.error("Erro no upscale:", error)
      setState((prev) => ({ ...prev, isProcessing: false }))
      throw error
    }
  }, [state.currentImage, addToHistory])

  const removeBackground = useCallback(async () => {
    if (!state.currentImage) return

    setState((prev) => ({ ...prev, isProcessing: true }))

    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "removeBackground",
          imageUrl: state.currentImage,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha na remoção de fundo")
      }

      const data = await response.json()
      addToHistory(data.result)

      setState((prev) => ({ ...prev, isProcessing: false }))
    } catch (error) {
      console.error("Erro na remoção de fundo:", error)
      setState((prev) => ({ ...prev, isProcessing: false }))
      throw error
    }
  }, [state.currentImage, addToHistory])

  const enhance = useCallback(async () => {
    if (!state.currentImage) return

    setState((prev) => ({ ...prev, isProcessing: true }))

    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "enhance",
          imageUrl: state.currentImage,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha no enhancement")
      }

      const data = await response.json()
      addToHistory(data.result)

      setState((prev) => ({ ...prev, isProcessing: false }))
    } catch (error) {
      console.error("Erro no enhancement:", error)
      setState((prev) => ({ ...prev, isProcessing: false }))
      throw error
    }
  }, [state.currentImage, addToHistory])

  const controlNet = useCallback(
    async (prompt: string) => {
      if (!state.currentImage) return

      setState((prev) => ({ ...prev, isProcessing: true }))

      try {
        const response = await fetch("/api/editor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "controlnet",
            prompt,
            imageUrl: state.currentImage,
          }),
        })

        if (!response.ok) {
          throw new Error("Falha no ControlNet")
        }

        const data = await response.json()
        addToHistory(data.result)

        setState((prev) => ({ ...prev, isProcessing: false }))
      } catch (error) {
        console.error("Erro no ControlNet:", error)
        setState((prev) => ({ ...prev, isProcessing: false }))
        throw error
      }
    },
    [state.currentImage, addToHistory],
  )

  const realtimeEdit = useCallback(
    async (prompt: string) => {
      if (!state.currentImage) return

      setState((prev) => ({ ...prev, isProcessing: true }))

      try {
        const response = await fetch("/api/editor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "realtime",
            prompt,
            imageUrl: state.currentImage,
          }),
        })

        if (!response.ok) {
          throw new Error("Falha na edição em tempo real")
        }

        const data = await response.json()
        addToHistory(data.result)

        setState((prev) => ({ ...prev, isProcessing: false }))
      } catch (error) {
        console.error("Erro na edição em tempo real:", error)
        setState((prev) => ({ ...prev, isProcessing: false }))
        throw error
      }
    },
    [state.currentImage, addToHistory],
  )

  return {
    currentImage: state.currentImage,
    variations: state.variations,
    isProcessing: state.isProcessing,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    setImage,
    generateFromText,
    editWithPrompt,
    inpaint,
    upscale,
    removeBackground,
    enhance,
    controlNet,
    realtimeEdit,
    undo,
    redo,
  }
}
