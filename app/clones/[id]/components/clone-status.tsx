"use client"

// No more polling needed for this component if fast training is synchronous
// import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Download } from "lucide-react" // Removed Loader2, AlertTriangle, Progress
import type { Database } from "@/types/supabase"
import { CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertTriangle } from "lucide-react"

type Clone = Database["public"]["Tables"]["clones"]["Row"]

interface CloneStatusProps {
  initialClone: Clone // Renamed from 'clone' to 'initialClone' for clarity
}

interface CloneMetadata {
  steps?: number // From fast training
  provider?: string
  bytes_trained?: number
  fal_request_id?: string
  error?: string | { message?: string }
  // Keep falConfig for compatibility if you mix training types, or remove if only fast training
  falConfig?: {
    trigger_word?: string
    steps?: number
    // ... other old config fields
  }
  [key: string]: any
}

export default function CloneStatus({ initialClone }: CloneStatusProps) {
  // const [clone, setClone] = useState<Clone>(initialClone); // Not strictly needed if no polling
  const clone = initialClone // Directly use the prop
  // const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null)

  // useEffect(() => {
  //   setClone(initialClone) // Update if initialClone changes (e.g., parent re-fetches)
  // }, [initialClone])

  // useEffect(() => {
  //   if (
  //     clone.fal_train_id &&
  //     (clone.status === "training_queued" ||
  //       clone.status === "training_processing" ||
  //       clone.status === "pending_upload") // Add other transient states if any
  //   ) {
  //     const poll = async () => {
  //       try {
  //         const res = await fetch(`/api/fal-status/${clone.fal_train_id}`)
  //         if (!res.ok) {
  //           console.warn(`Polling for ${clone.fal_train_id} failed with status ${res.status}`)
  //           // Potentially stop polling on critical errors
  //           if (res.status === 404 && pollingIntervalId) {
  //             // Train ID not found on Fal, maybe deleted or wrong
  //             clearInterval(pollingIntervalId)
  //             setPollingIntervalId(null)
  //             setClone((prev) => ({
  //               ...prev,
  //               status: "training_failed",
  //               metadata: { ...((prev.metadata as CloneMetadata) || {}), error: "Train ID not found on Fal.ai" },
  //             }))
  //           }
  //           return
  //         }
  //         const data = await res.json()

  //         let newStatus = clone.status
  //         const newMetadata = (clone.metadata as CloneMetadata) || {}

  //         if (data.status === "processing") {
  //           newStatus = "training_processing"
  //           newMetadata.progress = data.metrics?.progress || newMetadata.progress
  //         } else if (data.status === "succeeded") {
  //           newStatus = "training_succeeded"
  //           newMetadata.progress = 100
  //           if (pollingIntervalId) clearInterval(pollingIntervalId)
  //           setPollingIntervalId(null)
  //         } else if (data.status === "failed") {
  //           newStatus = "training_failed"
  //           newMetadata.error = data.error?.message || data.error || "Fal.ai training failed"
  //           if (pollingIntervalId) clearInterval(pollingIntervalId)
  //           setPollingIntervalId(null)
  //         } else if (data.status === "queued") {
  //           newStatus = "training_queued"
  //           newMetadata.progress = data.metrics?.progress || 0
  //         }

  //         // Only update if there's a change to avoid re-renders
  //         if (newStatus !== clone.status || newMetadata.progress !== (clone.metadata as CloneMetadata)?.progress) {
  //           setClone((prev) => ({
  //             ...prev,
  //             status: newStatus,
  //             model_id: data.output?.model_id || prev.model_id, // Update model_id if succeeded
  //             metadata: newMetadata,
  //           }))
  //         }
  //       } catch (error) {
  //         console.error("Error polling Fal.ai status:", error)
  //         if (pollingIntervalId) clearInterval(pollingIntervalId) // Stop on network or parsing error
  //         setPollingIntervalId(null)
  //       }
  //     }

  //     poll() // Initial poll
  //     const intervalId = setInterval(poll, 7000) // Poll every 7 seconds
  //     setPollingIntervalId(intervalId)

  //     return () => {
  //       if (intervalId) clearInterval(intervalId)
  //       setPollingIntervalId(null)
  //     }
  //   } else {
  //     // If status is terminal, ensure no polling is active
  //     if (pollingIntervalId) {
  //       clearInterval(pollingIntervalId)
  //       setPollingIntervalId(null)
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [clone.fal_train_id, clone.status]) // Rerun effect if fal_train_id or status changes externally

  const metadata = clone.metadata as CloneMetadata | null

  const getStatusContent = () => {
    switch (clone.status) {
      case "training_succeeded": // Assuming this status is set by the action
      case "ready": // Alias for succeeded
        return (
          <div className="flex flex-col items-center p-4 space-y-3 text-center bg-green-50 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <p className="font-semibold text-green-700 dark:text-green-300">Clone Treinado com Sucesso!</p>
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              Pronto
            </Badge>
            {clone.model_id && ( // model_id now stores the .zip URL
              <div className="mt-2 w-full">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Link do LoRA (.zip):</p>
                <div className="flex items-center space-x-2">
                  <Input type="text" readOnly value={clone.model_id} className="flex-grow text-xs" />
                  <Button size="sm" asChild variant="outline">
                    <a href={clone.model_id} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-3 h-3 mr-1" /> Baixar
                    </a>
                  </Button>
                </div>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700 w-full text-left">
              <CardDescription className="text-xs text-green-600 dark:text-green-400 mb-1">
                Detalhes do Treinamento:
              </CardDescription>
              <ul className="text-xs text-green-600 dark:text-green-400 space-y-0.5">
                {clone.trigger_word && <li>Palavra-gatilho: {clone.trigger_word}</li>}
                {metadata?.steps && <li>Passos: {metadata.steps}</li>}
                {metadata?.bytes_trained && <li>Bytes Processados: {metadata.bytes_trained}</li>}
                {metadata?.provider && <li>Provedor: {metadata.provider}</li>}
              </ul>
            </div>
          </div>
        )
      case "training_failed":
        return (
          <div className="flex flex-col items-center p-4 space-y-2 text-center bg-red-50 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <p className="font-semibold text-red-700 dark:text-red-300">Falha no Treinamento</p>
            {metadata?.error && (
              <p className="text-xs text-red-600 dark:text-red-400 max-w-md break-words">
                Motivo:{" "}
                {typeof metadata.error === "string" ? metadata.error : metadata.error?.message || "Erro desconhecido"}
              </p>
            )}
            <Badge variant="destructive">Falhou</Badge>
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700 w-full text-left">
              <CardDescription className="text-xs text-red-600 dark:text-red-400 mb-1">
                Configuração Tentada:
              </CardDescription>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                {clone.trigger_word && <li>Palavra-gatilho: {clone.trigger_word}</li>}
                {metadata?.steps && <li>Passos: {metadata.steps}</li>}
              </ul>
            </div>
          </div>
        )
      case "training_queued": // Still possible if the action sets it before calling Fal
        return (
          <div className="flex flex-col items-center p-4 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Enviando para treinamento...</p>
          </div>
        )
      default:
        return (
          <div className="flex flex-col items-center p-4 space-y-2 text-center bg-gray-50 dark:bg-gray-800/30 rounded-lg">
            <AlertCircle className="w-10 h-10 text-gray-500" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">Status: {clone.status || "Desconhecido"}</p>
            <Badge variant="secondary">{clone.status || "Indefinido"}</Badge>
          </div>
        )
    }
  }
  // Add Input to the import from "@/components/ui/input" if not already there
  // Add CheckCircle, Download, LinkIcon to lucide-react imports

  return <div className="w-full p-4 border rounded-lg shadow-sm">{getStatusContent()}</div>
}
