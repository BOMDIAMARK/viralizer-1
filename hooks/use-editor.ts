"use client"

import { useState, useCallback } from "react"
import { useErrorHandler, withErrorHandling } from "@/lib/error-handler"

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

  const { handleError, handleSuccess } = useErrorHandler()

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

      const { data, error } = await withErrorHandling(
        async () => {
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
            const errorData = await response.json()
            throw new Error(errorData.error || "Falha na geração")
          }

          return response.json()
        },
        { operation: "generateFromText", prompt: prompt.substring(0, 100) },
      )

      setState((prev) => ({ ...prev, isProcessing: false }))

      if (error) {
        handleError(error)
        return null
      }

      if (data) {
        const imageUrl = Array.isArray(data.result) ? data.result[0] : data.result
        addToHistory(imageUrl)
        setState((prev) => ({
          ...prev,
          variations: data.variations || [],
        }))
        handleSuccess("Imagem gerada com sucesso!")
        return data.result
      }

      return null
    },
    [addToHistory, handleError, handleSuccess],
  )

  const editWithPrompt = useCallback(
    async (prompt: string) => {
      if (!state.currentImage) {
        handleError(new Error("Nenhuma imagem selecionada"))
        return null
      }

      setState((prev) => ({ ...prev, isProcessing: true }))

      const { data, error } = await withErrorHandling(
        async () => {
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
            const errorData = await response.json()
            throw new Error(errorData.error || "Falha na edição")
          }

          return response.json()
        },
        { operation: "editWithPrompt", prompt: prompt.substring(0, 100) },
      )

      setState((prev) => ({ ...prev, isProcessing: false }))

      if (error) {
        handleError(error)
        return null
      }

      if (data) {
        const imageUrl = Array.isArray(data.result) ? data.result[0] : data.result
        addToHistory(imageUrl)
        setState((prev) => ({
          ...prev,
          variations: data.variations || [],
        }))
        handleSuccess("Imagem editada com sucesso!")
        return data.result
      }

      return null
    },
    [state.currentImage, addToHistory, handleError, handleSuccess],
  )

  const inpaint = useCallback(
    async (prompt: string, maskUrl: string) => {
      if (!state.currentImage) {
        handleError(new Error("Nenhuma imagem selecionada"))
        return null
      }

      setState((prev) => ({ ...prev, isProcessing: true }))

      const { data, error } = await withErrorHandling(
        async () => {
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
            const errorData = await response.json()
            throw new Error(errorData.error || "Falha no inpainting")
          }

          return response.json()
        },
        { operation: "inpaint", prompt: prompt.substring(0, 100) },
      )

      setState((prev) => ({ ...prev, isProcessing: false }))

      if (error) {
        handleError(error)
        return null
      }

      if (data) {
        const imageUrl = Array.isArray(data.result) ? data.result[0] : data.result
        addToHistory(imageUrl)
        setState((prev) => ({
          ...prev,
          variations: data.variations || [],
        }))
        handleSuccess("Área editada com sucesso!")
        return data.result
      }

      return null
    },
    [state.currentImage, addToHistory, handleError, handleSuccess],
  )

  const upscale = useCallback(async () => {
    if (!state.currentImage) {
      handleError(new Error("Nenhuma imagem selecionada"))
      return null
    }

    setState((prev) => ({ ...prev, isProcessing: true }))

    const { data, error } = await withErrorHandling(
      async () => {
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
          const errorData = await response.json()
          throw new Error(errorData.error || "Falha no upscale")
        }

        return response.json()
      },
      { operation: "upscale" },
    )

    setState((prev) => ({ ...prev, isProcessing: false }))

    if (error) {
      handleError(error)
      return null
    }

    if (data) {
      addToHistory(data.result)
      handleSuccess("Imagem ampliada com sucesso!")
      return data.result
    }

    return null
  }, [state.currentImage, addToHistory, handleError, handleSuccess])

  const removeBackground = useCallback(async () => {
    if (!state.currentImage) {
      handleError(new Error("Nenhuma imagem selecionada"))
      return null
    }

    setState((prev) => ({ ...prev, isProcessing: true }))

    const { data, error } = await withErrorHandling(
      async () => {
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
          const errorData = await response.json()
          throw new Error(errorData.error || "Falha na remoção de fundo")
        }

        return response.json()
      },
      { operation: "removeBackground" },
    )

    setState((prev) => ({ ...prev, isProcessing: false }))

    if (error) {
      handleError(error)
      return null
    }

    if (data) {
      addToHistory(data.result)
      handleSuccess("Fundo removido com sucesso!")
      return data.result
    }

    return null
  }, [state.currentImage, addToHistory, handleError, handleSuccess])

  const enhance = useCallback(async () => {
    if (!state.currentImage) {
      handleError(new Error("Nenhuma imagem selecionada"))
      return null
    }

    setState((prev) => ({ ...prev, isProcessing: true }))

    const { data, error } = await withErrorHandling(
      async () => {
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
          const errorData = await response.json()
          throw new Error(errorData.error || "Falha no enhancement")
        }

        return response.json()
      },
      { operation: "enhance" },
    )

    setState((prev) => ({ ...prev, isProcessing: false }))

    if (error) {
      handleError(error)
      return null
    }

    if (data) {
      addToHistory(data.result)
      handleSuccess("Imagem melhorada com sucesso!")
      return data.result
    }

    return null
  }, [state.currentImage, addToHistory, handleError, handleSuccess])

  const controlNet = useCallback(
    async (prompt: string) => {
      if (!state.currentImage) {
        handleError(new Error("Nenhuma imagem selecionada"))
        return null
      }

      setState((prev) => ({ ...prev, isProcessing: true }))

      const { data, error } = await withErrorHandling(
        async () => {
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
            const errorData = await response.json()
            throw new Error(errorData.error || "Falha no ControlNet")
          }

          return response.json()
        },
        { operation: "controlNet", prompt: prompt.substring(0, 100) },
      )

      setState((prev) => ({ ...prev, isProcessing: false }))

      if (error) {
        handleError(error)
        return null
      }

      if (data) {
        addToHistory(data.result)
        handleSuccess("Imagem transformada com sucesso!")
        return data.result
      }

      return null
    },
    [state.currentImage, addToHistory, handleError, handleSuccess],
  )

  const realtimeEdit = useCallback(
    async (prompt: string) => {
      if (!state.currentImage) {
        handleError(new Error("Nenhuma imagem selecionada"))
        return null
      }

      setState((prev) => ({ ...prev, isProcessing: true }))

      const { data, error } = await withErrorHandling(
        async () => {
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
            const errorData = await response.json()
            throw new Error(errorData.error || "Falha na edição em tempo real")
          }

          return response.json()
        },
        { operation: "realtimeEdit", prompt: prompt.substring(0, 100) },
      )

      setState((prev) => ({ ...prev, isProcessing: false }))

      if (error) {
        handleError(error)
        return null
      }

      if (data) {
        addToHistory(data.result)
        handleSuccess("Edição realizada com sucesso!")
        return data.result
      }

      return null
    },
    [state.currentImage, addToHistory, handleError, handleSuccess],
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
