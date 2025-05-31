"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, CheckCircle, AlertCircle, RefreshCw, Settings } from "lucide-react"

interface ReplicateStatus {
  configured: boolean
  connection?: {
    success: boolean
    latency?: number
    error?: string
  }
  hasToken: boolean
  hasCustomModel: boolean
}

export function ReplicateStatusIndicator() {
  const [status, setStatus] = useState<ReplicateStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkStatus = async () => {
    try {
      setIsLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch("/api/chat/stream", {
        signal: controller.signal,
      }).catch((err) => {
        console.warn("Erro na requisição:", err)
        return null
      })

      clearTimeout(timeoutId)

      if (!response || !response.ok) {
        console.warn("Resposta inválida ou erro:", response?.status)
        // Usar a nova variável de ambiente
        const isConfigured = process.env.NEXT_PUBLIC_REPLICATE_CONFIGURED === "true"
        setStatus({
          configured: isConfigured,
          hasToken: isConfigured,
          hasCustomModel: false,
          connection: { success: false, error: "Erro de comunicação com a API" },
        })
        return
      }

      const data = await response.json()
      setStatus(data.replicate)
    } catch (error) {
      console.error("Erro ao verificar status:", error)
      // Usar a nova variável de ambiente
      const isConfigured = process.env.NEXT_PUBLIC_REPLICATE_CONFIGURED === "true"
      setStatus({
        configured: isConfigured,
        hasToken: isConfigured,
        hasCustomModel: false,
        connection: { success: false, error: "Erro ao processar resposta" },
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await checkStatus()
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Verificando configuração...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao verificar status do Replicate</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5" />
          Status do Replicate
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status da Configuração */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Token configurado:</span>
          <Badge variant={status.hasToken ? "default" : "secondary"}>
            {status.hasToken ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Sim
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Não
              </>
            )}
          </Badge>
        </div>

        {/* Status da Conexão */}
        {status.connection && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Conexão:</span>
            <Badge variant={status.connection.success ? "default" : "destructive"}>
              {status.connection.success ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Online
                  {status.connection.latency && ` (${status.connection.latency}ms)`}
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Modelo Personalizado */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Modelo personalizado:</span>
          <Badge variant={status.hasCustomModel ? "default" : "outline"}>
            {status.hasCustomModel ? "Configurado" : "Padrão"}
          </Badge>
        </div>

        {/* Status Geral */}
        <div className="pt-2 border-t">
          {status.configured && status.connection?.success ? (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                <strong>IA Avançada Ativa!</strong> Todas as funcionalidades estão disponíveis.
              </AlertDescription>
            </Alert>
          ) : status.configured && !status.connection?.success ? (
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                <strong>Configurado mas offline.</strong> Verifique sua conexão de internet.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
              <Settings className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <strong>Modo Básico.</strong> Configure o REPLICATE_API_TOKEN para IA avançada.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Erro de Conexão */}
        {status.connection?.error && !status.connection.success && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <strong>Erro:</strong> {status.connection.error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
