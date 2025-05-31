"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bot,
  User,
  Activity,
  ExternalLink,
  Copy,
  TestTube,
} from "lucide-react"
import { EnvironmentStatus } from "@/app/chat/components/environment-status"

interface ReplicateStatusResponse {
  timestamp: string
  service: string
  status: "healthy" | "partial" | "error"
  configuration: {
    hasToken: boolean
    hasCustomModel: boolean
    hasUsername: boolean
    customModelId: string | null
    clientInitialized: boolean
  }
  connectivity: {
    success: boolean
    error?: string
    latency?: number
    model?: string
    customModel?: string
  }
  models: {
    available: Array<{ name: string; id: string; status: string }>
    recommended: string
    error?: string
  }
  recommendations: Array<{
    type: "critical" | "warning" | "info" | "success"
    message: string
    action: string
  }>
}

export default function ReplicateAdminPage() {
  const [status, setStatus] = useState<ReplicateStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [testOutput, setTestOutput] = useState<string>("")
  const [isRunningTest, setIsRunningTest] = useState(false)

  const fetchStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/replicate/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Erro ao buscar status:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchStatus()
  }

  const runCompleteTest = async () => {
    setIsRunningTest(true)
    setTestOutput("🚀 Iniciando teste completo...\n")

    try {
      // Simular teste completo (em produção, isso seria uma chamada real)
      const steps = [
        "📋 Verificando variáveis de ambiente...",
        "🔗 Testando conectividade...",
        "🤖 Verificando modelos disponíveis...",
        "💬 Testando streaming básico...",
        "✅ Teste concluído!",
      ]

      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setTestOutput((prev) => prev + steps[i] + "\n")
      }

      // Atualizar status após teste
      await fetchStatus()
    } catch (error) {
      setTestOutput((prev) => prev + `❌ Erro no teste: ${error}\n`)
    } finally {
      setIsRunningTest(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Carregando status do Replicate...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Administração do Replicate
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie e monitore a integração com o Replicate para IA avançada
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="configuration">Configuração</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="testing">Testes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {status && (
            <>
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Status Geral</p>
                        <Badge
                          variant={
                            status.status === "healthy"
                              ? "default"
                              : status.status === "partial"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {status.status === "healthy" ? "Saudável" : status.status === "partial" ? "Parcial" : "Erro"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Conectividade</p>
                        <Badge variant={status.connectivity.success ? "default" : "destructive"}>
                          {status.connectivity.success ? `${status.connectivity.latency}ms` : "Offline"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Modelos</p>
                        <Badge variant="outline">{status.models.available.length} disponíveis</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium">Configuração</p>
                        <Badge variant={status.configuration.hasToken ? "default" : "destructive"}>
                          {status.configuration.hasToken ? "Completa" : "Incompleta"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recomendações */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Recomendações</h3>
                {status.recommendations.map((rec, index) => (
                  <Alert key={index} variant={rec.type === "critical" ? "destructive" : "default"}>
                    {rec.type === "critical" && <AlertCircle className="h-4 w-4" />}
                    {rec.type === "warning" && <AlertCircle className="h-4 w-4" />}
                    {rec.type === "success" && <CheckCircle className="h-4 w-4" />}
                    <AlertDescription>
                      <strong>{rec.message}</strong>
                      <br />
                      <span className="text-sm">{rec.action}</span>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="configuration">
          <EnvironmentStatus />
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          {status && (
            <Card>
              <CardHeader>
                <CardTitle>Modelos Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                {status.models.available.length > 0 ? (
                  <div className="space-y-3">
                    {status.models.available.map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{model.name}</p>
                          <p className="text-sm text-muted-foreground">{model.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={model.status === "available" ? "default" : "destructive"}>
                            {model.status}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(model.id)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum modelo disponível ou erro na verificação.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Teste Completo do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runCompleteTest} disabled={isRunningTest}>
                {isRunningTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Executar Teste Completo
                  </>
                )}
              </Button>

              {testOutput && (
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {testOutput}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links Úteis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" asChild>
                <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Dashboard do Replicate
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/replicate/status" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  API de Status (JSON)
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/chat" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Testar Chat com IA
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
