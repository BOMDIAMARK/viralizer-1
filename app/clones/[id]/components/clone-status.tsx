"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Loader2, AlertTriangle } from "lucide-react"
import type { Database } from "@/types/supabase"

type Clone = Database["public"]["Tables"]["clones"]["Row"]

interface CloneStatusProps {
  initialClone: Clone
}

// Define a more specific type for metadata if possible, or use any for now
interface CloneMetadata {
  progress?: number
  error?: string | { message?: string }
  falConfig?: any
  [key: string]: any // Allow other properties
}

export default function CloneStatus({ initialClone }: CloneStatusProps) {
  const [clone, setClone] = useState<Clone>(initialClone)
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setClone(initialClone) // Update if initialClone changes (e.g., parent re-fetches)
  }, [initialClone])

  useEffect(() => {
    if (
      clone.fal_train_id &&
      (clone.status === "training_queued" ||
        clone.status === "training_processing" ||
        clone.status === "pending_upload") // Add other transient states if any
    ) {
      const poll = async () => {
        try {
          const res = await fetch(`/api/fal-status/${clone.fal_train_id}`)
          if (!res.ok) {
            console.warn(`Polling for ${clone.fal_train_id} failed with status ${res.status}`)
            // Potentially stop polling on critical errors
            if (res.status === 404 && pollingIntervalId) {
              // Train ID not found on Fal, maybe deleted or wrong
              clearInterval(pollingIntervalId)
              setPollingIntervalId(null)
              setClone((prev) => ({
                ...prev,
                status: "training_failed",
                metadata: { ...((prev.metadata as CloneMetadata) || {}), error: "Train ID not found on Fal.ai" },
              }))
            }
            return
          }
          const data = await res.json()

          let newStatus = clone.status
          const newMetadata = (clone.metadata as CloneMetadata) || {}

          if (data.status === "processing") {
            newStatus = "training_processing"
            newMetadata.progress = data.metrics?.progress || newMetadata.progress
          } else if (data.status === "succeeded") {
            newStatus = "training_succeeded"
            newMetadata.progress = 100
            if (pollingIntervalId) clearInterval(pollingIntervalId)
            setPollingIntervalId(null)
          } else if (data.status === "failed") {
            newStatus = "training_failed"
            newMetadata.error = data.error?.message || data.error || "Fal.ai training failed"
            if (pollingIntervalId) clearInterval(pollingIntervalId)
            setPollingIntervalId(null)
          } else if (data.status === "queued") {
            newStatus = "training_queued"
            newMetadata.progress = data.metrics?.progress || 0
          }

          // Only update if there's a change to avoid re-renders
          if (newStatus !== clone.status || newMetadata.progress !== (clone.metadata as CloneMetadata)?.progress) {
            setClone((prev) => ({
              ...prev,
              status: newStatus,
              model_id: data.output?.model_id || prev.model_id, // Update model_id if succeeded
              metadata: newMetadata,
            }))
          }
        } catch (error) {
          console.error("Error polling Fal.ai status:", error)
          if (pollingIntervalId) clearInterval(pollingIntervalId) // Stop on network or parsing error
          setPollingIntervalId(null)
        }
      }

      poll() // Initial poll
      const intervalId = setInterval(poll, 7000) // Poll every 7 seconds
      setPollingIntervalId(intervalId)

      return () => {
        if (intervalId) clearInterval(intervalId)
        setPollingIntervalId(null)
      }
    } else {
      // If status is terminal, ensure no polling is active
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId)
        setPollingIntervalId(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clone.fal_train_id, clone.status]) // Rerun effect if fal_train_id or status changes externally

  const metadata = clone.metadata as CloneMetadata | null

  const getStatusContent = () => {
    switch (clone.status) {
      case "training_succeeded":
        return (
          <div className="flex flex-col items-center p-4 space-y-2 text-center bg-green-50 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <p className="font-semibold text-green-700 dark:text-green-300">Clone Treinado com Sucesso!</p>
            <p className="text-xs text-green-600 dark:text-green-400">Modelo ID: {clone.model_id || "N/A"}</p>
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              Pronto para Uso
            </Badge>
          </div>
        )
      case "training_processing":
      case "training_queued":
      case "pending_upload": // Generic "in progress"
        return (
          <div className="flex flex-col items-center p-4 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {clone.status === "training_queued" ? "Na fila para treinamento..." : "Treinamento em Progresso..."}
            </p>
            <Progress value={metadata?.progress || 0} className="w-full max-w-xs" />
            <p className="text-xs text-muted-foreground">{(metadata?.progress || 0).toFixed(0)}% concluído</p>
          </div>
        )
      case "training_failed":
        return (
          <div className="flex flex-col items-center p-4 space-y-2 text-center bg-red-50 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <p className="font-semibold text-red-700 dark:text-red-300">Falha no Treinamento</p>
            {metadata?.error && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Motivo:{" "}
                {typeof metadata.error === "string" ? metadata.error : metadata.error?.message || "Erro desconhecido"}
              </p>
            )}
            <Badge variant="destructive">Falhou</Badge>
          </div>
        )
      default: // Includes 'draft', 'archived', or any other non-training status
        return (
          <div className="flex flex-col items-center p-4 space-y-2 text-center bg-gray-50 dark:bg-gray-800/30 rounded-lg">
            <AlertCircle className="w-10 h-10 text-gray-500" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">Status: {clone.status || "Desconhecido"}</p>
            <Badge variant="secondary">{clone.status || "Indefinido"}</Badge>
          </div>
        )
    }
  }

  return <div className="w-full p-4 border rounded-lg shadow-sm">{getStatusContent()}</div>
}
